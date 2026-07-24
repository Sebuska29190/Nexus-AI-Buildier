/**
 * ChatBubble — Premium message bubble with user/assistant variants
 * Cyan/violet gradient for user, glass card for assistant.
 * Shows avatar, timestamp, and hover action buttons.
 */
import { motion } from "framer-motion";
import { cn } from "../../utils";
import { MessageActions } from "./MessageActions";

export interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

function getInitials(role: "user" | "assistant"): string {
  return role === "user" ? "U" : "AF";
}

export function ChatBubble({
  role,
  content,
  timestamp,
  isStreaming = false,
  onCopy,
  onRegenerate,
}: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] as const }}
      className={cn(
        "group flex gap-3 max-w-[85%] mb-4",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold",
          isUser
            ? "bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] text-white shadow-[0_0_16px_rgba(6,182,212,0.3)]"
            : "bg-[rgba(17,17,20,0.85)] border border-[rgba(255,255,255,0.08)] text-[#a1a1aa]"
        )}
      >
        {getInitials(role)}
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-1.5 relative">
        <div
          className={cn(
            "px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white rounded-2xl rounded-br-md shadow-[0_4px_24px_rgba(6,182,212,0.2)]"
              : "bg-[rgba(17,17,20,0.6)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.06)] text-[#d4d4d8] rounded-2xl rounded-bl-md"
          )}
        >
          {/* Streaming cursor */}
          <span className="whitespace-pre-wrap">{content}</span>
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#06b6d4] animate-pulse rounded-sm align-text-bottom" />
          )}
        </div>

        {/* Timestamp + actions row */}
        <div
          className={cn(
            "flex items-center gap-2",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          {timestamp && (
            <span className="text-[10px] text-[rgba(255,255,255,0.2)] select-none">
              {timestamp}
            </span>
          )}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <MessageActions
              onCopy={onCopy}
              onRegenerate={!isUser ? onRegenerate : undefined}
              content={content}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
