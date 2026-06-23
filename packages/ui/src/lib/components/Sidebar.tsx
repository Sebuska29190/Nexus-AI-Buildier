import { useState } from "react";
import {
  MessageSquare, Users, Zap, History, Brain,
  FolderGit2, Terminal,
  BookOpen, Search, Orbit,
  Code
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
  { label: "AI Agent", items: [
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "agents", icon: Users, label: "Agents" },
    { id: "skills", icon: Zap, label: "Skills" },
  ]},
  { label: "Development", items: [
    { id: "workspace", icon: FolderGit2, label: "Workspace" },
    { id: "terminal", icon: Terminal, label: "Terminal" },
    { id: "code", icon: Code, label: "Code Editor" },
  ]},
  { label: "Data", items: [
    { id: "sessions", icon: History, label: "Sessions" },
    { id: "memory", icon: Brain, label: "Memory" },
  ]},
  { label: "Configuration", items: [
    { id: "aimodels", icon: BookOpen, label: "Models" },
    { id: "playground", icon: Search, label: "Playground" },
    { id: "docs", icon: BookOpen, label: "Docs" },
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
    .sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime())
    .slice(0, 5);

  if (collapsed) {
    return (
      <aside className="w-14 bg-[rgba(18,18,26,0.95)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.06)] flex flex-col items-center z-20">
        <button
          onClick={() => setCollapsed(false)}
          className="p-3 text-[#475569] hover:text-[#6366f1] transition-colors duration-200"
          title="Expand sidebar"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <nav className="flex flex-col gap-1 mt-2 w-full px-2">
          {navGroups.flatMap(g => g.items).slice(0, 12).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onRoute(item.id)}
                title={item.label}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  route === item.id
                    ? "bg-[rgba(99,102,241,0.12)] text-[#818cf8] shadow-[0_0_12px_rgba(99,102,241,0.1)]"
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
    <aside className="w-64 bg-[rgba(18,18,26,0.95)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.06)] flex flex-col justify-between z-20 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-30">
      <div className="overflow-y-auto flex-1">
        {/* Branding */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Orbit size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-extrabold text-sm tracking-wide text-white font-mono">NEXUS AI</h1>
              <span className="text-[9px] text-[#818cf8] tracking-widest uppercase font-mono font-semibold">CODING AGENT</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-[#475569] hover:text-[#f1f5f9] transition-colors duration-200 max-md:hidden"
              title="Collapse sidebar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#475569]" />
            <input
              type="text"
              placeholder="Search or paste Session ID..."
              className="glass-input w-full pl-9 pr-4 py-2 text-[11px]"
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
              <div className="text-[9px] font-bold text-[#475569] uppercase tracking-widest px-3 mb-1">{group.label}</div>
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
                          ? "bg-[rgba(99,102,241,0.1)] text-white shadow-[inset_3px_0_0_0_#6366f1]"
                          : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.04)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={isActive ? "text-[#818cf8]" : ""} />
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

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-[#475569] uppercase tracking-widest px-3 mb-1">Recent Sessions</div>
              <div className="space-y-0.5">
                {recentSessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => resumeSession(s.id)}
                    className="flex items-center gap-2 w-full px-3 py-1.5 rounded-xl text-[11px] font-mono text-[#475569] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 truncate text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgba(99,102,241,0.4)] shrink-0" />
                    <span className="truncate">{s.modelRef || s.model || s.id?.slice(0, 12)}</span>
                    <span className="text-[9px] text-[#475569] ml-auto shrink-0">{s.messageCount || s.messages?.length || 0}msgs</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom: Profile */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.6)]">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]">
              OP
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white">Operator</div>
              <div className="text-[9px] text-[#475569]">core@nexus-ai</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
