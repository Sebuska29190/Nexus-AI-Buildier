/**
 * ChatPage — AgentForge Coding Agent Chat
 * Premium UI redesign: Cyan (#06b6d4) + Violet (#8b5cf6) on deep black.
 * Preserves ALL existing WebSocket chat, tool calls, thinking, streaming, file handling.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import {
  Settings, Plus, X, ChevronDown, ChevronRight,
  Cpu, Check, Loader2,
  CheckCircle, Clock, XCircle, Sparkles,
  SplitSquareVertical, Folder, Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { ChatBubble } from "../lib/components/chat/ChatBubble";
import { CodeBlock } from "../lib/components/chat/CodeBlock";
import { ToolCallCard } from "../lib/components/chat/ToolCallCard";
import { ThinkingPanel } from "../lib/components/chat/ThinkingPanel";
import { ChatInput } from "../lib/components/chat/ChatInput";
import { WelcomeScreen } from "../lib/components/chat/WelcomeScreen";
import { MessageActions } from "../lib/components/chat/MessageActions";
import { useChat } from "../lib/chat/useChat";
import { cn } from "../lib/utils";

marked.setOptions({
  highlight: (code: string, lang: string) => {
    const langStr = typeof lang === "string" ? lang : "";
    if (langStr && hljs.getLanguage(langStr)) return hljs.highlight(code, { language: langStr }).value;
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
      return <Clock size={12} className="text-[#71717A]" />;
    case "running":
      return <Loader2 size={12} className="text-[#06b6d4] animate-spin" />;
    case "done":
      return <CheckCircle size={12} className="text-emerald-400" />;
    case "error":
      return <XCircle size={12} className="text-red-400" />;
  }
}

// ─── Activity / Tool Timeline Panel ──────────────────────────────────────────

function ActivityPanel({
  tools,
  status,
  thinking,
}: {
  tools: ToolActivity[];
  status: "idle" | "thinking" | "running" | "done";
  thinking?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  if (status === "idle") return null;

  return (
    <div className="border-t border-[rgba(255,255,255,0.06)] bg-[rgba(17,17,20,0.85)] backdrop-blur-[24px] p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[10px] text-[#71717A] hover:text-[#a1a1aa] transition-colors w-full"
      >
        {status === "thinking" ? (
          <Loader2 size={10} className="text-[#06b6d4] animate-spin" />
        ) : status === "running" ? (
          <Loader2 size={10} className="text-[#06b6d4] animate-spin" />
        ) : (
          <CheckCircle size={10} className="text-emerald-400" />
        )}
        <span className="font-mono">
          {status === "thinking" && "Myślenie..."}
          {status === "running" && `Wykonano ${tools.length} narzędzi${tools.length !== 1 ? "" : ""}`}
          {status === "done" && `Zakończono (${tools.length} narzędzi)`}
        </span>
        <ChevronDown size={10} className={`ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-1">
          {/* Thinking block — uses ThinkingPanel component */}
          {thinking && (
            <ThinkingPanel content={thinking} isThinking={status === "thinking"} />
          )}

          {/* Tool timeline */}
          {tools.map((tool, i) => (
            <TimelineItem key={tool.id || i} tool={tool} index={i} isLast={i === tools.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Timeline Item ───────────────────────────────────────────────────────────

function TimelineItem({ tool, index, isLast }: { tool: ToolActivity; index: number; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = tool.status === "done" ? "bg-emerald-400"
    : tool.status === "error" ? "bg-red-400"
    : tool.status === "running" ? "bg-[#06b6d4]"
    : "bg-[#71717A]";

  const statusIcon = tool.status === "done" ? "✓"
    : tool.status === "error" ? "✗"
    : tool.status === "running" ? "⟳"
    : "○";

  return (
    <div className="relative pl-5">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[7px] top-3 bottom-0 w-px bg-[rgba(255,255,255,0.06)]" />
      )}

      {/* Timeline dot */}
      <div className={`absolute left-[3px] top-[7px] w-2.5 h-2.5 rounded-full ${statusColor} ${
        tool.status === "running" ? "animate-pulse" : ""
      }`} />

      <button
        onClick={() => tool.result && setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-1 text-left"
      >
        <span className={`text-[10px] font-mono ${
          tool.status === "done" ? "text-emerald-400"
          : tool.status === "error" ? "text-red-400"
          : tool.status === "running" ? "text-[#06b6d4]"
          : "text-[#71717A]"
        }`}>
          {statusIcon}
        </span>
        <span className="text-[10px] font-mono text-[#a1a1aa] truncate flex-1">{tool.tool}</span>
        {tool.duration !== undefined && (
          <span className="text-[9px] text-[#71717A] font-mono shrink-0">
            {(tool.duration / 1000).toFixed(1)}s
          </span>
        )}
        {tool.result && (
          <ChevronRight size={10} className={`text-[#71717A] transition-transform ${expanded ? "rotate-90" : ""}`} />
        )}
      </button>

      {/* Duration bar */}
      {tool.duration !== undefined && (
        <div className="h-0.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden ml-2 mr-2 mb-1">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              tool.status === "done"
                ? "bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]"
                : "bg-[#06b6d4]"
            )}
            style={{ width: `${Math.min((tool.duration / 5000) * 100, 100)}%` }}
          />
        </div>
      )}

      {expanded && tool.result && (
        <div className="ml-2 mb-2 p-2 bg-[rgba(0,0,0,0.3)] rounded-md border border-[rgba(255,255,255,0.04)]">
          <pre className="text-[9px] text-[#71717A] font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
            {tool.result.slice(0, 1500)}
            {tool.result.length > 1500 && "\n..."}
          </pre>
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
  workspaceName?: string;
  onWorkspacePick?: () => void;
}

export function ChatPage({
  models = [],
  skills = [],
  agents = [],
  sessions = [],
  onRefresh,
  sessionKey: initialSessionId = "",
  onSessionKeyChange,
  workspaceName = "",
  onWorkspacePick,
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
  const [showSplitView, setShowSplitView] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Slash commands — includes agent-based commands
  const slashCommands = [
    { cmd: "/clear", desc: "Clear conversation" },
    { cmd: "/help", desc: "Show available commands" },
    { cmd: "/debug", desc: "Debug a bug in the codebase" },
    { cmd: "/analyze", desc: "Analyze project structure" },
    { cmd: "/review", desc: "Review code for bugs and security" },
    { cmd: "/test", desc: "Write unit tests" },
    { cmd: "/docs", desc: "Write documentation" },
    { cmd: "/agent", desc: "Run a multi-agent task" },
  ];

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

  // Load session history if resuming
  useEffect(() => {
    if (!initialSessionId) return;
    fetch(`/api/sessions/${initialSessionId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.messages || data.messages.length === 0) return;
        const loaded = data.messages
          .filter((m: any) => m.role === "user" || m.role === "assistant")
          .map((m: any) => ({
            id: `msg_${m.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at || Date.now()).getTime(),
          }));
        if (loaded.length > 0) {
          chat.setMessages(loaded);
          chat.setSessionId(initialSessionId);
        }
      })
      .catch(() => {});
  }, [initialSessionId]);

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

  // Send message — accepts optional message text (from ChatInput or slash command)
  const send = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;

    // Slash command map — expand /command into a full prompt
    const SLASH_PROMPTS: Record<string, string> = {
      "/debug": "Investigate and fix the reported bug in this codebase. Analyze error logs, reproduce the issue, and provide a fix with file:line references.",
      "/analyze": "Analyze the project structure and provide a comprehensive overview of architecture, dependencies, entry points, and potential issues.",
      "/review": "Review the code in this project for bugs, security issues, and improvements. Use file:line references for each finding.",
      "/test": "Write unit tests for the core functions in this project. Follow existing test patterns and achieve good coverage.",
      "/docs": "Write comprehensive documentation for this project including README, API docs, and architecture overview.",
      "/agent": "Orchestrate multiple agents to complete a complex task. Break the task into sub-tasks and delegate them.",
    };

    // Handle slash commands
    if (msg.startsWith("/")) {
      const cmd = msg.split(/\s+/)[0].toLowerCase();
      const rest = msg.slice(cmd.length).trim();

      if (cmd === "/clear") {
        chat.clearMessages();
        setInput("");
        return;
      }
      if (cmd === "/help") {
        const helpText = "Available commands:\n" + slashCommands.map(c => `- \`${c.cmd}\` — ${c.desc}`).join("\n");
        chat.send(helpText, { model: settings.model });
        setInput("");
        return;
      }
      // Expand slash command to full prompt
      const basePrompt = SLASH_PROMPTS[cmd];
      if (basePrompt) {
        const fullPrompt = rest ? `${basePrompt}\n\nAdditional context: ${rest}` : basePrompt;
        setTools([]);
        setStatus("running");
        chat.send(fullPrompt, { model: settings.model, agentId: selectedAgentId || undefined });
        setInput("");
        return;
      }
      // Unknown command
      chat.send(`Unknown command: ${cmd}. Type /help for available commands.`, { model: settings.model });
      setInput("");
      return;
    }

    setTools([]);
    setStatus("running");
    chat.send(msg, { model: settings.model, agentId: selectedAgentId || undefined });
    setInput("");
  }, [input, chat, settings.model, selectedAgentId, slashCommands]);

  const cancel = useCallback(() => {
    chat.abort();
    setStatus("idle");
  }, [chat]);

  // Render markdown to sanitized HTML
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

  // Context bar — cyan→violet gradient progress bar
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
      <div className="shrink-0 px-6 py-1.5 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(17,17,20,0.85)] backdrop-blur-[24px]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pct > 90
                  ? "bg-red-400"
                  : pct > 70
                  ? "bg-amber-400"
                  : "bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[9px] text-[#71717A] font-mono shrink-0">
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

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full max-h-[calc(100dvh-3.5rem)]">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(17,17,20,0.85)] backdrop-blur-[24px] shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo icon — cyan→violet gradient */}
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_14px_rgba(6,182,212,0.25)]">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-xs font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
              AgentForge
            </span>
          </span>
          {chat.sessionId && (
            <span className="text-[9px] text-[#71717A] font-mono">{chat.sessionId.slice(0, 8)}</span>
          )}
          {chat.connected ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          )}

          {/* Model Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(17,17,20,0.85)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#a1a1aa] font-mono hover:border-[rgba(6,182,212,0.25)] hover:shadow-[0_0_12px_rgba(6,182,212,0.06)] transition-all"
            >
              <Cpu size={12} />
              <span>{settings.model.split("/").pop()}</span>
              <ChevronDown size={10} />
            </button>

            {showModelDropdown && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-[rgba(17,17,20,0.95)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.10)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden z-50">
                {Object.entries(groupedModels).map(([providerId, provider]) => (
                  <div key={providerId}>
                    <button
                      onClick={() => setExpandedProvider(expandedProvider === providerId ? null : providerId)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-[rgba(255,255,255,0.04)] transition-colors border-b border-[rgba(255,255,255,0.04)]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-xs text-[#E4E4E7] font-medium">{provider.name}</span>
                        <span className="text-[9px] text-[#71717A]">{provider.models.length}m</span>
                      </div>
                      <ChevronDown
                        size={12}
                        className={`text-[#71717A] transition-transform ${
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
                            className={cn(
                              "w-full px-4 py-1.5 text-left text-[11px] flex items-center gap-2 transition-colors",
                              settings.model === model.id
                                ? "bg-[rgba(6,182,212,0.08)] text-[#06b6d4]"
                                : "text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#E4E4E7]"
                            )}
                          >
                            <span className="font-mono">{model.id.split("/").pop()}</span>
                            {settings.model === model.id && <Check size={12} className="ml-auto text-[#06b6d4]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workspace Picker */}
          <button
            onClick={onWorkspacePick}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(17,17,20,0.85)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#a1a1aa] font-mono hover:border-[rgba(6,182,212,0.25)] transition-all"
            title="Select workspace folder"
          >
            <Folder size={12} className={workspaceName ? "text-[#06b6d4]" : "text-[#71717A]"} />
            <span className="max-w-[100px] truncate">{workspaceName || "No folder"}</span>
          </button>

          {/* Agent Selector */}
          {agents.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(17,17,20,0.85)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#a1a1aa] font-mono hover:border-[rgba(139,92,246,0.25)] transition-all"
              >
                <Users size={12} className={selectedAgentId ? "text-[#8b5cf6]" : "text-[#71717A]"} />
                <span className="max-w-[80px] truncate">
                  {selectedAgentId ? (agents.find((a: any) => a.id === selectedAgentId)?.name || "Agent") : "Agent"}
                </span>
                <ChevronDown size={10} />
              </button>
              {showAgentDropdown && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-[rgba(17,17,20,0.95)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.10)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden z-50 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedAgentId(""); setShowAgentDropdown(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[11px] flex items-center gap-2 transition-colors border-b border-[rgba(255,255,255,0.04)]",
                      !selectedAgentId ? "bg-[rgba(6,182,212,0.08)] text-[#06b6d4]" : "text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.04)]"
                    )}
                  >
                    <span className="font-mono">Default Agent</span>
                    {!selectedAgentId && <Check size={12} className="ml-auto text-[#06b6d4]" />}
                  </button>
                  {agents.map((agent: any) => (
                    <button
                      key={agent.id}
                      onClick={() => { setSelectedAgentId(agent.id); setShowAgentDropdown(false); }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-[11px] flex items-center gap-2 transition-colors",
                        selectedAgentId === agent.id
                          ? "bg-[rgba(139,92,246,0.08)] text-[#8b5cf6]"
                          : "text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.04)]"
                      )}
                    >
                      <span>{agent.emoji || "🤖"}</span>
                      <span className="font-mono truncate">{agent.name}</span>
                      {selectedAgentId === agent.id && <Check size={12} className="ml-auto text-[#8b5cf6]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Split view toggle */}
          <button
            onClick={() => setShowSplitView(!showSplitView)}
            className={cn(
              "p-1.5 rounded-md transition-all",
              showSplitView
                ? "text-[#8b5cf6] bg-[rgba(139,92,246,0.08)]"
                : "text-[#71717A] hover:text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.04)]"
            )}
            title={showSplitView ? "Hide thinking panel" : "Show thinking panel"}
          >
            <SplitSquareVertical size={15} />
          </button>
          {/* New chat */}
          <button
            onClick={() => chat.clearMessages()}
            className="px-3 py-1 rounded-md text-[10px] text-[#a1a1aa] hover:text-[#E4E4E7] hover:bg-[rgba(255,255,255,0.04)] transition-all flex items-center gap-1"
          >
            <Plus size={12} /> New
          </button>
          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-[#71717A] hover:text-[#a1a1aa] transition-colors rounded-md hover:bg-[rgba(255,255,255,0.04)]"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* ─── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {chat.messages.length <= 1 ? (
              <WelcomeScreen onAction={(text) => { setInput(text); send(text); }} />
            ) : (
              <div className="space-y-6">
                {chat.messages.filter(m => m.role !== "system").map((msg) => (
                  <div key={msg.id} className="animate-fade-in-up">
                    {msg.role === "user" ? (
                      /* ── User message: ChatBubble with gradient ── */
                      <ChatBubble
                        role="user"
                        content={msg.content}
                        timestamp={new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        onCopy={() => navigator.clipboard.writeText(msg.content)}
                      />
                    ) : (
                      /* ── Assistant message: glass card with markdown + actions ── */
                      <div className="group flex gap-3 max-w-[85%] mr-auto">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgba(17,17,20,0.85)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[11px] text-[#a1a1aa] font-semibold">
                          AF
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Tool calls — ToolCallCard components */}
                          {msg.toolCalls && msg.toolCalls.length > 0 && (
                            <div className="mb-3 space-y-1">
                              {msg.toolCalls.map((tc, i) => (
                                <ToolCallCard
                                  key={i}
                                  toolName={tc.tool}
                                  args={typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args)}
                                  result={tc.result}
                                  status={tc.duration !== undefined ? "done" : "running"}
                                  durationMs={tc.duration}
                                />
                              ))}
                            </div>
                          )}
                          {/* Content — glass card with markdown rendering */}
                          <div className="bg-[rgba(17,17,20,0.6)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.06)] rounded-2xl rounded-bl-md px-4 py-3">
                            <div
                              className="prose-nova text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderContent(msg.content)) }}
                            />
                          </div>
                          {/* Timestamp + hover actions */}
                          <div className="flex items-center gap-3 mt-1.5">
                            {msg.duration && (
                              <span className="text-[9px] text-[#71717A]">
                                {(msg.duration / 1000).toFixed(1)}s
                              </span>
                            )}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <MessageActions
                                onCopy={() => navigator.clipboard.writeText(msg.content)}
                                content={msg.content}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* ── Live streaming ── */}
                {(chat.isThinking || chat.isRunning) && (
                  <div className="animate-fade-in-up">
                    {/* Thinking — ThinkingPanel component */}
                    {chat.isThinking && chat.thinking && (
                      <div className={showSplitView ? "max-w-full" : "max-w-[85%]"}>
                        <ThinkingPanel content={chat.thinking} isThinking={true} />
                      </div>
                    )}

                    {/* Streaming content — glass card */}
                    {chat.isRunning && chat.streamingContent && (
                      <div className={cn(
                        "bg-[rgba(17,17,20,0.6)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.06)] rounded-2xl rounded-bl-md px-4 py-3",
                        showSplitView ? "max-w-full" : "max-w-[85%]"
                      )}>
                        <div
                          className="prose-nova text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderContent(chat.streamingContent)) }}
                        />
                        <span className="inline-block w-1.5 h-4 bg-[#06b6d4] animate-pulse ml-0.5 rounded-sm" />
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

        {/* ── Settings sidebar ── */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="w-72 border-l border-[rgba(255,255,255,0.06)] bg-[rgba(17,17,20,0.85)] backdrop-blur-[24px] p-4 overflow-y-auto shrink-0"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-[#71717A] hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-[#71717A] uppercase tracking-wider mb-1 block">Model</label>
                <select
                  value={settings.model}
                  onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-[rgba(17,17,20,0.85)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.06)] rounded-lg text-[#E4E4E7] focus:border-[rgba(6,182,212,0.3)] focus:outline-none transition-colors"
                >
                  {(models.length > 0 ? models : [{ id: "deepseek/deepseek-chat" }]).map(m => (
                    <option key={m.id} value={m.id}>{m.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#71717A] uppercase tracking-wider mb-1 block">Active Skills</label>
                <div className="flex flex-wrap gap-1">
                  {skills.filter((s: any) => s.enabled !== false).slice(0, 8).map((s: any) => (
                    <span
                      key={s.id || s.name}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(6,182,212,0.06)] text-[#06b6d4] border border-[rgba(6,182,212,0.15)]"
                    >
                      {s.name || s.id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Context bar — gradient progress ── */}
      {contextBar}

      {/* ── Input — ChatInput component ── */}
      <ChatInput
        onSend={(msg) => { setInput(msg); send(msg); }}
        isLoading={chat.isRunning}
        model={settings.model}
        onStop={cancel}
        slashCommands={slashCommands}
        onSlashSelect={(cmd) => { setInput(cmd); }}
      />
    </div>
  );
}
