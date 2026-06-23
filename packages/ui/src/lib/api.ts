const BASE = import.meta.env.VITE_NOVA_API_URL || "http://localhost:4123";

async function get(path: string, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, { signal: controller.signal });
    if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function post(path: string, body?: unknown, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`POST ${path} ${res.status}: ${await res.text().catch(() => "")}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: (path: string): Promise<any> => get(path),
  health: () => get("/health"),
  models: () => get("/v1/models").then((r) => r.data || []),
  sessions: () => get("/api/sessions").then((r) => r.sessions || []),
  sessionDetail: (id: string) => get(`/api/sessions/${id}`),
  agents: () => get("/api/agents").then((r) => r.agents || []),
  skills: () => get("/api/skills").then((r) => {
    if (!r || !r.skills) return [];
    // Transform backend SkillDef → UI expected format
    return r.skills.map((s: any) => ({
      name: s.name && s.name !== "SKILL" ? s.name : s.category || s.name || "Unknown",
      description: s.description || "",
      category: s.category || "uncategorized",
      tags: (s.triggers || []).slice(0, 5),
      parameters: (s.tools || []).map((t: string) => ({ name: t })),
      source: s.filePath?.includes("community") ? "community" : "auto-generated",
    }));
  }),
  agentSend: (message: string, model?: string, agentId?: string) =>
    post("/api/agent/send", { message, model, agentId }),
};
