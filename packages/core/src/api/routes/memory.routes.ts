import { Database } from "bun:sqlite";
import { join } from "node:path";

const DB_PATH = () => join(process.cwd(), "nova.db");

export function register(app: any): void {
  // List all memories
  app.get("/api/memory", (c: any) => {
    const agentId = c.req.query("agent_id");
    const limit = parseInt(c.req.query("limit") || "50", 10);
    try {
      const db = new Database(DB_PATH());
      let sql = "SELECT * FROM agent_memories";
      const params: any[] = [];
      if (agentId) { sql += " WHERE agent_id = ?"; params.push(agentId); }
      sql += " ORDER BY importance DESC, created_at DESC LIMIT ?";
      params.push(limit);
      const memories = db.query(sql).all(...params) as any[];
      db.close();
      return c.json({ 
        memories: memories.map((r: any) => ({
          id: r.id,
          agentId: r.agent_id,
          type: r.type,
          content: r.content,
          importance: r.importance,
          importance_level: r.importance >= 4 ? "high" : r.importance >= 2 ? "medium" : "low",
          tags: JSON.parse(r.tags || "[]"),
          sourceRunId: r.source_run_id,
          created_at: r.created_at,
          updated_at: r.created_at,
          name: `Memory #${r.id.slice(0, 8)}`,
        })),
      });
    } catch {
      return c.json({ memories: [] });
    }
  });

  // Search memories
  app.get("/api/memory/search", (c: any) => {
    const q = c.req.query("q") || "";
    const limit = parseInt(c.req.query("limit") || "20", 10);
    if (!q.trim()) return c.json({ results: [] });
    try {
      const db = new Database(DB_PATH());
      const memories = db.query(
        "SELECT * FROM agent_memories WHERE content LIKE ? ORDER BY importance DESC, created_at DESC LIMIT ?"
      ).all(`%${q}%`, limit) as any[];
      db.close();
      return c.json({ 
        results: memories.map((r: any) => ({
          id: r.id,
          agentId: r.agent_id,
          type: r.type,
          content: r.content,
          importance: r.importance,
          tags: JSON.parse(r.tags || "[]"),
          created_at: r.created_at,
          name: `Memory #${r.id.slice(0, 8)}`,
        })),
      });
    } catch {
      return c.json({ results: [] });
    }
  });

  // Create memory
  app.post("/api/memory", async (c: any) => {
    const body = await c.req.json<{ agentId: string; content: string; type?: string; importance?: number; tags?: string[] }>();
    if (!body.agentId || !body.content) return c.json({ error: "agentId and content required" }, 400);
    try {
      const db = new Database(DB_PATH());
      const id = Math.random().toString(36).slice(2, 14);
      const now = new Date().toISOString();
      db.run(
        "INSERT INTO agent_memories (id, agent_id, type, content, importance, tags, source_run_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, body.agentId, body.type || "episodic", body.content, body.importance || 3, JSON.stringify(body.tags || []), null, now]
      );
      db.close();
      return c.json({ id, status: "created" });
    } catch {
      return c.json({ error: "Failed to create memory" }, 500);
    }
  });

  // Delete memory
  app.delete("/api/memory/:id", (c: any) => {
    const id = c.req.param("id");
    try {
      const db = new Database(DB_PATH());
      const result = db.run("DELETE FROM agent_memories WHERE id = ?", [id]);
      db.close();
      if ((result.changes ?? 0) === 0) return c.json({ error: "Not found" }, 404);
      return c.json({ status: "deleted" });
    } catch {
      return c.json({ error: "Failed to delete" }, 500);
    }
  });
}
