import { useState, useEffect } from "react";
import { MessageSquare, Users, Brain, Terminal, Activity, Sparkles, ChevronRight, Orbit } from "lucide-react";

interface DashboardPageProps {
  agents?: any[];
  sessions?: any[];
  models?: any[];
  health?: any;
  connected?: boolean;
  onNavigate?: (route: string) => void;
}

const QUICK_AGENTS = [
  { id: "auditor", emoji: "🔍", name: "Audit", color: "from-[#F59E0B] to-[#EA580C]" },
  { id: "auto-coder", emoji: "💻", name: "Coder", color: "from-[#F59E0B] to-[#FCD34D]" },
  { id: "code-reviewer", emoji: "👁️", name: "Review", color: "from-[#22C55E] to-[#4ADE80]" },
  { id: "tester", emoji: "🧪", name: "Tester", color: "from-[#EAB308] to-[#FACC15]" },
  { id: "security-auditor", emoji: "🛡️", name: "Security", color: "from-[#EF4444] to-[#F87171]" },
  { id: "python-pro", emoji: "🐍", name: "Python", color: "from-[#3B82F6] to-[#60A5FA]" },
];

export function DashboardPage({ agents = [], sessions = [], models = [], health, connected, onNavigate }: DashboardPageProps) {
  const [stats, setStats] = useState({ agents: 0, sessions: 0, models: 0, tools: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/tools").then(r => r.json()).then(d => d.tools?.length || 0).catch(() => 0),
    ]).then(([toolsCount]) => {
      setStats({ agents: agents.length || 0, sessions: sessions.length || 0, models: models.length || 0, tools: toolsCount });
    });
  }, [agents, sessions, models]);

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
    .slice(0, 5);

  const statCards = [
    { icon: Users, label: "Agenci", value: stats.agents, color: "text-[#F59E0B]", bg: "bg-[rgba(245,158,11,0.08)]" },
    { icon: Activity, label: "Narzędzia", value: stats.tools, color: "text-[#F59E0B]", bg: "bg-[rgba(245,158,11,0.08)]" },
    { icon: MessageSquare, label: "Sesje", value: stats.sessions, color: "text-[#F59E0B]", bg: "bg-[rgba(245,158,11,0.08)]" },
    { icon: Brain, label: "Modele", value: stats.models, color: "text-[#F59E0B]", bg: "bg-[rgba(245,158,11,0.08)]" },
  ];

  return (
    <div className="max-w-6xl mx-auto w-full p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Orbit size={28} className="text-[#F59E0B]" />
            AgentForge
            <span className="text-sm font-mono text-[#71717A] font-normal">v4.0</span>
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Platforma agentów AI — {stats.agents} specjalistów, {stats.tools} narzędzi, {stats.models} modeli
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-[#22C55E]" : "bg-[#EF4444]"}`} />
          <span className="text-xs text-[#71717A]">{connected ? "Online" : "Offline"}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bg} border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(255,255,255,0.10)] transition-all duration-200`}>
              <div className="flex items-center gap-3">
                <Icon size={20} className={card.color} />
                <span className="text-xs text-[#A1A1AA]">{card.label}</span>
              </div>
              <div className="text-2xl font-bold text-white mt-2">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Agents */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white tracking-wide font-mono">⚡ Szybki start</h2>
          <button
            onClick={() => onNavigate?.("agents")}
            className="text-xs text-[#F59E0B] hover:text-[#EA580C] transition-colors flex items-center gap-1"
          >
            Wszyscy agenci <ChevronRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {QUICK_AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                window.dispatchEvent(new CustomEvent("nova-navigate", { detail: "chat" }));
              }}
              className="group relative bg-[#161618] border border-[rgba(255,255,255,0.06)] rounded-md p-4 hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 text-center"
            >
              <div className={`w-10 h-10 mx-auto rounded-md bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg shadow-lg mb-2`}>
                {agent.emoji}
              </div>
              <div className="text-xs font-medium text-white">{agent.name}</div>
              <div className="text-[9px] text-[#71717A] mt-0.5">Kliknij by użyć</div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Sessions + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white tracking-wide font-mono">📋 Ostatnie sesje</h2>
            <button
              onClick={() => onNavigate?.("sessions")}
              className="text-xs text-[#F59E0B] hover:text-[#EA580C] transition-colors flex items-center gap-1"
            >
              Wszystkie <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {recentSessions.length === 0 ? (
              <div className="text-xs text-[#71717A] p-4 bg-[#161618] rounded-lg border border-[rgba(255,255,255,0.06)] text-center">
                Brak sesji — rozpocznij nowy czat
              </div>
            ) : (
              recentSessions.map((s: any) => {
                const model = s.modelRef || s.model || "deepseek";
                const shortModel = model.includes("/") ? model.split("/").pop() : model;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("nova-resume-session", { detail: { sessionId: s.id } }));
                    }}
                    className="flex items-center justify-between w-full p-3 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.10)] transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[rgba(245,158,11,0.4)] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-white truncate">{shortModel}</div>
                        <div className="text-[10px] text-[#71717A] mt-0.5">{s.messageCount || 0} wiadomości</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[#71717A] shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* System Health */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white tracking-wide font-mono">🔧 System</h2>
            <span className={`text-xs ${connected ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {connected ? "online" : "offline"}
            </span>
          </div>
          <div className="space-y-2 bg-[#161618] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
            <div className="flex justify-between text-xs">
              <span className="text-[#A1A1AA]">Status</span>
              <span className="text-white">{connected ? "🟢 Online" : "🔴 Offline"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A1A1AA]">Wersja</span>
              <span className="text-white font-mono">4.0.0</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A1A1AA]">API</span>
              <span className="text-white">{stats.models} modeli / {stats.tools} narzędzi</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A1A1AA]">Agenci</span>
              <span className="text-white">{stats.agents} specjalistów</span>
            </div>
            {health?.uptime && (
              <div className="flex justify-between text-xs">
                <span className="text-[#A1A1AA]">Uptime</span>
                <span className="text-white font-mono">{Math.round(health.uptime)}s</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onNavigate?.("chat")}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#EA580C] text-white text-sm font-semibold rounded-md hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-200"
        >
          <MessageSquare size={16} />
          Nowy czat
        </button>
        <button
          onClick={() => onNavigate?.("terminal")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#161618] border border-[rgba(255,255,255,0.08)] text-white text-sm font-semibold rounded-md hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200"
        >
          <Terminal size={16} />
          Terminal
        </button>
      </div>
    </div>
  );
}
