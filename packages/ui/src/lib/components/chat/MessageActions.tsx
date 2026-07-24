/**
 * MessageActions — Hover action buttons for chat bubbles
 * Copy, Regenerate, Branch icons in a small glass pill.
 * Fades in on hover via parent group.
 */
import { useState } from "react";
import { Copy, RefreshCw, GitBranch, Check } from "lucide-react";
import { cn } from "../../utils";

export interface MessageActionsProps {
  onCopy?: () => void;
  onRegenerate?: () => void;
  content?: string;
}

export function MessageActions({ onCopy, onRegenerate, content }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (onCopy) {
      onCopy();
    } else if (content) {
      try {
        await navigator.clipboard.writeText(content);
      } catch {
        /* clipboard not available */
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleBranch() {
    // Placeholder — branch conversation from this point
    // Hook into conversation tree when implemented
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-1 rounded-full",
        "bg-[rgba(17,17,20,0.85)] backdrop-blur-[24px]",
        "border border-[rgba(255,255,255,0.08)]",
        "shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
      )}
    >
      {/* Copy */}
      <button
        onClick={handleCopy}
        title="Copy message"
        className={cn(
          "p-1.5 rounded-full transition-all duration-150",
          copied
            ? "text-emerald-400"
            : "text-[#71717a] hover:text-[#06b6d4] hover:bg-[rgba(6,182,212,0.1)]"
        )}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>

      {/* Regenerate */}
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          title="Regenerate response"
          className="p-1.5 rounded-full text-[#71717a] hover:text-[#06b6d4] hover:bg-[rgba(6,182,212,0.1)] transition-all duration-150"
        >
          <RefreshCw size={12} />
        </button>
      )}

      {/* Branch */}
      <button
        onClick={handleBranch}
        title="Branch conversation"
        className="p-1.5 rounded-full text-[#71717a] hover:text-[#8b5cf6] hover:bg-[rgba(139,92,246,0.1)] transition-all duration-150"
      >
        <GitBranch size={12} />
      </button>
    </div>
  );
}
