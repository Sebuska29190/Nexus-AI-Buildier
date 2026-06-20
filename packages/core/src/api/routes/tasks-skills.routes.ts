import { Hono } from "hono";
import { loadSkills } from "../../skill/loader.ts";

export function register(app: Hono): void {
  // Tasks routes stubbed — task/store.ts was removed
  app.get("/api/tasks", (c) => c.json({ tasks: [] }));
  app.post("/api/tasks", (c) => c.json({ error: "Task store not available" }, 501));
  app.patch("/api/tasks/:id", (c) => c.json({ error: "Task store not available" }, 501));
  app.delete("/api/tasks/:id", (c) => c.json({ error: "Task store not available" }, 501));

  // Skills
  app.get("/api/skills", (c) => c.json({ skills: loadSkills() }));

  // Sub-agent routes stubbed — multi-agent/subagent.ts was removed
  app.post("/api/subagent", (c) => c.json({ error: "Sub-agent not available" }, 501));
}
