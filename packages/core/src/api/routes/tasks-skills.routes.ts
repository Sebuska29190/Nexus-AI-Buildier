import { Hono } from "hono";
import { loadSkills } from "../../skill/loader.ts";

export function register(app: Hono): void {
  // Skills
  app.get("/api/skills", (c) => c.json({ skills: loadSkills() }));
}
