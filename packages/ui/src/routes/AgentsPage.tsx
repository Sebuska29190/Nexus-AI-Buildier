import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Play } from "lucide-react";
import { api } from "../lib/api";

export function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formModel, setFormModel] = useState("deepseek/deepseek-chat");

  useEffect(() => { loadAgents(); }, []);

  async function loadAgents() {
    setLoading(true);
    try { setAgents(await api.agents()); } catch {}
    setLoading(false);
  }

  async function createAgent() {
    if (!formName.trim()) return;
    try {
      await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, description: formDescription, modelRef: formModel }),
      });
      setShowForm(false);
      setFormName("");
      setFormDescription("");
      loadAgents();
    } catch {}
  }

  async function deleteAgent(id: string) {
    if (!confirm("Delete this agent?")) return;
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      loadAgents();
    } catch {}
  }

  function chatWithAgent(agentId: string) {
    window.dispatchEvent(new CustomEvent("nova-navigate", { detail: "chat" }));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-[#818cf8]" />
          <h1 className="text-lg font-bold">Agents</h1>
          <span className="text-xs text-[#475569]">{agents.length} agents</span>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-nova text-xs px-3 py-1.5">
          <Plus size={14} /> New Agent
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-4 rounded-xl space-y-3">
          <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Agent name" className="glass-input w-full text-xs" />
          <input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Description" className="glass-input w-full text-xs" />
          <select value={formModel} onChange={e => setFormModel(e.target.value)} className="glass-input w-full text-xs">
            <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
            <option value="anthropic/claude-sonnet-4-20250514">Claude Sonnet</option>
            <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
          </select>
          <div className="flex gap-2">
            <button onClick={createAgent} className="btn-nova text-xs px-3 py-1.5">Create</button>
            <button onClick={() => setShowForm(false)} className="text-xs text-[#475569] hover:text-white px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-[#475569] py-8">Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="text-center text-[#475569] py-8">No agents yet. Create one to get started.</div>
      ) : (
        <div className="grid gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
              className={`glass-card p-4 rounded-xl cursor-pointer transition-all hover:border-[rgba(99,102,241,0.3)] ${
                selectedAgent?.id === agent.id ? "border-[rgba(99,102,241,0.4)]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{agent.emoji || "🤖"}</span>
                  <div>
                    <div className="text-sm font-semibold">{agent.name}</div>
                    <div className="text-[11px] text-[#475569]">{agent.description || "No description"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#475569]">{agent.modelRef}</span>
                  <button onClick={(e) => { e.stopPropagation(); chatWithAgent(agent.id); }} className="p-1.5 hover:bg-[rgba(99,102,241,0.1)] rounded-lg" title="Chat">
                    <Play size={14} className="text-[#818cf8]" />
                  </button>
                  {agent.id !== "default" && (
                    <button onClick={(e) => { e.stopPropagation(); deleteAgent(agent.id); }} className="p-1.5 hover:bg-[rgba(239,68,68,0.1)] rounded-lg" title="Delete">
                      <Trash2 size={14} className="text-[#ef4444]" />
                    </button>
                  )}
                </div>
              </div>
              {selectedAgent?.id === agent.id && (
                <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] text-[11px] text-[#94a3b8] space-y-1">
                  <div>ID: <span className="font-mono">{agent.id}</span></div>
                  <div>Status: <span className={agent.status === "ready" ? "text-emerald-400" : "text-yellow-400"}>{agent.status}</span></div>
                  {agent.skills?.length > 0 && <div>Skills: {agent.skills.join(", ")}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
