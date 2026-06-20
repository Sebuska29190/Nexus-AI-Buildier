import { Hono } from "hono";

export function register(app: Hono): void {
  // Chambers routes stubbed — multi-agent/chamber.ts was removed
  app.get("/api/chambers", (c) => c.json({ chambers: [] }));
  app.get("/api/chambers/:id", (c) => c.json({ error: "Chambers not available" }, 404));
  app.post("/api/chambers", (c) => c.json({ error: "Chambers not available" }, 501));
  app.post("/api/chambers/:id/run", (c) => c.json({ error: "Chambers not available" }, 501));
  app.post("/api/chambers/:id/stop", (c) => c.json({ error: "Chambers not available" }, 501));
  app.delete("/api/chambers/:id", (c) => c.json({ error: "Chambers not available" }, 501));
  app.put("/api/chambers/:id", (c) => c.json({ error: "Chambers not available" }, 501));
  app.post("/api/chambers/:id/restart", (c) => c.json({ error: "Chambers not available" }, 501));
  app.get("/api/chambers/:id/analytics", (c) => c.json({ error: "Chambers not available" }, 404));
  app.get("/api/chambers/:id/events", (c) => c.json({ error: "Chambers not available" }, 404));
}
