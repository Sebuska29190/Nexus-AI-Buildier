/**
 * AgentWorkPanel — Live agent execution viewer (like OpenClaw)
 * Shows tool calls, results, progress, and final output in real-time via SSE
 * with resilient reconnect and connection status
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Wrench, CheckCircle2, XCircle, Loader2, Brain, Terminal, ChevronDown, ChevronRight, Clock, BarChart3, Send, StopCircle, RefreshCw } from "lucide-react";

type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface ToolEvent {
  type: string;
  data: {
    name?: string;
    arguments?: Record<string, unknown>;
    toolCallId?: string;
    toolName?: string;
    success?: boolean;
    durationMs?: number;
    error?: string;
    resultPreview?: string;
    iteration?: number;
  };
  ts: number;
}

interface AgentWorkState {
  tools: Array<{
    name: string;
    args: Record<string, unknown>;
    status: "running" | "done" | "error";
    durationMs?: number;
    error?: string;
    resultPreview?: string;
  }>;
  status: "idle" | "running" | "done" | "error";
  totalTools: number;
  thinking: string;
  finalOutput: string;
  error: string;
  startTime: number | null;
}

interface Props {
  runId: string;
  agentName?: string;
  className?: string;
  onComplete?: (output: string) => void;
}

export function AgentWorkPanel({ runId, agentName, className = "", onComplete }: Props) {
  const [state, setState] = useState<AgentWorkState>({
    tools: [],
    status: "idle",
    totalTools: 0,
    thinking: "",
    finalOutput: "",
    error: "",
    startTime: null,
  });
  const [expanded, setExpanded] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [steerMsg, setSteerMsg] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const evSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const reconnectAttemptsRef = useRef(0);

  const sendSteer = useCallback(async () => {
    if (!steerMsg.trim() || !runId) return;
    try {
      await fetch(`/api/agents/runs/${runId}/steer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: steerMsg.trim() }),
      });
      setSteerMsg("");
    } catch {}
  }, [steerMsg, runId]);

  const stopRun = useCallback(async () => {
    if (!runId) return;
    try {
      await fetch(`/api/agents/runs/${runId}/stop`, { method: "POST" });
      setState(prev => ({ ...prev, status: "done" }));
    } catch {}
  }, [runId]);

  const closeSSE = useCallback(() => {
    if (evSourceRef.current) {
      evSourceRef.current.close();
      evSourceRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connectSSE = useCallback(() => {
    if (!mountedRef.current) return;
    closeSSE();

    const es = new EventSource(`/api/agents/runs/${runId}/events`);
    evSourceRef.current = es;
    reconnectAttemptsRef.current = 0;
    setConnectionStatus("connected");
    setReconnectAttempts(0);

    es.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const event: ToolEvent = JSON.parse(e.data);

        if (event.type === "done") {
          setState(prev => ({ ...prev, status: "done" }));
          es.close();
          setConnectionStatus("disconnected");
          return;
        }
        if (event.type === "error") {
          setState(prev => ({ ...prev, status: "error", error: event.data.error || "Unknown error" }));
          es.close();
          setConnectionStatus("disconnected");
          return;
        }
        if (event.type === "thinking") {
          setState(prev => ({ ...prev, thinking: event.data.resultPreview || "" }));
          return;
        }
        if (event.type === "tool_call") {
          setState(prev => ({
            ...prev,
            status: "running",
            tools: [...prev.tools, {
              name: event.data.name || "unknown",
              args: event.data.arguments || {},
              status: "running",
            }],
          }));
          return;
        }
        if (event.type === "tool_result") {
          setState(prev => ({
            ...prev,
            tools: prev.tools.map((t, i) => {
              // Match by index — last running tool
              if (i === prev.tools.length - 1 && t.status === "running") {
                return {
                  ...t,
                  status: event.data.success ? "done" : "error",
                  durationMs: event.data.durationMs,
                  error: event.data.error,
                  resultPreview: event.data.resultPreview,
                };
              }
              return t;
            }),
            totalTools: prev.totalTools + 1,
          }));
          return;
        }
        if (event.type === "assistant") {
          setState(prev => ({ ...prev, finalOutput: event.data.text as string }));
          return;
        }
      } catch {}
    };

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();

      const attempts = reconnectAttemptsRef.current;
      if (attempts >= 5) {
        // Max attempts reached — show "Connection lost"
        setConnectionStatus("disconnected");
        setState(prev => ({ ...prev, status: "error", error: "Connection lost. Click Retry to reconnect." }));
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
      reconnectAttemptsRef.current = attempts + 1;
      setConnectionStatus("reconnecting");
      setReconnectAttempts(attempts + 1);

      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connectSSE();
      }, delay);
    };
  }, [runId, closeSSE]);

  const retryConnection = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
    connectSSE();
  }, [connectSSE]);

  // Connect to SSE
  useEffect(() => {
    if (!runId) return;
    mountedRef.current = true;
    setState(prev => ({ ...prev, status: "running", startTime: Date.now() }));
    connectSSE();

    return () => {
      mountedRef.current = false;
      closeSSE();
    };
  }, [runId, connectSSE, closeSSE]);

  // Elapsed timer
  useEffect(() => {
    if (state.status !== "running" || !state.startTime) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (state.startTime || 0)) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [state.status, state.startTime]);

  // Notify on complete
  useEffect(() => {
    if (state.status === "done" && state.finalOutput && onComplete) {
      onComplete(state.finalOutput);
    }
  }, [state.status, state.finalOutput]);

  const doneTools = state.tools.filter(t => t.status !== "running").length;
  const runningTools = state.tools.filter(t => t.status === "running").length;
  const errorTools = state.tools.filter(t => t.status === "error").length;

  if (state.status === "idle") return null;

  const statusColor = connectionStatus === "connected" ? "bg-[#22c55e]" :
    connectionStatus === "reconnecting" ? "bg-[#eab308]" : "bg-[#ef4444]";
  const statusLabel = connectionStatus === "connected" ? "Live" :
    connectionStatus === "reconnecting" ? `Reconnecting (${reconnectAttempts}/5)` : "Disconnected";

  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${statusColor} ${connectionStatus === "reconnecting" ? "animate-pulse" : ""}`} />
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-[#6366f1]" />
            <span className="text-xs font-medium text-white">
              {agentName ? `${agentName} — ` : ""}
              {state.status === "done" ? "Completed" :
               state.status === "error" ? "Failed" :
               "Working…"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-[#4a5068] font-mono">
          {/* Connection status badge */}
          {connectionStatus !== "connected" && (
            <span className={`flex items-center gap-1 ${
              connectionStatus === "reconnecting" ? "text-[#eab308]" : "text-[#ef4444]"
            }`}>
              {statusLabel}
            </span>
          )}
          {state.status === "running" && elapsed > 0 && (
            <span className="flex items-center gap-1"><Clock size={10} /> {elapsed}s</span>
          )}
          {doneTools > 0 && <span>{doneTools} tools</span>}
          {errorTools > 0 && <span className="text-[#ef4444]">{errorTools} failed</span>}
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="max-h-80 overflow-y-auto">
          {/* Connection lost banner */}
          {connectionStatus === "disconnected" && state.status === "running" && (
            <div className="m-3 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-between">
              <p className="text-xs text-[#ef4444]">Connection lost</p>
              <button
                onClick={retryConnection}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[rgba(239,68,68,0.2)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.3)] text-[10px] transition-all"
              >
                <RefreshCw size={10} /> Retry
              </button>
            </div>
          )}

          {/* Reconnecting banner */}
          {connectionStatus === "reconnecting" && (
            <div className="m-3 p-3 rounded-lg bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.2)] flex items-center gap-2">
              <Loader2 size={10} className="text-[#eab308] animate-spin" />
              <p className="text-xs text-[#eab308]">Reconnecting… ({reconnectAttempts}/5)</p>
            </div>
          )}

          {/* Error banner */}
          {state.error && connectionStatus === "disconnected" && reconnectAttempts >= 5 && (
            <div className="m-3 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
              <p className="text-xs text-[#ef4444]">{state.error}</p>
              <button
                onClick={retryConnection}
                className="mt-2 flex items-center gap-1 px-3 py-1 rounded-lg bg-[rgba(239,68,68,0.2)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.3)] text-[10px] transition-all"
              >
                <RefreshCw size={10} /> Retry
              </button>
            </div>
          )}

          {/* Error banner (non-connection) */}
          {state.error && connectionStatus !== "disconnected" && (
            <div className="m-3 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
              <p className="text-xs text-[#ef4444]">{state.error}</p>
            </div>
          )}

          {/* Thinking */}
          {state.thinking && (
            <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-2 text-[9px] text-[#4a5068] mb-1">
                <Brain size={10} /> Thinking…
              </div>
              <p className="text-[10px] text-[#8892a8] line-clamp-3">{state.thinking}</p>
            </div>
          )}

          {/* Tool list */}
          {state.tools.length > 0 && (
            <div className="divide-y divide-[rgba(255,255,255,0.03)]">
              {state.tools.map((tool, i) => (
                <ToolEntry key={i} tool={tool} index={i} />
              ))}
            </div>
          )}

          {/* Live indicator */}
          {runningTools > 0 && (
            <div className="px-4 py-2 flex items-center gap-2">
              <Loader2 size={12} className="text-[#6366f1] animate-spin" />
              <span className="text-[9px] text-[#6366f1]">
                Working… {doneTools}/{state.tools.length} completed
              </span>
            </div>
          )}

          {/* Final output */}
          {state.finalOutput && (
            <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(99,102,241,0.04)]">
              <div className="flex items-center gap-2 text-[9px] text-[#22c55e] mb-1">
                <CheckCircle2 size={10} /> Output
              </div>
              <p className="text-[10px] text-[#e2e8f0] whitespace-pre-wrap">{state.finalOutput.slice(0, 500)}</p>
            </div>
          )}

          {/* Steer & Stop — mid-execution intervention */}
          {state.status === "running" && (
            <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.04)] flex items-center gap-2 bg-[rgba(0,0,0,0.15)]">
              <input
                value={steerMsg}
                onChange={e => setSteerMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendSteer()}
                placeholder="Tell agent what to focus on…"
                className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-[#6366f1] placeholder:text-[#4a5068]"
              />
              <button
                onClick={sendSteer}
                disabled={!steerMsg.trim()}
                className="p-1.5 rounded-lg bg-[rgba(99,102,241,0.1)] text-[#6366f1] hover:bg-[rgba(99,102,241,0.2)] disabled:opacity-30 transition-all"
                aria-label="Send steering message"
              >
                <Send size={12} />
              </button>
              <button
                onClick={stopRun}
                className="p-1.5 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.2)] transition-all"
                title="Stop agent"
                aria-label="Stop agent execution"
              >
                <StopCircle size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tool Entry (single tool call) ──────────────────────────
function ToolEntry({ tool, index }: { tool: AgentWorkState["tools"][0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-4 py-2 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left"
        aria-label={`${tool.name}: ${tool.status}`}
      >
        {tool.status === "running" ? (
          <Loader2 size={10} className="text-[#6366f1] animate-spin shrink-0" />
        ) : tool.status === "error" ? (
          <XCircle size={10} className="text-[#ef4444] shrink-0" />
        ) : (
          <CheckCircle2 size={10} className="text-[#22c55e] shrink-0" />
        )}
        <span className="text-[10px] font-mono text-[#6366f1]">{tool.name}</span>
        {tool.durationMs && (
          <span className="text-[8px] text-[#4a5068]">{(tool.durationMs / 1000).toFixed(1)}s</span>
        )}
        {tool.status !== "running" && (
          <span className="ml-auto">
            {open ? <ChevronDown size={10} className="text-[#4a5068]" /> : <ChevronRight size={10} className="text-[#4a5068]" />}
          </span>
        )}
      </button>
      {open && (
        <div className="mt-1 ml-5 pl-2 border-l border-[rgba(255,255,255,0.06)]">
          {Object.keys(tool.args).length > 0 && (
            <p className="text-[8px] text-[#4a5068] mb-1 font-mono">
              {JSON.stringify(tool.args, null, 2).slice(0, 200)}
            </p>
          )}
          {tool.resultPreview && (
            <p className="text-[9px] text-[#8892a8]">{tool.resultPreview}</p>
          )}
          {tool.error && (
            <p className="text-[9px] text-[#ef4444]">{tool.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
