import { Hono } from "hono";

export function register(app: Hono): void {
  // Mesh routes stubbed — agent-mesh/index.ts was removed
  app.get("/api/mesh/topology", (c) => c.json({ routes: [] }));
  app.get("/api/mesh/agents", (c) => c.json({ agents: [] }));
  app.get("/api/mesh/agents/:id", (c) => c.json({ error: "Mesh not available" }, 404));
  app.post("/api/mesh/send", (c) => c.json({ error: "Mesh not available" }, 501));
  app.get("/api/mesh/events", (c) => c.json({ events: [] }));
  app.get("/api/mesh/stats", (c) => c.json({ totalAgents: 0, onlineAgents: 0, topology: 0 }));
}
