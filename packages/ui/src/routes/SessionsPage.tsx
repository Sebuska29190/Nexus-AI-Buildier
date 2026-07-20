import { useState, useEffect } from "react";
import { api } from "../lib/api";

export function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    setLoading(true);
    try { setSessions(await api.sessions()); } catch {}
    setLoading(false);
  }

  function resumeSession(id: string) {
    window.dispatchEvent(new CustomEvent("nova-resume-session", { detail: { sessionId: id } }));
    window.dispatchEvent(new CustomEvent("nova-navigate", { detail: "chat" }));
  }

  async function deleteSession(id: string) {
    if (!confirm("Delete this session?")) return;
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      loadSessions();
    } catch {}
  }

  const sorted = [...sessions].sort((a, b) =>
    new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-lg font-bold">Sessions</h1>

      {loading ? (
        <div className="text-center text-[#475569] py-8">Loading...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center text-[#475569] py-8">No sessions yet.</div>
      ) : (
        <div className="space-y-2">
          {sorted.map((s) => (
            <div key={s.id} className="glass-card p-3 rounded-lg flex items-center justify-between hover:border-[rgba(245,158,11,0.30)] transition-all cursor-pointer" onClick={() => resumeSession(s.id)}>
              <div>
                <div className="text-xs font-mono text-[#F59E0B]">{s.id?.slice(0, 12)}...</div>
                <div className="text-[10px] text-[#475569]">{s.modelRef || s.model} · {new Date(s.createdAt || s.created_at || Date.now()).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#475569]">{s.messageCount || 0} msgs</span>
                <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="text-[10px] text-[#ef4444] hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
