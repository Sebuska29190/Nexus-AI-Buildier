#!/usr/bin/env bun
import { safeMessage } from "./errors.ts";
import { config } from "dotenv";
import { join, resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { serve as honoServe } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

// Global error handlers — prevent unhandled rejections from crashing the process
process.on("unhandledRejection", (reason, promise) => {
  console.error("  ⚠ Unhandled Rejection:", reason instanceof Error ? reason.message : String(reason));
});
process.on("uncaughtException", (err) => {
  const msg = err instanceof Error ? (err.message ?? "") : String(err ?? "Unknown");
  console.error("  ⚠ Uncaught Exception:", msg);
  if (err && typeof err === "object" && "stack" in (err as any)) {
    const stack = (err as any).stack;
    if (typeof stack === "string") {
      console.error("  ⚠ Stack:", stack.split("\n").slice(0, 8).filter(Boolean).join("\n  "));
    }
  }
});

for (const p of [join(process.cwd(), ".env"), join(process.cwd(), ".env.local")]) {
  if (existsSync(p)) { config({ path: p }); break; }
}

import { createRouter } from "./api/routes.ts";
import { registry } from "./plugin/registry.ts";
import { sessionManager } from "./session/manager.ts";
import { agentStore } from "./agent/store.ts";
import { agentMemory } from "./agent/memory.ts";
import { loadProviderConfigs } from "./config/provider-config.ts";
import "./plugin/tools.ts"; // registers all coding tools
import { listTools } from "./plugin/tools.ts";

// Providers
import deepseekPlugin from "../../provider-deepseek/src/index.ts";
import anthropicProvider from "../../provider-anthropic/src/index.ts";
import openaiProvider from "../../provider-openai/src/index.ts";
import geminiProvider from "../../provider-gemini/src/index.ts";
import ollamaProvider from "../../provider-ollama-v2/src/index.ts";
import grokProvider from "../../provider-grok/src/index.ts";

console.log("\n  ╔═══════════════════════════════════════╗");
console.log("  ║       Nexus AI v3.0 — Coding Agent     ║");
console.log("  ╚═══════════════════════════════════════╝\n");

// Init stores
sessionManager.init(process.env.NOVA_DB_PATH);
agentStore.init(process.env.NOVA_DB_PATH);
agentMemory.init(process.env.NOVA_DB_PATH);

// ─── Set default workspace ─────────────────────────────────────
import { workspaceManager } from "./workspace/manager.ts";
if (!workspaceManager.getRoot()) {
  workspaceManager.setRoot(process.cwd());
  console.log(`  ✓ Default workspace set to: ${process.cwd()}`);
}

// ─── Environment Validation ───────────────────────────────────
const warnings: string[] = [];
if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
  warnings.push("No LLM provider API keys configured — add at least one to .env");
}
if (warnings.length > 0) {
  console.log("\n  ⚠ Environment warnings:");
  for (const w of warnings) console.log(`    - ${w}`);
  console.log();
}

// Load providers
const providerList: Array<[string, any]> = [
  ["DeepSeek", deepseekPlugin],
  ["Anthropic", anthropicProvider],
  ["OpenAI", openaiProvider],
  ["Gemini", geminiProvider],
  ["Ollama", ollamaProvider],
  ["Grok", grokProvider],
];
for (const [name, plugin] of providerList) {
  try {
    registry.registerProvider(plugin);
    console.log(`  ✓ ${name} (${plugin.models.length} models)`);
  } catch (e: unknown) {
    console.log(`  ⚠ ${name}: ${safeMessage(e)}`);
  }
}

const modelCount = registry.listModels().length;
console.log(`  ${registry.providers.size} provider(s), ${modelCount} model(s) ready`);

// Restore saved provider API keys from config file
loadProviderConfigs();

// Seed default agent
const existingAgents = agentStore.list();
if (existingAgents.length === 0) {
  agentStore.create({ name: "default", description: "Default Nexus coding agent", modelRef: "deepseek/deepseek-chat", emoji: "◇" });
}

// Register sub-agents
import { registerSubAgents } from "./agent/subagents/index.ts";
registerSubAgents();
console.log(`  ✓ Sub-agents: senior-dev, cyber-auditor, web-researcher, api-connector`);

const agentCount = agentStore.list().length;
console.log(`  ${agentCount} agent(s) configured\n`);

// ─── Auto-build UI ──────────────────────────────────────────────────────────
function resolveUiDir(): string | null {
  if (import.meta.dirname) {
    const fromRoot = resolve(import.meta.dirname, "packages", "ui");
    if (existsSync(join(fromRoot, "package.json"))) return fromRoot;
    const fromRootAlt = resolve(import.meta.dirname, "..", "packages", "ui");
    if (existsSync(join(fromRootAlt, "package.json"))) return fromRootAlt;
  }
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const fromUrl = resolve(__dirname, "..", "..", "..", "packages", "ui");
    if (existsSync(join(fromUrl, "package.json"))) return fromUrl;
    const fromUrlAlt = resolve(__dirname, "..", "..", "packages", "ui");
    if (existsSync(join(fromUrlAlt, "package.json"))) return fromUrlAlt;
  } catch {}
  const cwd = process.cwd();
  for (const rel of ["packages/ui", "../packages/ui", "../../packages/ui"]) {
    const p = resolve(cwd, rel);
    if (existsSync(join(p, "package.json"))) return p;
  }
  return null;
}

const uiDir = resolveUiDir();
if (uiDir) {
  console.log(`  Building UI from: ${uiDir}`);
  try {
    const { execSync } = await import("node:child_process");
    execSync("bun run build", { cwd: uiDir, stdio: "inherit", timeout: 60000 });
    console.log("  ✓ UI built successfully");
  } catch (e: unknown) {
    console.log(`  ⚠ UI build failed: ${safeMessage(e)}`);
  }
} else {
  console.log("  ⚠ UI package not found — skipping build");
}

// ─── Start Hono server ──────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3000", 10);
const app = createRouter();

// Serve static UI files if built
if (uiDir) {
  const distDir = join(uiDir, "dist");
  if (existsSync(distDir)) {
    app.use("/*", serveStatic({ root: distDir }));
  }
}

honoServe({ fetch: app.fetch, port: PORT });
console.log(`  ✓ Server running on http://localhost:${PORT}`);
console.log(`  ✓ Tools: ${listTools().length} registered`);
console.log();
