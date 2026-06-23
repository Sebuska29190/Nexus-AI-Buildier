import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerRoutes } from "./routes/middleware.ts";
import { register as registerModels } from "./routes/models.routes.ts";
import { register as registerChat } from "./routes/chat.routes.ts";
import { register as registerSessions } from "./routes/sessions.routes.ts";
import { register as registerAgents } from "./routes/agents.routes.ts";
import { register as registerSystem } from "./routes/system.routes.ts";
import { register as registerConfig } from "./routes/config.routes.ts";
import { register as registerTasksSkills } from "./routes/tasks-skills.routes.ts";
import { register as registerMemory } from "./routes/memory.routes.ts";

export function createRouter(): Hono {
  const app = new Hono();
  app.use("*", cors({
    origin: process.env.NOVA_CORS_ORIGIN || "http://localhost:4123",
  }));

  // Register middleware (auth, security headers)
  registerRoutes(app);

  // Register route modules
  registerModels(app);
  registerChat(app);
  registerSessions(app);
  registerAgents(app);
  registerSystem(app);
  registerConfig(app);
  registerTasksSkills(app);
  registerMemory(app);

  app.onError((err, c) => {
    console.error("Error:", err);
    return c.json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  });

  return app;
}
