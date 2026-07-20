#!/usr/bin/env bun
import { safeMessage } from "./errors.ts";
import { logger } from "./logger.ts";
import { config } from "dotenv";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createRouter } from "./api/routes.ts";
import { registry } from "./plugin/registry.ts";
import { sessionManager } from "./session/manager.ts";
import { agentStore } from "./agent/store.ts";
import { agentMemory } from "./agent/memory.ts";
import { strikeTracker } from "./agent/validator.ts";
import { loadProviderConfigs } from "./config/provider-config.ts";
import { runAgent } from "./agent/runner.ts";
import { onEvent } from "./event-bus/index.ts";
import { workspaceManager } from "./workspace/manager.ts";
import { listTools } from "./plugin/tools.ts";
import "./plugin/tools.ts";
import { resolveApproval } from "./agent/approval.ts";

import deepseekPlugin from "../../provider-deepseek/src/index.ts";
import anthropicProvider from "../../provider-anthropic/src/index.ts";
import openaiProvider from "../../provider-openai/src/index.ts";
import geminiProvider from "../../provider-gemini/src/index.ts";
import ollamaProvider from "../../provider-ollama-v2/src/index.ts";
import grokProvider from "../../provider-grok/src/index.ts";

process.on("unhandledRejection", (r) => logger.error(`unhandledRejection: ${r instanceof Error ? r.message : String(r)}`));
process.on("uncaughtException", (e) => logger.error(`uncaughtException: ${e instanceof Error ? e.message : String(e)}`));

// ─── Graceful shutdown ──────────────────────────────────────────────────────
let shuttingDown = false;
process.on("SIGINT", () => { shuttingDown = true; console.log("\n  ⬇ Shutting down..."); process.exit(0); });
process.on("SIGTERM", () => { shuttingDown = true; console.log("\n  ⬇ Shutting down..."); process.exit(0); });

for (const p of [join(process.cwd(), ".env"), join(process.cwd(), ".env.local")]) {
  if (existsSync(p)) { config({ path: p }); break; }
}

console.log("\n  ╔═══════════════════════════════════════╗");
console.log("  ║       AgentForge v4.0 — Coding Agent     ║");
console.log("  ╚═══════════════════════════════════════╝\n");

sessionManager.init(process.env.NOVA_DB_PATH);
agentStore.init(process.env.NOVA_DB_PATH);
agentMemory.init(process.env.NOVA_DB_PATH);
strikeTracker.init(process.env.NOVA_DB_PATH);

if (!workspaceManager.isActive()) {
  workspaceManager.setRoot(process.cwd());
  console.log(`  ✓ Default workspace: ${process.cwd()}`);
}

for (const [name, plugin] of [["DeepSeek", deepseekPlugin], ["Anthropic", anthropicProvider], ["OpenAI", openaiProvider], ["Gemini", geminiProvider], ["Ollama", ollamaProvider], ["Grok", grokProvider]] as Array<[string, any]>) {
  try { registry.registerProvider(plugin); console.log(`  ✓ ${name} (${plugin.models.length} models)`); } catch (e: unknown) { console.log(`  ⚠ ${name}: ${safeMessage(e)}`); }
}
console.log(`  ${registry.providers.size} providers, ${registry.listModels().length} models`);
loadProviderConfigs();

if (agentStore.list().length === 0) {
  agentStore.create({ name: "default", description: "Default AgentForge coding agent", modelRef: "deepseek/deepseek-chat", emoji: "◇" });
}



// Seed community agents on first run
import { seedCommunityAgents } from "./agent/community-agents.ts";
seedCommunityAgents();

// Seed VoltAgent agents (112 community agents) if available
import { seedVoltAgentAgents } from "./agent/community-agents-voltagent.ts";
seedVoltAgentAgents(agentStore);

console.log(`  ${agentStore.list().length} agents\n`);

// ─── Pre-cache UI ───────────────────────────────────────────────────────────
const uiDir = (() => {
  for (const rel of ["packages/ui", "../packages/ui"]) {
    const p = resolve(process.cwd(), rel);
    if (existsSync(join(p, "package.json"))) return p;
  }
  return null;
})();

if (uiDir && !existsSync(join(uiDir, "dist", "index.html"))) {
  try { const { execSync } = await import("node:child_process"); execSync("bun run build", { cwd: uiDir, stdio: "inherit", timeout: 60000 }); } catch {}
}

const distDir = uiDir ? join(uiDir, "dist") : null;
let indexHtml = "";
const assetCache = new Map<string, Buffer>();

if (distDir && existsSync(distDir)) {
  const indexPath = join(distDir, "index.html");
  if (existsSync(indexPath)) indexHtml = await Bun.file(indexPath).text();
  const assetsDir = join(distDir, "assets");
  if (existsSync(assetsDir)) {
    for (const f of [...new Bun.Glob("*").scanSync({ cwd: assetsDir })]) {
      assetCache.set(`/assets/${f}`, Buffer.from(await Bun.file(join(assetsDir, f)).arrayBuffer()));
    }
  }
  console.log(`  ✓ UI cached: ${assetCache.size} assets`);
}

// ─── Hono App (API only) ────────────────────────────────────────────────────
const app = createRouter();

// ─── Server ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "4123", 10);
const activeSessions = new Map<string, AbortController>();

// ─── WebSocket Auth ──────────────────────────────────────────────────────────
const WS_AUTH_TOKEN = process.env.NOVA_AUTH_TOKEN || "";
if (WS_AUTH_TOKEN) {
  console.log(`  🔐 WebSocket auth enabled (token required in ?token= param)`);
}

// ─── Session Cleanup (TTL-based) ─────────────────────────────────────────────
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const sessionTimestamps = new Map<string, number>();

function cleanupStaleSessions(): void {
  const now = Date.now();
  for (const [sid, ts] of sessionTimestamps) {
    if (now - ts > SESSION_TTL_MS) {
      const ctrl = activeSessions.get(sid);
      if (ctrl) {
        try { ctrl.abort(); } catch {}
      }
      activeSessions.delete(sid);
      sessionTimestamps.delete(sid);
    }
  }
}
// Run cleanup every 5 minutes
setInterval(() => {
  if (activeSessions.size > 0) cleanupStaleSessions();
}, 5 * 60 * 1000);

const MIME: Record<string, string> = {
  ".js": "application/javascript", ".css": "text/css", ".html": "text/html",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
};

type WsData = { sessionId: string | null; runId: string | null };

async function handleWs(ws: any, ctx: WsData, data: any) {
  switch (data.type) {
    case "chat.send": {
      let sid = data.sessionId;
      if (!sid) { const s = sessionManager.createSession(data.model || "deepseek/deepseek-chat"); sid = s.id; }
      ctx.sessionId = sid;
      ctx.runId = data.runId || `run_${Date.now()}`;
      ws.send(JSON.stringify({ type: "session_created", sessionId: sid }));

      const ctrl = new AbortController();
      activeSessions.set(sid, ctrl);
      sessionTimestamps.set(sid, Date.now()); // Track for TTL cleanup

      const unsub = onEvent("event", (e: any) => {
        if (e.sessionId !== sid) return;
        if (e.kind === "assistant" && e.data?.text) ws.send(JSON.stringify({ type: "assistant", text: e.data.text }));
        else if (e.kind === "thinking" && e.data?.text) ws.send(JSON.stringify({ type: "thinking", text: e.data.text }));
        else if (e.kind === "tool_call" && e.data) {
          const n = e.data.name || e.data.toolName || "";
          if (n.length > 1) ws.send(JSON.stringify({ type: "tool_call", toolName: n, args: e.data.arguments || e.data.args }));
        } else if (e.kind === "tool_result" && e.data) {
          const n = e.data.toolName || e.data.name || "";
          if (n.length > 1) ws.send(JSON.stringify({ type: "tool_result", toolName: n, success: e.data.success !== false, durationMs: e.data.durationMs }));
        }
      });

      try {
        const result = await runAgent({ sessionId: sid, message: data.message, modelRef: data.model || "deepseek/deepseek-chat", tools: true, runId: ctx.runId, signal: ctrl.signal, agentId: data.agentId });
        ws.send(JSON.stringify({ type: "done", text: result.text }));
      } catch (e: unknown) {
        ws.send(JSON.stringify({ type: "error", error: safeMessage(e) }));
      } finally {
        unsub();
        activeSessions.delete(sid);
        sessionTimestamps.delete(sid);
      }
      break;
    }
    case "chat.abort": {
      if (ctx.sessionId) { const c = activeSessions.get(ctx.sessionId); if (c) { c.abort(); } activeSessions.delete(ctx.sessionId); sessionTimestamps.delete(ctx.sessionId); }
      ws.send(JSON.stringify({ type: "done", text: "" }));
      break;
    }
    case "tool.approve": {
      resolveApproval(data.toolCallId, false, !!data.alwaysAllow);
      ws.send(JSON.stringify({ type: "tool.approved", toolCallId: data.toolCallId }));
      break;
    }
    case "tool.reject": {
      resolveApproval(data.toolCallId, true);
      ws.send(JSON.stringify({ type: "tool.rejected", toolCallId: data.toolCallId }));
      break;
    }
    default:
      ws.send(JSON.stringify({ type: "error", error: `Unknown: ${data.type}` }));
  }
}

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/ws") {
      // WebSocket auth: if NOVA_AUTH_TOKEN is set, require ?token= param
      if (WS_AUTH_TOKEN) {
        const token = url.searchParams.get("token") || "";
        if (token !== WS_AUTH_TOKEN) {
          return new Response("Unauthorized — valid ?token= required", { status: 401 });
        }
      }
      const upgraded = server.upgrade(req, { data: { authenticated: true } });
      if (upgraded) return new Response(null);
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // ─── Terminal WebSocket ──────────────────────────────────────
    if (path === "/terminal") {
      const upgraded = server.upgrade(req, { data: { type: "terminal" as const } });
      if (upgraded) return new Response(null);
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    if (path.startsWith("/v1/") || path.startsWith("/api/") || path === "/health") {
      return app.fetch(req);
    }

    const cached = assetCache.get(path);
    if (cached) {
      const ext = "." + (path.split(".").pop() || "");
      return new Response(cached, { headers: { "Content-Type": MIME[ext] || "application/octet-stream" } });
    }

    if (indexHtml) return new Response(indexHtml, { headers: { "Content-Type": "text/html" } });
    return new Response("Not found", { status: 404 });
  },
  websocket: {
    open(ws) {
      const wsData = (ws as any).data || {};
      if (wsData.type === "terminal") {
        console.log("  🔌 Terminal connected");
        // Spawn shell — detect bash path on Windows
        let shellPath = process.env.SHELL || "bash";
        let shellArgs = ["--norc", "--noprofile", "-i"];

        if (process.platform === "win32") {
          // On Windows with git-bash, SHELL might be /usr/bin/bash (MSYS2 path)
          // If plain "bash" doesn't work, try common git-bash locations
          const testBash = (() => {
            try { return existsSync(shellPath); } catch { return false; }
          })();
          if (shellPath === "bash" || !testBash) {
            const gitPaths = [
              "C:\\Program Files\\Git\\bin\\bash.exe",
              "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
            ];
            shellPath = gitPaths.find((p) => { try { return existsSync(p); } catch { return false; } }) || "cmd.exe";
            shellArgs = shellPath.endsWith("cmd.exe") ? ["/Q"] : ["--norc", "--noprofile", "-i"];
          }
        }
        const proc = spawn(shellPath, shellArgs, {
          env: { ...process.env, TERM: "xterm-256color" },
        });
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        proc.stdout!.on("data", (chunk: Buffer) => {
          try { ws.send(decoder.decode(chunk, { stream: true })); } catch {}
        });
        proc.stderr!.on("data", (chunk: Buffer) => {
          try { ws.send(decoder.decode(chunk, { stream: true })); } catch {}
        });
        proc.on("exit", () => {
          try { ws.close(); } catch {}
        });

        // Store for cleanup
        ws._process = proc;
      } else {
        console.log("  🔌 WS connected");
        (ws as any)._ctx = { sessionId: null, runId: null } as WsData;
      }
    },
    message(ws, message) {
      try {
        // Terminal: forward raw data to process stdin
        if (ws._process) {
          ws._process.stdin!.write(String(message));
          return;
        }
        // Chat: JSON-based messaging
        const raw = typeof message === "string" ? message : String(message);
        const data = JSON.parse(raw);
        // Heartbeat ping/pong
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }
        let ctx = (ws as any)._ctx as WsData | undefined;
        if (!ctx) { ctx = { sessionId: null, runId: null }; (ws as any)._ctx = ctx; }
        handleWs(ws, ctx, data);
      } catch (e: unknown) {
        if (!ws._process) {
          ws.send(JSON.stringify({ type: "error", error: safeMessage(e) }));
        }
      }
    },
    close(ws) {
      if (ws._process) {
        console.log("  🔌 Terminal disconnected");
        try { ws._process.kill("SIGTERM"); } catch {}
        ws._process = null;
      } else {
        console.log("  🔌 WS disconnected");
        const ctx = (ws as any)._ctx as WsData | undefined;
        if (ctx?.sessionId) {
          const ctrl = activeSessions.get(ctx.sessionId);
          if (ctrl) { ctrl.abort(); activeSessions.delete(ctx.sessionId); }
          sessionTimestamps.delete(ctx.sessionId);
        }
      }
    },
  },
});

console.log(`  ✓ Server: http://localhost:${server.port}`);
console.log(`  ✓ WebSocket: ws://localhost:${server.port}/ws`);
console.log(`  ✓ Tools: ${listTools().length} registered`);
console.log();

// Keep event loop alive on Windows
setInterval(() => {}, 1 << 30);
