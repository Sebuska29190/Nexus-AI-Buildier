import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Users, History, Terminal,
  Puzzle, Brain, BarChart3, BookOpen,
  Settings, PanelLeftClose, PanelLeft,
  Code2, Key, ChevronDown, ChevronRight,
  Search
} from "lucide-react";
import { cn } from "../utils";
import { isActiveRoute } from "../utils/routeAliases";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface Session {
  id: string;
  createdAt?: string;
  created_at?: string;
  modelRef?: string;
  model?: string;
  messageCount?: number;
}

interface SidebarProps {
  route: string;
  onRoute: (r: string) => void;
  version: string;
  sessions?: Session[];
}

// ─── Navigation structure ────────────────────────────────────────────────────

// Defensive aliases for route ids that may appear in more than one
// form are defined centrally in `lib/utils/routeAliases.ts`
// (imported at the top of this file). Sidebar uses
// `isActiveRoute(item.id, route)` so the apikeys button still lights
// up when state holds an alias like `api-keys`.

const navGroups: NavGroup[] = [
  {
    label: "WORK",
    items: [
      { id: "chat", icon: MessageSquare, label: "Chat" },
      { id: "agentconfig", icon: Users, label: "Agents" },
      { id: "sessions", icon: History, label: "Sessions" },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { id: "terminal", icon: Terminal, label: "Terminal" },
      { id: "skills", icon: Puzzle, label: "Skills" },
      { id: "code", icon: Code2, label: "Editor" },
    ],
  },
  {
    label: "DATA",
    items: [
      { id: "memory", icon: Brain, label: "Memory" },
      { id: "workspace", icon: BarChart3, label: "Workspace" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { id: "aimodels", icon: BookOpen, label: "Models" },
      { id: "docs", icon: BookOpen, label: "Docs" },
      { id: "settings", icon: Settings, label: "Settings" },
      { id: "apikeys", icon: Key, label: "API Keys" },
    ],
  },
];

// ─── Sidebar widths ──────────────────────────────────────────────────────────

const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 56;

// ─── Component ───────────────────────────────────────────────────────────────

export function Sidebar({ route, onRoute, version, sessions = [] }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return window.innerWidth < 768; } catch { return false; }
  });
  const [sessionsExpanded, setSessionsExpanded] = useState(true);

  const recentSessions = [...sessions]
    .filter((s) => s && (s.createdAt || s.created_at))
    .sort((a, b) => {
      const ta = new Date(a.createdAt || a.created_at || 0).getTime();
      const tb = new Date(b.createdAt || b.created_at || 0).getTime();
      return tb - ta;
    })
    .slice(0, 5);

  function resumeSession(id: string) {
    window.dispatchEvent(
      new CustomEvent("nova-resume-session", { detail: { sessionId: id } })
    );
  }

  // ─── Collapsed sidebar ───────────────────────────────────────────────────

  if (collapsed) {
    return (
      <motion.aside
        initial={{ width: EXPANDED_WIDTH }}
        animate={{ width: COLLAPSED_WIDTH }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "bg-[rgba(17,17,20,0.4)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.06)]",
          "flex flex-col items-center z-20 py-2 shrink-0"
        )}
      >
        {/* Expand button */}
        <button
          onClick={() => setCollapsed(false)}
          className="p-2.5 text-[#71717A] hover:text-[#06b6d4] transition-colors duration-200 rounded-md hover:bg-[rgba(255,255,255,0.04)]"
          title="Expand sidebar"
        >
          <PanelLeft size={16} />
        </button>

        <div className="w-8 h-px bg-[rgba(255,255,255,0.06)] my-2" />

        {/* Nav icons */}
        <nav className="flex flex-col gap-1 w-full px-2">
          {navGroups.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.id, route);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onRoute(item.id)}
                title={item.label}
                className={cn(
                  "relative p-2.5 rounded-md transition-all duration-200",
                  isActive
                    ? "bg-[rgba(6,182,212,0.08)] text-[#06b6d4] shadow-[0_0_12px_rgba(6,182,212,0.08)]"
                    : "text-[#71717A] hover:text-[#E4E4E7] hover:bg-[rgba(255,255,255,0.04)]"
                )}
              >
                {/* Active left bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator-collapsed"
                    className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-[#06b6d4]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon size={16} />
              </button>
            );
          })}
        </nav>
      </motion.aside>
    );
  }

  // ─── Expanded sidebar ────────────────────────────────────────────────────

  return (
    <motion.aside
      initial={{ width: COLLAPSED_WIDTH }}
      animate={{ width: EXPANDED_WIDTH }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "bg-[rgba(17,17,20,0.4)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.06)]",
        "flex flex-col justify-between z-20 shrink-0",
        "max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-30"
      )}
    >
      <div className="overflow-y-auto flex-1 scrollbar-thin">
        {/* ── Logo / Branding ──────────────────────────────────────────────── */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            {/* Icon mark */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M6 9L18 9L16.5 11.5L7.5 11.5Z" fill="#0a0a0b" />
                <path d="M5 9L2.5 9.8L2.5 11L5 11Z" fill="#0a0a0b" />
                <rect x="10.5" y="11.5" width="3" height="6" fill="#0a0a0b" />
                <rect x="8" y="17.5" width="8" height="2.5" rx="0.5" fill="#0a0a0b" />
                <path d="M12 3L13 6.5L12 6L11 6.5Z" fill="#fff" />
                <path d="M15 4.5L15.5 7L14.5 6.5L14 7.5Z" fill="#fff" />
                <path d="M9 4.5L8.5 7L9.5 6.5L10 7.5Z" fill="#fff" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-extrabold text-sm tracking-wide font-mono bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
                AgentForge
              </h1>
              <span className="text-[9px] text-[#52525B] tracking-widest uppercase font-mono font-semibold">
                v{version || "4.0"}
              </span>
            </div>

            {/* Collapse button */}
            <button
              onClick={() => setCollapsed(true)}
              className="text-[#71717A] hover:text-[#E4E4E7] transition-colors duration-200 max-md:hidden"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search or paste session ID…"
              className={cn(
                "w-full pl-9 pr-4 py-2 text-[11px] rounded-md font-mono",
                "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]",
                "text-[#E4E4E7] placeholder-[#52525B]",
                "focus:outline-none focus:border-[rgba(6,182,212,0.3)] focus:bg-[rgba(6,182,212,0.04)]",
                "transition-all duration-200"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) resumeSession(val);
                }
              }}
            />
          </div>
        </div>

        {/* ── Navigation groups ───────────────────────────────────────────── */}
        <nav className="px-3 space-y-4 pb-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {/* Section header */}
              <div className="text-[9px] font-bold text-[#52525B] uppercase tracking-[0.15em] px-3 mb-1.5 font-mono">
                {group.label}
              </div>

              <div className="space-y-0.5">
                {group.items.map((item: NavItem) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.id, route);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onRoute(item.id)}
                      className={cn(
                        "relative flex items-center justify-between w-full px-3 py-2 rounded-md text-xs font-medium transition-all duration-200",
                        isActive
                          ? "bg-[rgba(6,182,212,0.08)] text-[#06b6d4]"
                          : "text-[#71717A] hover:text-[#E4E4E7] hover:bg-[rgba(255,255,255,0.04)]"
                      )}
                    >
                      {/* Active left bar */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-[#06b6d4]"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}

                      <div className="flex items-center gap-2.5">
                        <Icon
                          size={16}
                          className={cn(
                            isActive ? "text-[#06b6d4]" : "text-[#71717A]"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold bg-[rgba(255,255,255,0.05)] text-[#52525B]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── Recent sessions ────────────────────────────────────────────── */}
          {recentSessions.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setSessionsExpanded((prev) => !prev)}
                className="flex items-center gap-1.5 text-[9px] font-bold text-[#52525B] uppercase tracking-[0.15em] px-3 mb-1.5 font-mono hover:text-[#71717A] transition-colors w-full"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={sessionsExpanded ? "down" : "right"}
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.15 }}
                  >
                    {sessionsExpanded ? (
                      <ChevronDown size={10} />
                    ) : (
                      <ChevronRight size={10} />
                    )}
                  </motion.span>
                </AnimatePresence>
                Recent Sessions
              </button>

              <AnimatePresence initial={false}>
                {sessionsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5">
                      {recentSessions.map((s) => {
                        const model = s.modelRef || s.model || "deepseek";
                        const shortModel = model.includes("/")
                          ? model.split("/").pop()
                          : model.slice(0, 12);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => resumeSession(s.id)}
                            className={cn(
                              "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-[11px] font-mono",
                              "text-[#71717A] hover:text-[#E4E4E7] hover:bg-[rgba(255,255,255,0.04)]",
                              "transition-all duration-200 truncate text-left"
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(6,182,212,0.4)] shrink-0" />
                            <span className="truncate">{shortModel}</span>
                            <span className="text-[9px] text-[#52525B] ml-auto shrink-0">
                              {s.messageCount || 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>
      </div>

      {/* ── Bottom: version badge ──────────────────────────────────────────── */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
        <div
          className={cn(
            "flex items-center gap-2.5 p-2 rounded-md",
            "bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]",
            "hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 cursor-default"
          )}
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M6 9L18 9L16.5 11.5L7.5 11.5Z" fill="#0a0a0b" />
              <rect x="10.5" y="11.5" width="3" height="6" fill="#0a0a0b" />
              <rect x="8" y="17.5" width="8" height="2.5" rx="0.5" fill="#0a0a0b" />
              <path d="M12 3L13 6.5L12 6L11 6.5Z" fill="#fff" />
            </svg>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white">AgentForge</div>
            <div className="text-[9px] text-[#52525B] font-mono">
              v{version || "4.0"}
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
