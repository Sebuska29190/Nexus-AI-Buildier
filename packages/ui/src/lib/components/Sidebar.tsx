import { useState } from "react";
import {
  MessageSquare, Users, History, Terminal,
  Puzzle, Brain, BarChart3, BookOpen,
  Settings, Search, PanelLeftClose,
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
      <aside className="w-14 bg-[#111113] border-r border-[rgba(255,255,255,0.06)] flex flex-col items-center z-20 py-2">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2.5 text-[#71717A] hover:text-[#F59E0B] transition-colors duration-200 rounded-md hover:bg-[rgba(245,158,11,0.08)]"
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
                className={`p-2.5 rounded-md transition-all duration-200 ${
                  route === item.id
                    ? "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                    : "text-[#71717A] hover:text-[#E4E4E7] hover:bg-[rgba(255,255,255,0.04)]"
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
    <aside className="w-64 bg-[#111113] border-r border-[rgba(255,255,255,0.06)] flex flex-col justify-between z-20 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-30">
      <div className="overflow-y-auto flex-1">
        {/* Branding */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#F59E0B] to-[#EA580C] flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 9L18 9L16.5 11.5L7.5 11.5Z" fill="#0a0a0b"/>
                <path d="M5 9L2.5 9.8L2.5 11L5 11Z" fill="#0a0a0b"/>
                <rect x="10.5" y="11.5" width="3" height="6" fill="#0a0a0b"/>
                <rect x="8" y="17.5" width="8" height="2.5" rx="0.5" fill="#0a0a0b"/>
                <path d="M12 3L13 6.5L12 6L11 6.5Z" fill="#FCD34D"/>
                <path d="M15 4.5L15.5 7L14.5 6.5L14 7.5Z" fill="#FCD34D"/>
                <path d="M9 4.5L8.5 7L9.5 6.5L10 7.5Z" fill="#FCD34D"/>
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="font-extrabold text-sm tracking-wide text-white font-mono">AGENTFORGE</h1>
              <span className="text-[9px] text-[#FCD34D] tracking-widest uppercase font-mono font-semibold">v{version || "4.0"}</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-[#71717A] hover:text-[#E4E4E7] transition-colors duration-200 max-md:hidden"
              title="Zwiń sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#71717A]" />
            <input
              type="text"
              placeholder="Szukaj lub wklej ID sesji..."
              className="w-full pl-9 pr-4 py-2 text-[11px] bg-[#161618] border border-[rgba(255,255,255,0.06)] rounded-md text-[#E4E4E7] placeholder-[#71717A] focus:outline-none focus:border-[rgba(245,158,11,0.3)] focus:bg-[rgba(245,158,11,0.04)] transition-all duration-200"
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
              <div className="text-[9px] font-bold text-[#71717A] uppercase tracking-[0.15em] px-3 mb-1.5 font-mono">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((item: NavItem) => {
                  const Icon = item.icon;
                  const isActive = route === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onRoute(item.id)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-[rgba(245,158,11,0.08)] text-[#F59E0B] shadow-[inset_3px_0_0_0_#F59E0B]"
                          : "text-[#A1A1AA] hover:text-[#E4E4E7] hover:bg-[rgba(255,255,255,0.04)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={isActive ? "text-[#F59E0B]" : "text-[#71717A]"} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold bg-[rgba(255,255,255,0.05)] text-[#71717A]">
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
              <div className="text-[9px] font-bold text-[#71717A] uppercase tracking-[0.15em] px-3 mb-1.5 font-mono">OSTATNIE</div>
              <div className="space-y-0.5">
                {recentSessions.map((s) => {
                  const model = s.modelRef || s.model || "deepseek";
                  const shortModel = model.includes("/") ? model.split("/").pop() : model.slice(0, 12);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => resumeSession(s.id)}
                      className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-[11px] font-mono text-[#71717A] hover:text-[#E4E4E7] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 truncate text-left"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[rgba(245,158,11,0.4)] shrink-0" />
                      <span className="truncate">{shortModel}</span>
                      <span className="text-[9px] text-[#71717A] ml-auto shrink-0">{s.messageCount || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.06)] bg-[#111113]">
        <div className="flex items-center justify-between p-2 rounded-md hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#F59E0B] to-[#EA580C] flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 9L18 9L16.5 11.5L7.5 11.5Z" fill="#0a0a0b"/>
                <rect x="10.5" y="11.5" width="3" height="6" fill="#0a0a0b"/>
                <rect x="8" y="17.5" width="8" height="2.5" rx="0.5" fill="#0a0a0b"/>
                <path d="M12 3L13 6.5L12 6L11 6.5Z" fill="#FCD34D"/>
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white">AgentForge</div>
              <div className="text-[9px] text-[#71717A]">v{version || "4.0"}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
