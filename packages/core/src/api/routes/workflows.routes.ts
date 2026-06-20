import { Hono } from "hono";
import { safeMessage } from "../../errors.ts";

export function register(app: Hono): void {
  // Workflows routes stubbed — workflow/engine.ts was removed
  app.get("/api/workflows", (c) => c.json({ workflows: [] }));
  app.post("/api/workflows", (c) => c.json({ error: "Workflows not available" }, 501));
  app.get("/api/workflows/:id", (c) => c.json({ error: "Workflows not available" }, 404));
  app.put("/api/workflows/:id", (c) => c.json({ error: "Workflows not available" }, 501));
  app.delete("/api/workflows/:id", (c) => c.json({ error: "Workflows not available" }, 501));
  app.post("/api/workflows/:id/run", (c) => c.json({ error: "Workflows not available" }, 501));

  // Usage/monitoring stubbed — monitor/usage.ts was removed
  app.get("/api/usage", (c) => c.json({ totalToolCalls: 0, topAgents: [] }));
  app.get("/api/usage/top", (c) => c.json({ top: [] }));
  app.get("/api/usage/audit", (c) => c.json({ entries: [], stats: {} }));

  // Tool Analytics Dashboard
  app.get("/api/analytics/dashboard", (c) => {
    try {
      return c.json({
        topTools: [],
        topAgents: [],
        recentCalls: [],
        successRate: 100,
        totalToolCalls: 0,
        uniqueTools: 0,
      });
    } catch (e) { return c.json({ error: safeMessage(e) }, 400); }
  });
}
