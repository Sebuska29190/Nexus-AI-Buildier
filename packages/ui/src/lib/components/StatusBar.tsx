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
    <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 z-10 bg-[#0e1117]/70 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 active-dot" : "bg-slate-600"}`} />
        <span className="text-xs font-mono text-gray-400">
          Agent Status: <strong className="text-white">{modelLabel(selectedModel)} {connected ? "(active)" : "(offline)"}</strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedModel}
          className="bg-[#161b22] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-teal-500/50 transition-all"
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
          className="flex items-center gap-2 bg-[#161b22] hover:bg-[#1c2333] border border-gray-800 rounded-lg px-3.5 py-1.5 text-xs text-gray-300 transition-all"
        >
          <Folder size={14} className="text-teal-400" />
          <span>{workspaceName || "No folder selected"}</span>
        </button>

        <button
          onClick={onNewChat}
          className="bg-[#161b22] hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all"
        >
          New Chat
        </button>
      </div>
    </header>
  );
}
