import { Folder } from "lucide-react";

interface StatusBarProps {
  connected: boolean;
  version: string;
  selectedModel: string;
  models: Array<{ id: string }>;
  workspaceName: string;
  onWorkspacePick: () => void;
  onModelChange: (model: string) => void;
  onNewChat: () => void;
}

export function StatusBar({
  connected, version, selectedModel, models, workspaceName, onWorkspacePick, onModelChange, onNewChat,
}: StatusBarProps) {
  const modelLabel = (id: string) => {
    const short = id.split("/").pop() || id;
    return short.length > 24 ? short.slice(0, 24) + "..." : short;
  };

  return (
    <header className="h-14 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-6 z-10 bg-[#111113]">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-[#22c55e] active-dot" : "bg-[#71717A]"}`} />
        <span className="text-xs font-mono text-[#71717A]">
          {connected ? (
            <><span className="text-[#F59E0B]">AgentForge</span> v{version} · {modelLabel(selectedModel)}</>
          ) : (
            <span className="text-[#ef4444]">Disconnected</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedModel}
          className="px-3 py-1.5 text-xs bg-[#161618] border border-[rgba(255,255,255,0.06)] rounded-md text-[#E4E4E7] cursor-pointer"
          onChange={(e) => onModelChange(e.target.value)}
        >
          {models.length > 0 ? (
            models.map((m) => (
              <option key={m.id} value={m.id}>{modelLabel(m.id)}</option>
            ))
          ) : (
            <>
              <option value="deepseek/deepseek-chat">deepseek-chat</option>
              <option value="deepseek/deepseek-coder">deepseek-coder</option>
            </>
          )}
        </select>

        <button
          onClick={onWorkspacePick}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs bg-[#161618] border border-[rgba(255,255,255,0.06)] rounded-md text-[#A1A1AA] hover:text-[#E4E4E7] hover:bg-[rgba(255,255,255,0.04)] transition-all"
        >
          <Folder size={14} className="text-[#F59E0B]" />
          <span>{workspaceName || "No folder selected"}</span>
        </button>

        <button
          onClick={onNewChat}
          className="px-3.5 py-1.5 text-xs bg-gradient-to-r from-[#F59E0B] to-[#EA580C] text-white rounded-md font-medium hover:shadow-[0_0_16px_rgba(245,158,11,0.3)] transition-all"
        >
          New Chat
        </button>
      </div>
    </header>
  );
}
