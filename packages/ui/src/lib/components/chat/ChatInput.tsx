/**
 * ChatInput — Premium floating input bar with auto-resize, slash commands, file preview
 * Glass background, cyan gradient send button, model indicator chip.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, Square, X, Mic } from "lucide-react";
import { cn } from "../../utils";

interface SlashCommand {
  cmd: string;
  desc: string;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  model?: string;
  onStop?: () => void;
  slashCommands?: SlashCommand[];
  onSlashSelect?: (cmd: string) => void;
  files?: File[];
  onFilesAdd?: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  onVoiceToggle?: () => void;
  voiceActive?: boolean;
}

const FILE_ICONS: Record<string, string> = {
  "image/": "🖼️",
  "video/": "🎬",
  "audio/": "🎵",
  "application/pdf": "📕",
  "text/": "📄",
};

function getFileIcon(file: File): string {
  for (const [prefix, icon] of Object.entries(FILE_ICONS)) {
    if (file.type.startsWith(prefix)) return icon;
  }
  return "📎";
}

export function ChatInput({
  onSend,
  isLoading = false,
  model,
  onStop,
  slashCommands = [],
  onSlashSelect,
  files = [],
  onFilesAdd,
  onFileRemove,
  onVoiceToggle,
  voiceActive,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSlash, setShowSlash] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const filtered = slashCommands.filter((c) =>
    c.cmd.toLowerCase().includes(slashFilter.toLowerCase())
  );

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    setShowSlash(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isLoading, onSend]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Slash command navigation
    if (showSlash) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
        return;
      }
      if ((e.key === "Tab" || e.key === "Enter") && filtered[selectedIdx]) {
        e.preventDefault();
        const cmd = filtered[selectedIdx].cmd + " ";
        if (onSlashSelect) {
          onSlashSelect(cmd);
        }
        setValue(cmd);
        setShowSlash(false);
        setSlashFilter("");
        textareaRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        setShowSlash(false);
        setSlashFilter("");
        return;
      }
    }

    // Send on Enter (no shift) or Ctrl+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setValue(val);

    // Detect slash commands
    if (val.startsWith("/") && slashCommands.length > 0) {
      setShowSlash(true);
      setSlashFilter(val);
      setSelectedIdx(0);
    } else {
      setShowSlash(false);
    }
  }

  return (
    <div className="px-4 pb-4 pt-2">
      {/* File Preview */}
      {files.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-xs"
            >
              <span>{getFileIcon(f)}</span>
              <span className="text-[#A1A1AA] truncate max-w-[120px]">
                {f.name}
              </span>
              <span className="text-[10px] text-[#71717A]">
                {(f.size / 1024).toFixed(0)}KB
              </span>
              {onFileRemove && (
                <button
                  onClick={() => onFileRemove(i)}
                  className="text-[#71717A] hover:text-[#ef4444] ml-0.5"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Slash Command Popover */}
      {showSlash && filtered.length > 0 && (
        <div className="mb-2 bg-[rgba(17,17,20,0.95)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
          {filtered.slice(0, 8).map((cmd, i) => (
            <button
              key={cmd.cmd}
              onClick={() => {
                const full = cmd.cmd + " ";
                if (onSlashSelect) onSlashSelect(full);
                setValue(full);
                setShowSlash(false);
                setSlashFilter("");
                textareaRef.current?.focus();
              }}
              className={cn(
                "w-full px-3 py-2 text-left flex items-center gap-3 transition-colors",
                i === selectedIdx
                  ? "bg-[rgba(6,182,212,0.1)]"
                  : "hover:bg-[rgba(255,255,255,0.04)]"
              )}
            >
              <span className="text-xs text-[#06b6d4] font-mono w-24">
                {cmd.cmd}
              </span>
              <span className="text-[10px] text-[#71717A]">{cmd.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-xl p-3",
          "bg-[rgba(17,17,20,0.6)] backdrop-blur-[24px]",
          "border border-[rgba(255,255,255,0.06)]",
          "focus-within:border-[rgba(6,182,212,0.3)]",
          "focus-within:shadow-[0_0_24px_rgba(6,182,212,0.06)]",
          "transition-all duration-200"
        )}
      >
        {/* File attach button */}
        <button
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex-shrink-0 p-2 rounded-lg transition-all duration-150",
            "text-[#52525b] hover:text-[#06b6d4]",
            "hover:bg-[rgba(6,182,212,0.08)]"
          )}
        >
          <Paperclip size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && onFilesAdd)
              onFilesAdd(Array.from(e.target.files));
            e.target.value = "";
          }}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            showSlash
              ? "Type a command..."
              : "Ask AgentForge anything... (type / for commands)"
          }
          rows={1}
          disabled={isLoading}
          className={cn(
            "flex-1 bg-transparent border-none outline-none resize-none",
            "text-sm text-[#e4e4e7] placeholder-[#52525b]",
            "leading-relaxed py-1.5",
            "disabled:opacity-50"
          )}
          style={{ minHeight: "24px", maxHeight: "200px" }}
        />

        {/* Right side: voice + model chip + send */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Voice toggle */}
          {onVoiceToggle && (
            <button
              onClick={onVoiceToggle}
              className={cn(
                "p-2 rounded-lg transition-all duration-150",
                voiceActive
                  ? "text-red-400 animate-pulse"
                  : "text-[#52525b] hover:text-[#06b6d4] hover:bg-[rgba(6,182,212,0.08)]"
              )}
            >
              <Mic size={16} />
            </button>
          )}

          {/* Model indicator chip */}
          {model && (
            <span
              className={cn(
                "hidden sm:inline-flex items-center px-2 py-0.5 rounded-md",
                "bg-[rgba(17,17,20,0.85)] border border-[rgba(255,255,255,0.08)]",
                "text-[10px] text-[#52525b] font-mono"
              )}
            >
              {model.split("/").pop()}
            </span>
          )}

          {/* Send / Stop button */}
          {isLoading ? (
            <button
              onClick={onStop}
              title="Stop generation"
              className={cn(
                "p-2 rounded-lg transition-all duration-150",
                "text-red-400 hover:text-red-300",
                "hover:bg-[rgba(239,68,68,0.1)]"
              )}
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!value.trim() && files.length === 0}
              title="Send message (Enter)"
              className={cn(
                "p-2 rounded-lg transition-all duration-150",
                "text-white disabled:text-[#3f3f46]",
                "bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]",
                "shadow-[0_2px_12px_rgba(6,182,212,0.2)]",
                "hover:shadow-[0_4px_20px_rgba(6,182,212,0.35)]",
                "hover:-translate-y-0.5",
                "active:translate-y-0",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "disabled:hover:translate-y-0 disabled:hover:shadow-none",
                "disabled:bg-none disabled:bg-[#27272a]"
              )}
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Hints row */}
      <div className="flex items-center justify-between px-3 mt-2">
        <span className="text-[10px] text-[#3f3f46]">
          {model && (
            <span className="text-[#52525b]">{model.split("/").pop()}</span>
          )}
        </span>
        <span className="text-[10px] text-[#3f3f46]">
          <kbd className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.03)] text-[#52525b] font-mono text-[9px]">
            /
          </kbd>{" "}
          commands ·{" "}
          <kbd className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.03)] text-[#52525b] font-mono text-[9px]">
            Enter
          </kbd>{" "}
          send ·{" "}
          <kbd className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.03)] text-[#52525b] font-mono text-[9px]">
            Shift+Enter
          </kbd>{" "}
          newline
        </span>
      </div>
    </div>
  );
}
