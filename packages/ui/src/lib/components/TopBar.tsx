import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Command,
  Search,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "../utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  route: string;
  connectionStatus?: "connected" | "disconnected";
  currentModel?: string;
  onOpenCommandPalette?: () => void;
}

// ─── Route → breadcrumb mapping ──────────────────────────────────────────────

const ROUTE_META: Record<string, { section: string; label: string }> = {
  chat:         { section: "Work",   label: "Chat" },
  agentconfig:  { section: "Work",   label: "Agents" },
  sessions:     { section: "Work",   label: "Sessions" },
  terminal:     { section: "Tools",  label: "Terminal" },
  skills:       { section: "Tools",  label: "Skills" },
  code:         { section: "Tools",  label: "Editor" },
  memory:       { section: "Data",   label: "Memory" },
  workspace:    { section: "Data",   label: "Workspace" },
  aimodels:     { section: "System", label: "Models" },
  docs:         { section: "System", label: "Docs" },
  settings:     { section: "System", label: "Settings" },
  apikeys:      { section: "System", label: "API Keys" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TopBar({
  route,
  connectionStatus = "disconnected",
  currentModel,
  onOpenCommandPalette,
}: TopBarProps) {
  const breadcrumbs = useMemo(() => {
    const meta = ROUTE_META[route];
    if (!meta) return [{ label: route }];
    return [{ label: meta.section }, { label: meta.label }];
  }, [route]);

  const isConnected = connectionStatus === "connected";

  return (
    <header
      className={cn(
        "h-11 shrink-0 flex items-center justify-between px-4 z-10",
        "bg-[rgba(17,17,20,0.4)] backdrop-blur-xl",
        "border-b border-[rgba(255,255,255,0.06)]"
      )}
    >
      {/* ── Left: Breadcrumb ──────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 min-w-0">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <span key={idx} className="flex items-center gap-1.5 min-w-0">
              {idx > 0 && (
                <ChevronRight size={12} className="text-[#52525B] shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs font-medium truncate transition-colors duration-200",
                  isLast ? "text-[#E4E4E7]" : "text-[#52525B]"
                )}
              >
                {crumb.label}
              </span>
            </span>
          );
        })}
      </nav>

      {/* ── Right: Controls ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Model indicator badge */}
        {currentModel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md",
              "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]",
              "text-[10px] font-mono text-[#71717A]"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] shrink-0" />
            <span className="truncate max-w-[120px]">{currentModel}</span>
          </motion.div>
        )}

        {/* Connection status dot */}
        <div className="relative flex items-center" title={isConnected ? "Connected" : "Disconnected"}>
          <span
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              isConnected ? "bg-emerald-500" : "bg-[#52525B]"
            )}
          />
          {isConnected && (
            <motion.span
              className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <span className="sr-only">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Command palette trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-md",
            "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]",
            "text-[#71717A] hover:text-[#E4E4E7] hover:bg-[rgba(255,255,255,0.06)]",
            "transition-all duration-200 group"
          )}
        >
          <Search size={13} className="text-[#52525B] group-hover:text-[#71717A] transition-colors" />
          <span className="text-[11px] font-mono text-[#52525B] hidden sm:inline">
            Search…
          </span>
          <kbd
            className={cn(
              "hidden sm:inline-flex items-center gap-0.5",
              "text-[9px] font-mono text-[#52525B]",
              "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]",
              "px-1 py-0.5 rounded"
            )}
          >
            <Command size={9} />K
          </kbd>
        </button>
      </div>
    </header>
  );
}
