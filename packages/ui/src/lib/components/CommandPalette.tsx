import { useCallback, useEffect } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Users, History, Terminal,
  Puzzle, Code2, Brain, BarChart3, BookOpen,
  Settings, Key, Search, Zap,
  FileText, RotateCcw,
} from "lucide-react";
import { cn } from "../utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (route: string) => void;
}

interface PaletteItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  route?: string;
  action?: () => void;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const PAGE_ITEMS: PaletteItem[] = [
  { id: "chat",        label: "Chat",        icon: MessageSquare, shortcut: "⌘1", route: "chat" },
  { id: "agents",      label: "Agents",      icon: Users,         shortcut: "⌘2", route: "agentconfig" },
  { id: "sessions",    label: "Sessions",    icon: History,       shortcut: "⌘3", route: "sessions" },
  { id: "terminal",    label: "Terminal",    icon: Terminal,      shortcut: "⌘4", route: "terminal" },
  { id: "skills",      label: "Skills",      icon: Puzzle,        shortcut: "⌘5", route: "skills" },
  { id: "editor",      label: "Editor",      icon: Code2,         shortcut: "⌘6", route: "code" },
  { id: "memory",      label: "Memory",      icon: Brain,         route: "memory" },
  { id: "workspace",   label: "Workspace",   icon: BarChart3,     route: "workspace" },
  { id: "models",      label: "Models",      icon: BookOpen,      route: "aimodels" },
  { id: "docs",        label: "Docs",        icon: FileText,      route: "docs" },
  { id: "settings",    label: "Settings",    icon: Settings,      shortcut: "⌘,", route: "settings" },
  { id: "apikeys",     label: "API Keys",    icon: Key,           route: "apikeys" },
];

const ACTION_ITEMS: PaletteItem[] = [
  { id: "new-chat",     label: "New Chat",     icon: MessageSquare, shortcut: "⌘N" },
  { id: "resume",       label: "Resume Session", icon: RotateCcw },
  { id: "run-skill",    label: "Run Skill",    icon: Zap },
];

// ─── Overlay backdrop ────────────────────────────────────────────────────────

function GlassOverlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={() => {}}
      role="presentation"
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      if (item.route) {
        onNavigate(item.route);
      } else if (item.action) {
        item.action();
      }
      handleClose();
    },
    [onNavigate, handleClose]
  );

  // Global ⌘K / Ctrl+K toggle
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <GlassOverlay onClose={handleClose} />

          {/* ── Palette container ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[70]"
          >
            <Command
              label="Command palette"
              className={cn(
                "overflow-hidden rounded-xl",
                "bg-[rgba(17,17,20,0.85)] backdrop-blur-2xl",
                "border border-[rgba(255,255,255,0.08)]",
                "shadow-[0_16px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(6,182,212,0.06)]"
              )}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Escape") handleClose();
              }}
            >
              {/* ── Search input ──────────────────────────────────────────── */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <Search size={16} className="text-[#52525B] shrink-0" />
                <Command.Input
                  autoFocus
                  placeholder="Search pages, actions…"
                  className={cn(
                    "flex-1 bg-transparent border-none outline-none text-sm text-[#E4E4E7] placeholder-[#52525B] font-mono"
                  )}
                />
                <kbd
                  className={cn(
                    "text-[10px] font-mono text-[#52525B]",
                    "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]",
                    "px-1.5 py-0.5 rounded"
                  )}
                >
                  ESC
                </kbd>
              </div>

              {/* ── Results ───────────────────────────────────────────────── */}
              <Command.List className="max-h-[320px] overflow-y-auto py-1 scrollbar-thin">
                <Command.Empty className="px-4 py-6 text-center text-xs text-[#52525B] font-mono">
                  No results found.
                </Command.Empty>

                {/* Pages group */}
                <Command.Group heading="Pages" className="px-2 [&>[cmdk-group-heading]]:text-[9px] [&>[cmdk-group-heading]]:font-bold [&>[cmdk-group-heading]]:text-[#52525B] [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-[0.15em] [&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:font-mono">
                  {PAGE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.id}
                        value={item.label}
                        onSelect={() => handleSelect(item)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer",
                          "text-[#A1A1AA] text-sm font-medium",
                          "transition-all duration-100",
                          "data-[selected=true]:bg-[rgba(6,182,212,0.08)] data-[selected=true]:text-[#06b6d4]",
                          "hover:bg-[rgba(255,255,255,0.04)]"
                        )}
                      >
                        <Icon size={16} className="shrink-0 text-[#71717A] group-data-[selected=true]:text-[#06b6d4]" />
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <kbd
                            className={cn(
                              "text-[9px] font-mono text-[#52525B]",
                              "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]",
                              "px-1.5 py-0.5 rounded shrink-0"
                            )}
                          >
                            {item.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    );
                  })}
                </Command.Group>

                {/* Actions group */}
                <Command.Group heading="Actions" className="px-2 pt-1 [&>[cmdk-group-heading]]:text-[9px] [&>[cmdk-group-heading]]:font-bold [&>[cmdk-group-heading]]:text-[#52525B] [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-[0.15em] [&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:font-mono">
                  {ACTION_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.id}
                        value={item.label}
                        onSelect={() => handleSelect(item)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer",
                          "text-[#A1A1AA] text-sm font-medium",
                          "transition-all duration-100",
                          "data-[selected=true]:bg-[rgba(6,182,212,0.08)] data-[selected=true]:text-[#06b6d4]",
                          "hover:bg-[rgba(255,255,255,0.04)]"
                        )}
                      >
                        <Icon size={16} className="shrink-0 text-[#71717A]" />
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <kbd
                            className={cn(
                              "text-[9px] font-mono text-[#52525B]",
                              "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]",
                              "px-1.5 py-0.5 rounded shrink-0"
                            )}
                          >
                            {item.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </Command.List>

              {/* ── Footer ────────────────────────────────────────────────── */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-1.5">
                  <kbd className="text-[9px] font-mono text-[#52525B] bg-[rgba(255,255,255,0.04)] px-1 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">↑↓</kbd>
                  <span className="text-[9px] text-[#52525B] font-mono">navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="text-[9px] font-mono text-[#52525B] bg-[rgba(255,255,255,0.04)] px-1 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">⏎</kbd>
                  <span className="text-[9px] text-[#52525B] font-mono">select</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="text-[9px] font-mono text-[#52525B] bg-[rgba(255,255,255,0.04)] px-1 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">⌘K</kbd>
                  <span className="text-[9px] text-[#52525B] font-mono">toggle</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
