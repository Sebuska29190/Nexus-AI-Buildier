import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerRoutes } from "./routes/middleware.ts";
import { registerAuth } from "./routes/auth.ts";
import { register as registerModels } from "./routes/models.routes.ts";
import { register as registerChat } from "./routes/chat.routes.ts";
import { register as registerSessions } from "./routes/sessions.routes.ts";
import { register as registerAgents } from "./routes/agents.routes.ts";
import { register as registerSystem } from "./routes/system.routes.ts";
import { register as registerConfig } from "./routes/config.routes.ts";
import { register as registerTasksSkills } from "./routes/tasks-skills.routes.ts";
import { register as registerMemory } from "./routes/memory.routes.ts";
import { register as registerSettings } from "./routes/settings.routes.ts";
import { healthRouter } from "../monitoring/health.ts";

export function createRouter(): Hono {
  const app = new Hono();
  // Gzip compression MUST run before CORS to avoid ReadableStream conflicts
  app.use("*", async (c, next) => {
    await next();
    const accept = c.req.header("Accept-Encoding") || "";
    const ct = c.res.headers.get("Content-Type") || "";
    if (accept.includes("gzip") && ct.includes("json") && c.res.body) {
      // Clone the response to avoid "ReadableStream already used" errors
      const original = c.res.clone();
      const text = await original.text();
      if (text.length > 1024) {
        const { gzipSync } = await import("node:zlib");
        const compressed = gzipSync(Buffer.from(text));
        c.res = new Response(compressed, {
          status: c.res.status,
          headers: {
            "Content-Type": ct,
            "Content-Encoding": "gzip",
            "Vary": "Accept-Encoding",
          },
        });
      }
    }
  });
  app.use("*", cors({
    origin: process.env.NOVA_CORS_ORIGIN || "http://localhost:4123",
  }));

  // Auth middleware (checks API key for all /api/* and /v1/* routes)
  registerAuth(app);

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
  registerSettings(app);

  // Health check routes (no auth required)
  app.route('/', healthRouter);

  app.onError((err, c) => {
    console.error("Error:", err);
    return c.json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  });

  return app;
}
