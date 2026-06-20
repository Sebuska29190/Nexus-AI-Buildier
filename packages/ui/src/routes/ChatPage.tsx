/**
 * ChatPage — Nexus AI Coding Agent Chat
 * Clean, modern design inspired by Claude Code / OpenCode
 * Fast streaming, tool visualization, sub-agent activity
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import { 
  Settings, Copy, Plus, X, ChevronDown, ChevronRight,
  Cpu, Check, Terminal, FileCode, Search, Loader2,
  AlertCircle, CheckCircle, XCircle, Clock, Zap
} from "lucide-react";
import { api } from "../lib/api";
import { CodeBlock } from "../lib/components/chat/CodeBlock";
import { WelcomeScreen } from "../lib/components/chat/WelcomeScreen";
import { ChatInput } from "../lib/components/chat/ChatInput";
import { useChat } from "../lib/chat/useChat";

marked.setOptions({
  highlight: (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
} as any);

// ─── Types ──────────────────────────────────────────────────────────────────

interface SettingsCfg {
  model: string;
  autoApprove: boolean;
}

interface ToolActivity {
  id: string;
  tool: string;
  args?: any;
  status: "pending" | "running" | "done" | "error";
  result?: string;
  duration?: number;
  timestamp: number;
}

// ─── Tool Status Icon ───────────────────────────────────────────────────────

function ToolStatusIcon({ status }: { status: ToolActivity["status"] }) {
  switch (status) {
    case "pending":
      return <Clock size={12} className="text-[#4a5068]" />;
    case "running":
      return <Loader2 size={12} className="text-[#00d4ff] animate-spin" />;
    case "done":
      return <CheckCircle size={12} className="text-[#22c55e]" />;
    case "error":
      return <XCircle size={12} className="text-[#ef4444]" />;
  }
}

// ─── Tool Call Card ─────────────────────────────────────────────────────────

function ToolCallCard({ tool }: { tool: ToolActivity }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border border-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
      >
        <ToolStatusIcon status={tool.status} />
        <span className="text-[11px] font-mono text-[#8892a8]">{tool.tool}</span>
        {tool.duration !== undefined && (
          <span className="text-[9px] text-[#4a5068] ml-auto">{(tool.duration / 1000).toFixed(1)}s</span>
        )}
        <ChevronRight size={10} className={`text-[#4a5068] transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && tool.result && (
        <div className="px-3 pb-2 border-t border-[rgba(255,255,255,0.04)]">
          <pre className="text-[10px] text-[#6b7280] font-mono mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {tool.result.slice(0, 1000)}
            {tool.result.length > 1000 && "..."}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Activity Panel ─────────────────────────────────────────────────────────

function ActivityPanel({ 
  tools, 
  status, 
  thinking 
}: { 
  tools: ToolActivity[];
  status: "idle" | "thinking" | "running" | "done";
  thinking?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  
  if (status === "idle") return null;
  
  return (
    <div className="border-t border-[rgba(255,255,255,0.06)] bg-[rgba(10,11,30,0.8)] p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[10px] text-[#4a5068] hover:text-[#8892a8] transition-colors"
      >
        {status === "thinking" ? (
          <Loader2 size={10} className="text-[#6366f1] animate-spin" />
        ) : status === "running" ? (
          <Loader2 size={10} className="text-[#00d4ff] animate-spin" />
        ) : (
          <CheckCircle size={10} className="text-[#22c55e]" />
        )}
        <span className="font-mono">
          {status === "thinking" && "Thinking..."}
          {status === "running" && `Running ${tools.length} tool${tools.length !== 1 ? "s" : ""}`}
          {status === "done" && `Done ${tools.length} tool${tools.length !== 1 ? "s" : ""}`}
        </span>
        <ChevronDown size={10} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      
      {expanded && (
        <div className="mt-2 space-y-1">
          {thinking && (
            <div className="text-[10px] text-[#6366f1] font-mono bg-[rgba(99,102,241,0.05)] rounded p-2">
              {thinking.slice(0, 200)}
              {thinking.length > 200 && "..."}
            </div>
          )}
          {tools.map((tool) => (
            <ToolCallCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface ChatPageProps {
  models?: Array<{ id: string }>;
  skills?: any[];
  agents?: any[];
  sessions?: any[];
  onRefresh?: () => void;
  sessionKey?: string;
  onSessionKeyChange?: (key: string) => void;
}

export function ChatPage({
  models = [],
  skills = [],
  agents = [],
  sessions = [],
  onRefresh,
  sessionKey: initialSessionId = "",
  onSessionKeyChange,
}: ChatPageProps) {
  const chat = useChat();
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SettingsCfg>({
    model: "deepseek/deepseek-chat",
    autoApprove: false,
  });
  const [groupedModels, setGroupedModels] = useState<Record<string, { name: string; hasApiKey: boolean; models: { id: string; name: string }[] }>>({});
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolActivity[]>([]);
  const [status, setStatus] = useState<"idle" | "thinking" | "running" | "done">("idle");
  const [thinking, setThinking] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages, chat.streamingContent]);

  // Fetch models
  useEffect(() => {
    fetch("/api/models/grouped")
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.grouped) setGroupedModels(d.grouped);
      })
      .catch(() => {});
  }, []);

  // Track tool activity from chat
  useEffect(() => {
    if (chat.activity.length > 0) {
      setTools(chat.activity.map((a, i) => ({
        id: `${i}`,
        tool: a.tool || "",
        args: a.args,
        status: a.duration !== undefined ? "done" : "running",
        result: a.result,
        duration: a.duration,
        timestamp: a.timestamp || Date.now(),
      })));
      setStatus(chat.isRunning ? "running" : "done");
    } else if (chat.isThinking) {
      setStatus("thinking");
      setThinking(chat.thinking || "");
    } else if (chat.isRunning) {
      setStatus("running");
    } else {
      setStatus("idle");
    }
  }, [chat.activity, chat.isThinking, chat.isRunning, chat.thinking]);

  // Send message
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    // Handle slash commands
    if (text.startsWith("/")) {
      if (text === "/clear") {
        chat.clearMessages();
        setInput("");
        return;
      }
      if (text === "/help") {
        chat.send("Available commands:\n- `/clear` — Clear conversation\n- `/help` — Show this help", { model: settings.model });
        setInput("");
        return;
      }
      setInput("");
      return;
    }

    setTools([]);
    setStatus("running");
    chat.send(text, { model: settings.model });
    setInput("");
  }, [input, chat, settings.model]);

  const cancel = useCallback(() => {
    chat.abort();
    setStatus("idle");
  }, [chat]);

  // Render markdown
  const renderContent = useCallback((content: string): string => {
    let html = marked.parse(content) as string;
    html = html.replace(
      /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
      (_, lang, code) => `<div class="code-block-wrapper" data-lang="${lang}"><pre><code class="language-${lang}">${code}</code></pre></div>`
    );
    html = html.replace(
      /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
      (_, code) => `<div class="code-block-wrapper" data-lang="text"><pre><code>${code}</code></pre></div>`
    );
    return html;
  }, []);

  // Context bar
  const contextBar = (() => {
    const MODEL_CONTEXT: Record<string, number> = {
      "deepseek/deepseek-chat": 64000,
      "openai/gpt-4o": 128000,
      "anthropic/claude-sonnet-4": 200000,
    };
    const contextLimit = MODEL_CONTEXT[settings.model] || 128000;
    const totalChars = chat.messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    const estimatedTokens = Math.round(totalChars / 3.5);
    const pct = Math.min(100, Math.round((estimatedTokens / contextLimit) * 100));

    return (
      <div className="shrink-0 px-6 py-1.5 border-t border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.01)]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct > 90
                  ? "bg-[#ef4444]"
                  : pct > 70
                  ? "bg-[#f59e0b]"
                  : "bg-gradient-to-r from-[#00d4ff] to-[#6366f1]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[9px] text-[#4a5068] font-mono shrink-0">
            ~{estimatedTokens >= 1000000
              ? `${(estimatedTokens / 1000000).toFixed(1)}M`
              : `${(estimatedTokens / 1000).toFixed(0)}K`
            } / {contextLimit >= 1000000
              ? `${(contextLimit / 1000000).toFixed(0)}M`
              : `${(contextLimit / 1000).toFixed(0)}K`
            } tokens
          </span>
        </div>
      </div>
    );
  })();

  return (
    <div className="flex flex-col h-full max-h-[calc(100dvh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-[rgba(255,255,255,0.06)] bg-[#0a0b1e]/90 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00d4ff] via-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_14px_rgba(0,212,255,0.25)]">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-white tracking-tight">Nexus</span>
          {chat.sessionId && (
            <span className="text-[9px] text-[#475569] font-mono">{chat.sessionId.slice(0, 8)}</span>
          )}
          {chat.connected ? (
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
          )}

          {/* Model Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#94a3b8] font-mono hover:border-[rgba(0,212,255,0.15)] transition-all"
            >
              <Cpu size={12} />
              <span>{settings.model.split("/").pop()}</span>
              <ChevronDown size={10} />
            </button>

            {showModelDropdown && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-[#0d0f20] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden z-50">
                {Object.entries(groupedModels).map(([providerId, provider]) => (
                  <div key={providerId}>
                    <button
                      onClick={() => setExpandedProvider(expandedProvider === providerId ? null : providerId)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-[rgba(255,255,255,0.04)] transition-colors border-b border-[rgba(255,255,255,0.04)]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                        <span className="text-xs text-[#e8ecf2] font-medium">{provider.name}</span>
                        <span className="text-[9px] text-[#4a5068]">{provider.models.length}m</span>
                      </div>
                      <ChevronDown
                        size={12}
                        className={`text-[#4a5068] transition-transform ${
                          expandedProvider === providerId ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {expandedProvider === providerId && (
                      <div className="bg-[rgba(0,0,0,0.2)]">
                        {provider.models.map(model => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSettings(s => ({ ...s, model: model.id }));
                              setShowModelDropdown(false);
                              setExpandedProvider(null);
                            }}
                            className={`w-full px-4 py-1.5 text-left text-[11px] flex items-center gap-2 transition-colors ${
                              settings.model === model.id
                                ? "bg-[rgba(0,212,255,0.08)] text-[#00d4ff]"
                                : "text-[#8892a8] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e8ecf2]"
                            }`}
                          >
                            <span className="font-mono">{model.id.split("/").pop()}</span>
                            {settings.model === model.id && <Check size={12} className="ml-auto text-[#00d4ff]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => chat.clearMessages()}
            className="px-3 py-1 rounded-lg text-[10px] text-[#8892a8] hover:text-[#e8ecf2] hover:bg-[rgba(255,255,255,0.04)] transition-all flex items-center gap-1"
          >
            <Plus size={12} /> New
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-[#4a5068] hover:text-[#8892a8] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.04)]"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {chat.messages.length <= 1 ? (
              <WelcomeScreen onSelectPrompt={(text) => setInput(text)} />
            ) : (
              <div className="space-y-6">
                {chat.messages.filter(m => m.role !== "system").map((msg) => (
                  <div key={msg.id} className={`animate-fade-in-up ${msg.role === "user" ? "flex justify-end" : ""}`}>
                    {msg.role === "assistant" ? (
                      <div className="glass-card rounded-2xl p-4 max-w-[85%]">
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="mb-3 space-y-1">
                            {msg.toolCalls.map((tc, i) => (
                              <ToolCallCard
                                key={i}
                                tool={{
                                  id: `${i}`,
                                  tool: tc.tool,
                                  args: tc.args,
                                  status: tc.duration !== undefined ? "done" : "running",
                                  duration: tc.duration,
                                  timestamp: Date.now(),
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <div
                          className="prose-nova text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderContent(msg.content)) }}
                        />
                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-[rgba(255,255,255,0.04)]">
                          <span className="text-[9px] text-[#475569]">
                            {msg.duration && `${(msg.duration / 1000).toFixed(1)}s`}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="p-1.5 text-[#475569] hover:text-[#00d4ff] hover:bg-[rgba(0,212,255,0.08)] rounded-lg transition-all ml-auto"
                            title="Copy"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-[#00d4ff] via-[#6366f1] to-[#8b5cf6] rounded-2xl px-4 py-3 max-w-[75%] ml-auto shadow-[0_4px_16px_rgba(0,212,255,0.12)]">
                        <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-[9px] text-[rgba(255,255,255,0.5)] mt-1 block text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Live streaming */}
                {(chat.isThinking || chat.isRunning) && (
                  <div className="animate-fade-in-up">
                    {chat.isThinking && chat.thinking && (
                      <div className="glass-card rounded-2xl p-4 max-w-[85%] mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Loader2 size={12} className="text-[#6366f1] animate-spin" />
                          <span className="text-[10px] text-[#6366f1] font-mono">Thinking...</span>
                        </div>
                        <div className="text-[11px] text-[#6b7280] font-mono whitespace-pre-wrap">
                          {chat.thinking.slice(0, 300)}
                          {chat.thinking.length > 300 && "..."}
                        </div>
                      </div>
                    )}

                    {chat.isRunning && chat.streamingContent && (
                      <div className="glass-card rounded-2xl p-4 max-w-[85%]">
                        <div
                          className="prose-nova text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderContent(chat.streamingContent)) }}
                        />
                        <span className="inline-block w-1.5 h-4 bg-[#6366f1] animate-pulse ml-0.5" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Activity Panel */}
        <ActivityPanel tools={tools} status={status} thinking={thinking} />

        {/* Settings */}
        {showSettings && (
          <div className="w-72 border-l border-[rgba(255,255,255,0.06)] bg-[rgba(18,18,26,0.95)] p-4 overflow-y-auto shrink-0 animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-[#475569] hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-[#475569] uppercase tracking-wider mb-1 block">Model</label>
                <select
                  value={settings.model}
                  onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
                  className="glass-input w-full px-3 py-2 text-xs"
                >
                  {(models.length > 0 ? models : [{ id: "deepseek/deepseek-chat" }]).map(m => (
                    <option key={m.id} value={m.id}>{m.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#475569] uppercase tracking-wider mb-1 block">Active Skills</label>
                <div className="flex flex-wrap gap-1">
                  {skills.filter((s: any) => s.enabled !== false).slice(0, 8).map((s: any) => (
                    <span
                      key={s.id || s.name}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(99,102,241,0.06)] text-[#818cf8] border border-[rgba(99,102,241,0.15)]"
                    >
                      {s.name || s.id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {contextBar}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={send}
        onCancel={cancel}
        loading={chat.isRunning}
        streaming={chat.isRunning}
        files={[]}
        onFilesAdd={() => {}}
        onFileRemove={() => {}}
        slashCommands={[
          { cmd: "/clear", desc: "Clear conversation" },
          { cmd: "/help", desc: "Show available commands" },
        ]}
        onSlashSelect={(cmd) => setInput(cmd)}
        model={settings.model}
      />
    </div>
  );
}
