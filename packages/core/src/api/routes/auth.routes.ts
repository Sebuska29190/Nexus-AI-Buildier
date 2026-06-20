import { Hono } from "hono";

export function register(app: Hono): void {
  // Auth routes stubbed — auth/jwt.ts was removed
  app.post("/api/auth/register", (c) => c.json({ error: "Auth not configured" }, 501));
  app.post("/api/auth/login", (c) => c.json({ error: "Auth not configured" }, 501));
  app.get("/api/auth/me", (c) => c.json({ user: null }));

  // Health
  app.get("/health", (c) => c.json({ status: "ok", version: "0.6.1" }));
}
