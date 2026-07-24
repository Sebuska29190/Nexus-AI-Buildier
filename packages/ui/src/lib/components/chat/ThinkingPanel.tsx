/**
 * ThinkingPanel — Collapsible panel showing AI reasoning/thinking
 * Glass card with cyan left border glow.
 * framer-motion for smooth expand/collapse.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../utils";

export interface ThinkingPanelProps {
  content: string;
  isThinking?: boolean;
}

export function ThinkingPanel({ content, isThinking = false }: ThinkingPanelProps) {
  const [expanded, setExpanded] = useState(isThinking);

  if (!content && !isThinking) return null;

  return (
    <div
      className={cn(
        "my-3 rounded-xl overflow-hidden",
        "bg-[rgba(17,17,20,0.6)] backdrop-blur-[24px]",
        "border border-[rgba(255,255,255,0.06)]",
        "border-l-[3px] border-l-[#06b6d4]",
        isThinking && "shadow-[inset_3px_0_16px_-4px_rgba(6,182,212,0.2),0_0_24px_rgba(6,182,212,0.06)]"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-150"
      >
        {/* Brain icon — pulses when actively thinking */}
        <div className="relative flex-shrink-0">
          <Brain
            size={15}
            className={cn(
              "transition-colors duration-300",
              isThinking ? "text-[#06b6d4]" : "text-[#52525b]"
            )}
          />
          {isThinking && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#06b6d4] animate-ping" />
          )}
        </div>

        {/* Label */}
        <span
          className={cn(
            "text-[12px] font-medium transition-colors duration-300",
            isThinking ? "text-[#06b6d4]" : "text-[#a1a1aa]"
          )}
        >
          {isThinking ? "Thinking..." : "Thinking"}
        </span>

        {/* Live dot */}
        {isThinking && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse flex-shrink-0" />
        )}

        {/* Chevron */}
        <span className="ml-auto text-[#52525b] flex-shrink-0">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      {/* Body — animated expand/collapse */}
      <AnimatePresence initial={false}>
        {expanded && content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-[rgba(255,255,255,0.04)]">
              <p className="text-[12px] text-[#a1a1aa] leading-relaxed whitespace-pre-wrap italic">
                {content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
