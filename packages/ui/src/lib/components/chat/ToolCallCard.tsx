/**
 * ToolCallCard — Collapsible card showing tool execution details
 * Glass card with colored left border based on status.
 * framer-motion AnimatePresence for expand/collapse.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Wrench,
} from "lucide-react";
import { cn } from "../../utils";

export interface ToolCallCardProps {
  toolName: string;
  args?: string;
  result?: string;
  status: "running" | "done" | "error";
  durationMs?: number;
}

const STATUS_CONFIG = {
  running: {
    borderColor: "border-l-[#06b6d4]",
    glowColor: "shadow-[inset_3px_0_12px_-4px_rgba(6,182,212,0.25)]",
    iconColor: "text-[#06b6d4]",
    label: "Running",
    Icon: Loader2,
  },
  done: {
    borderColor: "border-l-emerald-500",
    glowColor: "shadow-[inset_3px_0_12px_-4px_rgba(16,185,129,0.2)]",
    iconColor: "text-emerald-400",
    label: "Done",
    Icon: CheckCircle2,
  },
  error: {
    borderColor: "border-l-red-500",
    glowColor: "shadow-[inset_3px_0_12px_-4px_rgba(239,68,68,0.2)]",
    iconColor: "text-red-400",
    label: "Error",
    Icon: XCircle,
  },
} as const;

function formatDuration(ms?: number): string {
  if (ms === undefined) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatJson(str?: string): string {
  if (!str) return "";
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

export function ToolCallCard({
  toolName,
  args,
  result,
  status,
  durationMs,
}: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.Icon;
  const hasDetails = args || result;

  return (
    <div
      className={cn(
        "my-2 rounded-lg border-l-[3px] overflow-hidden",
        "bg-[rgba(17,17,20,0.6)] backdrop-blur-[24px]",
        "border border-[rgba(255,255,255,0.06)]",
        config.borderColor,
        config.glowColor
      )}
    >
      {/* Header */}
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3.5 py-2.5 transition-colors duration-150",
          hasDetails
            ? "hover:bg-[rgba(255,255,255,0.02)] cursor-pointer"
            : "cursor-default"
        )}
      >
        {/* Tool icon */}
        <Wrench size={13} className="text-[#52525b] flex-shrink-0" />

        {/* Status icon */}
        <StatusIcon
          size={14}
          className={cn(
            config.iconColor,
            "flex-shrink-0",
            status === "running" && "animate-spin"
          )}
        />

        {/* Tool name */}
        <span className="text-[12px] font-medium text-[#e4e4e7] font-mono truncate">
          {toolName}
        </span>

        {/* Duration */}
        {durationMs !== undefined && status === "done" && (
          <span className="text-[10px] text-emerald-400/70 font-mono ml-auto flex-shrink-0">
            {formatDuration(durationMs)}
          </span>
        )}

        {/* Error badge */}
        {status === "error" && (
          <span className="ml-auto text-[10px] text-red-400 font-medium flex-shrink-0">
            Failed
          </span>
        )}

        {/* Running indicator */}
        {status === "running" && (
          <span className="ml-auto text-[10px] text-[#06b6d4] animate-pulse flex-shrink-0">
            Running...
          </span>
        )}

        {/* Expand chevron */}
        {hasDetails && (
          <span className="text-[#52525b] flex-shrink-0 ml-1">
            {expanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </span>
        )}
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3 pt-1 border-t border-[rgba(255,255,255,0.04)]">
              {/* Arguments */}
              {args && (
                <div className="mt-2">
                  <span className="text-[10px] text-[#52525b] uppercase tracking-wider font-medium">
                    Arguments
                  </span>
                  <pre className="mt-1 p-2.5 rounded-md bg-[#0a0a0f] border border-[rgba(255,255,255,0.04)] text-[11px] text-[#a1a1aa] font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {formatJson(args)}
                  </pre>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="mt-2.5">
                  <span className="text-[10px] text-[#52525b] uppercase tracking-wider font-medium">
                    Result
                  </span>
                  <pre className="mt-1 p-2.5 rounded-md bg-[#0a0a0f] border border-[rgba(255,255,255,0.04)] text-[11px] text-[#a1a1aa] font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {formatJson(result)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
