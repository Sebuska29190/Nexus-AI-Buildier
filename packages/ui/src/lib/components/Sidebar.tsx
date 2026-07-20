import { useState } from "react";
import {
  MessageSquare, Users, History, Terminal,
  Puzzle, Brain, BarChart3, BookOpen,
  Settings, Search, Orbit, PanelLeftClose,
  PanelLeft, Sparkles
} from "lucide-react";

interface SidebarProps {
  route: string;
  onRoute: (r: string) => void;
  version: string;
  sessions?: any[];
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "PRACA", items: [
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "agentconfig", icon: Users, label: "Agenci" },
    { id: "sessions", icon: History, label: "Sesje" },
  ]},
  { label: "NARZĘDZIA", items: [
    { id: "terminal", icon: Terminal, label: "Terminal" },
    { id: "skills", icon: Puzzle, label: "Narzędzia" },
    { id: "code", icon: Sparkles, label: "Edytor" },
  ]},
  { label: "DANE", items: [
    { id: "memory", icon: Brain, label: "Pamięć" },
    { id: "workspace", icon: BarChart3, label: "Workspace" },
  ]},
  { label: "SYSTEM", items: [
    { id: "aimodels", icon: BookOpen, label: "Modele" },
    { id: "docs", icon: BookOpen, label: "Dokumentacja" },
    { id: "settings", icon: Settings, label: "Ustawienia" },
    { id: "apikeys", icon: Settings, label: "Klucze API" },
  ]},
];

export function Sidebar({ route, onRoute, version, sessions = [] }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return window.innerWidth < 768; } catch { return false; }
  });

  function resumeSession(id: string) {
    window.dispatchEvent(new CustomEvent("nova-resume-session", { detail: { sessionId: id } }));
  }

  const recentSessions = [...sessions]
    .filter(s => s && (s.createdAt || s.created_at))
    .sort((a, b) => {
      const ta = new Date(a.createdAt || a.created_at || 0).getTime();
      const tb = new Date(b.createdAt || b.created_at || 0).getTime();
      return tb - ta;
    })
    .slice(0, 5);

  if (collapsed) {
    return (
      <aside className="w-14 bg-[rgba(10,10,18,0.98)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.05)] flex flex-col items-center z-20 py-2">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2.5 text-[#475569] hover:text-[#818cf8] transition-colors duration-200 rounded-xl hover:bg-[rgba(99,102,241,0.08)]"
          title="Rozwiń sidebar"
        >
          <PanelLeft size={16} />
        </button>
        <div className="w-8 h-px bg-[rgba(255,255,255,0.06)] my-2" />
        <nav className="flex flex-col gap-1 w-full px-2">
          {navGroups.flatMap(g => g.items).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onRoute(item.id)}
                title={item.label}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  route === item.id
                    ? "bg-[rgba(99,102,241,0.12)] text-[#818cf8] shadow-[0_0_12px_rgba(99,102,241,0.08)]"
                    : "text-[#475569] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-[rgba(10,10,18,0.98)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.05)] flex flex-col justify-between z-20 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-30">
      <div className="overflow-y-auto flex-1">
        {/* Branding */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.25)]">
              <Orbit size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-extrabold text-sm tracking-wide text-white font-mono">AGENTFORGE</h1>
              <span className="text-[9px] text-[#06B6D4] tracking-widest uppercase font-mono font-semibold">v{version || "4.0"}</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-[#475569] hover:text-[#f1f5f9] transition-colors duration-200 max-md:hidden"
              title="Zwiń sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#475569]" />
            <input
              type="text"
              placeholder="Szukaj lub wklej ID sesji..."
              className="w-full pl-9 pr-4 py-2 text-[11px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#7C3AED]/30 focus:bg-[rgba(124,58,237,0.04)] transition-all duration-200"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) resumeSession(val);
                }
              }}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-4 pb-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="text-[9px] font-bold text-[#475569] uppercase tracking-[0.15em] px-3 mb-1.5">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((item: NavItem) => {
                  const Icon = item.icon;
                  const isActive = route === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onRoute(item.id)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-[rgba(124,58,237,0.1)] text-white shadow-[inset_3px_0_0_0_#7C3AED]"
                          : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.04)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={isActive ? "text-[#06B6D4]" : "text-[#475569]"} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-lg font-mono font-bold bg-[rgba(255,255,255,0.05)] text-[#475569]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Ostatnie sesje */}
          {recentSessions.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-[#475569] uppercase tracking-[0.15em] px-3 mb-1.5">OSTATNIE</div>
              <div className="space-y-0.5">
                {recentSessions.map((s) => {
                  const model = s.modelRef || s.model || "deepseek";
                  const shortModel = model.includes("/") ? model.split("/").pop() : model.slice(0, 12);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => resumeSession(s.id)}
                      className="flex items-center gap-2 w-full px-3 py-1.5 rounded-xl text-[11px] font-mono text-[#475569] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 truncate text-left"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]/40 shrink-0" />
                      <span className="truncate">{shortModel}</span>
                      <span className="text-[9px] text-[#475569] ml-auto shrink-0">{s.messageCount || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(10,10,18,0.6)]">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_12px_rgba(124,58,237,0.2)]">
              NX
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white">AgentForge</div>
              <div className="text-[9px] text-[#475569]">v{version || "4.0"}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
