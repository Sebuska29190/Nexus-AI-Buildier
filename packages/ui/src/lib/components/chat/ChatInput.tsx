/**
 * ChatInput — Floating premium input bar with auto-resize, slash commands, file preview
 */
import { useState, useRef, useEffect } from "react";
import { Send, Square, Paperclip, Mic, X, FileText, Image, FileCode } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onCancel: () => void;
  loading: boolean;
  streaming: boolean;
  files: File[];
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  slashCommands: { cmd: string; desc: string }[];
  onSlashSelect: (cmd: string) => void;
  model?: string;
  onVoiceToggle?: () => void;
  voiceActive?: boolean;
}

const FILE_ICONS: Record<string, string> = {
  "image/": "🖼️", "video/": "🎬", "audio/": "🎵",
  "application/pdf": "📕", "text/": "📄",
};

function getFileIcon(file: File): string {
  for (const [prefix, icon] of Object.entries(FILE_ICONS)) {
    if (file.type.startsWith(prefix)) return icon;
  }
  return "📎";
}

export function ChatInput({
  value, onChange, onSend, onCancel, loading, streaming,
  files, onFilesAdd, onFileRemove, slashCommands, onSlashSelect,
  model, onVoiceToggle, voiceActive,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSlash, setShowSlash] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const filtered = slashCommands.filter(c => c.cmd.toLowerCase().includes(slashFilter.toLowerCase()));

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
    }
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showSlash) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(prev => Math.min(prev + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(prev => Math.max(prev - 1, 0)); }
      else if ((e.key === "Tab" || e.key === "Enter") && filtered[selectedIdx]) {
        e.preventDefault();
        onSlashSelect(filtered[selectedIdx].cmd + " ");
        setShowSlash(false);
        setSlashFilter("");
      }
      else if (e.key === "Escape") { setShowSlash(false); setSlashFilter(""); }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    onChange(val);
    if (val.startsWith("/")) {
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
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-xs">
              <span>{getFileIcon(f)}</span>
              <span className="text-[#A1A1AA] truncate max-w-[120px]">{f.name}</span>
              <span className="text-[10px] text-[#71717A]">{(f.size / 1024).toFixed(0)}KB</span>
              <button onClick={() => onFileRemove(i)} className="text-[#71717A] hover:text-[#ef4444] ml-0.5"><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Slash Command Popover */}
      {showSlash && filtered.length > 0 && (
        <div className="mb-2 bg-[#111113] border border-[rgba(255,255,255,0.08)] rounded-md shadow-xl overflow-hidden">
          {filtered.slice(0, 8).map((cmd, i) => (
            <button
              key={cmd.cmd}
              onClick={() => { onSlashSelect(cmd.cmd + " "); setShowSlash(false); setSlashFilter(""); }}
              className={`w-full px-3 py-2 text-left flex items-center gap-3 transition-colors ${
                i === selectedIdx ? "bg-[rgba(245,158,11,0.1)]" : "hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <span className="text-xs text-[#F59E0B] font-mono w-24">{cmd.cmd}</span>
              <span className="text-[10px] text-[#71717A]">{cmd.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-[#161618] border border-[rgba(255,255,255,0.06)] rounded-md p-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask AgentForge anything..."
          rows={1}
          className="w-full bg-transparent border-none outline-none text-sm text-white resize-none px-3 py-2 placeholder-[#71717A]"
          style={{ minHeight: "40px", maxHeight: "150px" }}
        />

        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()}
              className="p-2 text-[#71717A] hover:text-[#A1A1AA] transition-colors rounded-md hover:bg-[rgba(255,255,255,0.04)]">
              <Paperclip size={16} />
            </button>
            {onVoiceToggle && (
              <button onClick={onVoiceToggle}
                className={`p-2 transition-colors rounded-md ${voiceActive ? "text-[#ef4444] animate-pulse" : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.04)]"}`}>
                <Mic size={16} />
              </button>
            )}
            <input ref={fileInputRef} type="file" multiple className="hidden"
              onChange={e => { if (e.target.files) onFilesAdd(Array.from(e.target.files)); e.target.value = ""; }} />
          </div>

          <div className="flex items-center gap-2">
            {streaming ? (
              <button onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#ef4444] text-xs font-medium hover:bg-[rgba(239,68,68,0.15)] transition-all">
                <Square size={12} /> Stop
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={loading || (!value.trim() && files.length === 0)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-[#F59E0B] to-[#EA580C] text-white text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(245,158,11,0.35)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <Send size={12} /> Send
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hints */}
      <div className="flex items-center justify-between px-3 mt-1.5">
        <span className="text-[9px] text-[rgba(255,255,255,0.15)]">
          {model && <span className="text-[#71717A]">{model}</span>}
        </span>
        <span className="text-[9px] text-[rgba(255,255,255,0.15)]">
          Enter to send · Shift+Enter for newline
        </span>
      </div>
    </div>
  );
}
