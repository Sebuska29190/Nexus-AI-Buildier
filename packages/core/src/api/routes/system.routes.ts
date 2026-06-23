import { Hono } from "hono";
import { safeMessage } from "../../errors.ts";

import { runAutoBugFixer } from "../../agent/auto-bug-fixer.ts";
import { workspaceManager } from "../../workspace/manager.ts";

export function register(app: Hono): void {
  // Health check
  app.get("/health", (c) => c.json({
    status: "ok",
    version: "4.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  // Auto Bug Fixer
  app.post("/api/agent/auto-bug-fixer", async (c) => {
    const body = await c.req.json<{ repoDir?: string; testCmd?: string }>();
    const result = await runAutoBugFixer(body.repoDir || ".", body.testCmd || "bun test");
    return c.json({ result });
  });

  // --- Workspace ----------------------------------------------------------
  app.get("/api/workspace", (c) => {
    const state = workspaceManager.getState();
    if (!state) return c.json({ active: false });
    return c.json({ active: true, workspace: state });
  });
  app.get("/api/workspace/status", (c) => {
    const state = workspaceManager.getState();
    return c.json({ active: !!state, root: state?.root || null, files: state?.files?.length || 0 });
  });
  app.post("/api/workspace/set", async (c) => {
    const body = await c.req.json<{ dir: string }>();
    if (!body.dir) return c.json({ error: "dir required" }, 400);
    const ok = workspaceManager.setRoot(body.dir);
    if (!ok) return c.json({ error: "Failed to set workspace" }, 400);
    return c.json({ status: "ok", workspace: workspaceManager.getState() });
  });
  app.get("/api/workspace/files", (c) => {
    if (!workspaceManager.isActive()) return c.json({ error: "No workspace set" }, 400);
    const files = workspaceManager.listFiles(c.req.query("dir") || "", {
      ext: c.req.query("ext") || undefined,
      maxDepth: parseInt(c.req.query("depth") || "3"),
    });
    return c.json({ files });
  });
  app.get("/api/workspace/read", (c) => {
    const path = c.req.query("path");
    if (!path) return c.json({ error: "path required" }, 400);
    const content = workspaceManager.readFile(path);
    if (content === null) return c.json({ error: "File not found or too large" }, 404);
    return c.json({ content });
  });
  app.post("/api/workspace/write", async (c) => {
    const body = await c.req.json<{ path: string; content: string }>();
    if (!body.path || body.content === undefined) return c.json({ error: "path and content required" }, 400);
    const ok = workspaceManager.writeFile(body.path, body.content);
    if (!ok) return c.json({ error: "Failed to write file" }, 400);
    return c.json({ status: "ok" });
  });
  app.get("/api/workspace/tree", (c) => {
    if (!workspaceManager.isActive()) return c.json({ error: "No workspace set" }, 400);
    const files = workspaceManager.listFiles(c.req.query("dir") || "", { maxDepth: parseInt(c.req.query("depth") || "3") });
    return c.json({ files: files.map((f: any) => f.path) });
  });
  app.post("/api/workspace/clear", (c) => {
    workspaceManager.clear();
    return c.json({ status: "cleared" });
  });
  app.post("/api/workspace/delete", async (c) => {
    const body = await c.req.json<{ path: string }>();
    if (!body.path) return c.json({ error: "path required" }, 400);
    const ok = workspaceManager.delete(body.path);
    if (!ok) return c.json({ error: "Delete failed" }, 400);
    return c.json({ status: "deleted" });
  });

}
