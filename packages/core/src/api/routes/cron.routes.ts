import { Hono } from "hono";

export function register(app: Hono): void {
  // Cron routes stubbed — cron/manager.ts was removed
  app.get("/api/cron", (c) => c.json({ jobs: [] }));
  app.get("/api/cron/:id", (c) => c.json({ error: "Cron not available" }, 404));
  app.post("/api/cron", (c) => c.json({ error: "Cron not available" }, 501));
  app.put("/api/cron/:id", (c) => c.json({ error: "Cron not available" }, 501));
  app.put("/api/cron/:id/enable", (c) => c.json({ error: "Cron not available" }, 501));
  app.post("/api/cron/:id/run", (c) => c.json({ error: "Cron not available" }, 501));
  app.get("/api/cron/:id/runs", (c) => c.json({ runs: [] }));
  app.delete("/api/cron/:id", (c) => c.json({ error: "Cron not available" }, 501));
}
