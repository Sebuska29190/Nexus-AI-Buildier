import { Hono } from "hono";

export function register(app: Hono): void {
  // Memory routes stubbed — memory/store.ts was removed
  app.get("/api/memory", (c) => c.json({ memories: [] }));
  app.get("/api/memory/search", (c) => c.json({ results: [] }));
  app.post("/api/memory", (c) => c.json({ error: "Memory store not available" }, 501));
  app.delete("/api/memory/:id", (c) => c.json({ error: "Memory store not available" }, 501));
}
