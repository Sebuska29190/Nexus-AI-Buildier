import { useState, useEffect } from "react";
import { ArrowLeft, Save, RotateCcw, Check, X, Terminal, FileCode, Search, Globe, Clock } from "lucide-react";

interface AgentConfigPageProps {
  agents?: any[];
  onNavigate?: (route: string) => void;
}

const TOOL_ICONS: Record<string, React.ElementType> = {
  web_fetch: Globe, web_search: Search,
  workspace_list_files: FileCode, workspace_read_file: FileCode,
  workspace_write_file: FileCode, workspace_run_command: Terminal,
  get_current_time: Clock,
};

export function AgentConfigPage({ agents = [], onNavigate }: AgentConfigPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [agent, setAgent] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/agents/${selectedId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.agent) {
          setAgent(d.agent);
          setPrompt(d.agent.systemPrompt || "");
        }
      })
      .catch(() => {});
  }, [selectedId]);

  async function savePrompt() {
    if (!agent) return;
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: prompt }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
  }

  // List view
  if (!selectedId) {
    return (
      <div className="max-w-6xl mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-white">🤖 Konfiguracja agentów</h1>
          <span className="text-xs text-[#475569]">{agents.length} agentów</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((a: any) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all duration-200 text-left"
            >
              <span className="text-2xl">{a.emoji || "🤖"}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">{a.name}</div>
                <div className="text-[10px] text-[#475569] mt-0.5 truncate">{a.modelRef}</div>
              </div>
              <div className={`text-[9px] px-2 py-0.5 rounded-full font-mono ${
                (a.strikes || 0) >= 3 ? "bg-[rgba(239,68,68,0.1)] text-[#EF4444]"
                : (a.strikes || 0) > 0 ? "bg-[rgba(234,179,8,0.1)] text-[#EAB308]"
                : "bg-[rgba(34,197,94,0.1)] text-[#22C55E]"
              }`}>
                {(a.strikes || 0) >= 3 ? "Degraded" : (a.strikes || 0) > 0 ? "Warning" : "Ready"}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Detail view
  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xs text-[#475569]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full p-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => setSelectedId(null)}
        className="flex items-center gap-1 text-xs text-[#475569] hover:text-[#f1f5f9] transition-colors"
      >
        <ArrowLeft size={14} /> Powrót do listy
      </button>

      {/* Agent header */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{agent.emoji || "🤖"}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <p className="text-sm text-[#64748B] mt-1">{agent.description || "Brak opisu"}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[rgba(124,58,237,0.08)] text-[#7C3AED] border border-[rgba(124,58,237,0.15)]">
                  {agent.modelRef}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg ${
                  agent.status === "ready" ? "bg-[rgba(34,197,94,0.08)] text-[#22C55E]"
                  : "bg-[rgba(234,179,8,0.08)] text-[#EAB308]"
                }`}>
                  {agent.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt Editor */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">System Prompt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrompt(agent.systemPrompt || "")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-[#475569] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.04)] transition-all"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={savePrompt}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                saved
                  ? "bg-[rgba(34,197,94,0.1)] text-[#22C55E]"
                  : "bg-[rgba(124,58,237,0.1)] text-[#7C3AED] hover:bg-[rgba(124,58,237,0.15)]"
              }`}
            >
              {saved ? <><Check size={12} /> Saved</> : <><Save size={12} /> Save</>}
            </button>
          </div>
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="w-full h-64 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-[11px] font-mono text-[#94a3b8] placeholder-[#475569] focus:outline-none focus:border-[#7C3AED]/30 resize-y"
          placeholder="Enter system prompt..."
        />
      </div>

      {/* Tools */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">🔧 Przypisane narzędzia</h3>
        <div className="flex flex-wrap gap-2">
          {(agent.skills || []).length === 0 ? (
            <span className="text-xs text-[#475569]">Brak przypisanych narzędzi</span>
          ) : (
            (agent.skills || []).map((skill: string) => {
              const Icon = TOOL_ICONS[skill] || Terminal;
              return (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg bg-[rgba(6,182,212,0.06)] text-[#06B6D4] border border-[rgba(6,182,212,0.12)]"
                >
                  <Icon size={12} />
                  {skill}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">📊 Quality Score</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Trust Level</span>
              <span className="text-[#EAB308]">🟡 Neutral</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Runs</span>
              <span className="text-white">0</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Strikes</span>
              <span className="text-[#22C55E]">0</span>
            </div>
          </div>
        </div>
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">🤖 Agent info</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">ID</span>
              <span className="text-white font-mono text-[10px]">{agent.id}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Model</span>
              <span className="text-white font-mono text-[10px]">{agent.modelRef}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Status</span>
              <span className={`text-[10px] font-mono ${agent.status === "ready" ? "text-[#22C55E]" : "text-[#EAB308]"}`}>{agent.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
