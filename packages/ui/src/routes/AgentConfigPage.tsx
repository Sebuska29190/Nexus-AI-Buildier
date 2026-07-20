import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, RotateCcw, Check, X, Terminal, FileCode, Search, Globe, Clock, AlertCircle } from "lucide-react";
import { agentConfigSchema, type AgentConfigFormData } from "../lib/validation";

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
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // React Hook Form with zod resolver
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AgentConfigFormData>({
    resolver: zodResolver(agentConfigSchema),
    defaultValues: {
      name: "",
      systemPrompt: "",
      model: "",
    },
  });

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`/api/agents/${selectedId}`, { signal: controller.signal })
      .then(r => {
        if (r.status === 404) throw new Error("Agent not found");
        if (r.status === 500) throw new Error("Server error");
        return r.ok ? r.json() : null;
      })
      .then(d => {
        if (d?.agent) {
          setAgent(d.agent);
          reset({
            name: d.agent.name || "",
            systemPrompt: d.agent.systemPrompt || "",
            model: d.agent.modelRef || "",
          });
          setError(null);
        }
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load agent");
      });

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [selectedId, reset]);

  async function onSave(data: AgentConfigFormData) {
    if (!agent) return;
    setError(null);

    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: data.systemPrompt, name: data.name }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Save failed (${res.status})`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    }
  }

  function handleReset() {
    if (agent) {
      reset({
        name: agent.name || "",
        systemPrompt: agent.systemPrompt || "",
        model: agent.modelRef || "",
      });
    }
  }

  // List view
  if (!selectedId) {
    return (
      <div className="max-w-6xl mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-white">🤖 Konfiguracja agentów</h1>
          <span className="text-xs text-[#71717A]">{agents.length} agentów</span>
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
                <div className="text-[10px] text-[#71717A] mt-0.5 truncate">{a.modelRef}</div>
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
  if (!agent && !error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xs text-[#71717A]">Loading...</div>
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="max-w-5xl mx-auto w-full p-6">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1 text-xs text-[#71717A] hover:text-[#E4E4E7] transition-colors mb-4">
          <ArrowLeft size={14} /> Powrót do listy
        </button>
        <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-5 text-center">
          <p className="text-sm text-[#ef4444]">{error}</p>
          <button onClick={() => setSelectedId(selectedId)} className="btn-premium px-4 py-2 rounded-lg text-xs mt-4">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const finalAgent = agent!;

  return (
    <div className="max-w-5xl mx-auto w-full p-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => setSelectedId(null)}
        className="flex items-center gap-1 text-xs text-[#71717A] hover:text-[#E4E4E7] transition-colors"
      >
        <ArrowLeft size={14} /> Powrót do listy
      </button>

      {/* Error banner */}
      {error && (
        <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-3" role="alert">
          <p className="text-xs text-[#ef4444]">{error}</p>
        </div>
      )}

      {/* Agent header */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{finalAgent.emoji || "🤖"}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{finalAgent.name}</h2>
              <p className="text-sm text-[#64748B] mt-1">{finalAgent.description || "Brak opisu"}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[rgba(124,58,237,0.08)] text-[#F59E0B] border border-[rgba(124,58,237,0.15)]">
                  {finalAgent.modelRef}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg ${
                  finalAgent.status === "ready" ? "bg-[rgba(34,197,94,0.08)] text-[#22C55E]"
                  : "bg-[rgba(234,179,8,0.08)] text-[#EAB308]"
                }`}>
                  {finalAgent.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt Editor with react-hook-form */}
      <form onSubmit={handleSubmit(onSave)}>
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">System Prompt</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-[#71717A] hover:text-[#E4E4E7] hover:bg-[rgba(255,255,255,0.04)] transition-all"
              >
                <RotateCcw size={12} /> Reset
              </button>
              <button
                type="submit"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  saved
                    ? "bg-[rgba(34,197,94,0.1)] text-[#22C55E]"
                    : "bg-[rgba(124,58,237,0.1)] text-[#F59E0B] hover:bg-[rgba(124,58,237,0.15)]"
                }`}
              >
                {saved ? <><Check size={12} /> Saved</> : <><Save size={12} /> Save</>}
              </button>
            </div>
          </div>
          <textarea
            {...register("systemPrompt")}
            className={`w-full h-64 bg-[rgba(0,0,0,0.3)] border rounded-xl p-4 text-[11px] font-mono text-[#A1A1AA] placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]/30 resize-y ${
              errors.systemPrompt ? "border-[#ef4444]" : "border-[rgba(255,255,255,0.06)]"
            }`}
            placeholder="Enter system prompt (minimum 50 characters)..."
          />
          {errors.systemPrompt && (
            <p className="flex items-center gap-1 text-xs text-[#ef4444] mt-2">
              <AlertCircle className="w-3 h-3" /> {errors.systemPrompt.message}
            </p>
          )}
        </div>
      </form>

      {/* Tools */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">🔧 Przypisane narzędzia</h3>
        <div className="flex flex-wrap gap-2">
          {(finalAgent.skills || []).length === 0 ? (
            <span className="text-xs text-[#71717A]">Brak przypisanych narzędzi</span>
          ) : (
            (finalAgent.skills || []).map((skill: string) => {
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
              <span className="text-white font-mono text-[10px]">{finalAgent.id}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Model</span>
              <span className="text-white font-mono text-[10px]">{finalAgent.modelRef}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Status</span>
              <span className={`text-[10px] font-mono ${finalAgent.status === "ready" ? "text-[#22C55E]" : "text-[#EAB308]"}`}>{finalAgent.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
