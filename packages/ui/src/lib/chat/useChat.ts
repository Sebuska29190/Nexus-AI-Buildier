import { useState, useRef, useCallback, useEffect } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  toolCalls?: Array<{ tool: string; args: any; result?: string; success?: boolean; duration?: number }>;
  thinking?: string;
  duration?: number;
}

export interface PendingApproval {
  toolCallId: string;
  toolName: string;
  args: any;
}

export interface ChatActivity {
  type: string;
  tool?: string;
  args?: any;
  content?: string;
  success?: boolean;
  duration?: number;
  timestamp: number;
  result?: string;
}

const WS_URL = import.meta.env.VITE_NOVA_WS_URL || `ws://${window.location.host}/ws`;

export function useChat() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "## Welcome to Nexus AI\n\nI'm your coding assistant. I can:\n- Write and refactor code\n- Debug issues\n- Review code quality\n- Search documentation\n- Automate tasks\n\nTry asking me to build something!", timestamp: Date.now() },
  ]);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [thinking, setThinking] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [activity, setActivity] = useState<ChatActivity[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const fullTextRef = useRef("");
  const activityRef = useRef<ChatActivity[]>([]);
  const startTimeRef = useRef(0);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);
  const mountedRef = useRef(true);

  // Sync activity ref
  useEffect(() => { activityRef.current = activity; }, [activity]);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Clean up reconnect timer and heartbeat
  useEffect(() => {
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  // Connect WebSocket with auto-reconnect
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        setConnected(true);
        reconnectAttempts.current = 0;
        // Start heartbeat
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN && mountedRef.current) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };
      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        wsRef.current = null;
        if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
        // Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s... max 30s)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        reconnectRef.current = setTimeout(() => connect(), delay);
      };
      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "pong") return; // Heartbeat response — ignore
          handleMessage(msg);
        } catch {}
      };
      ws.onerror = () => {
        // onclose will fire after this, reconnect handles it
      };
    } catch {}
  }, []);

  // Connect on mount
  useEffect(() => { connect(); }, [connect]);

  const handleMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case "session_created":
        setSessionId(msg.sessionId);
        break;

      case "assistant":
        fullTextRef.current += msg.text || "";
        setStreamingContent(fullTextRef.current);
        break;

      case "thinking":
        setThinking(msg.text || "");
        setIsThinking(true);
        break;

      case "tool_call":
        setIsThinking(false);
        setThinking("");
        setActivity(p => [...p, { type: "tool_call", tool: msg.toolName || msg.tool || msg.name, args: msg.args || msg.arguments, timestamp: Date.now() }]);
        break;

      case "tool_approval_request":
        setPendingApprovals(p => [...p, { toolCallId: msg.toolCallId, toolName: msg.toolName, args: msg.args }]);
        break;

      case "agent_waiting":
        // agent is waiting for approval — show badge
        break;

      case "tool_result":
        setActivity(p => {
          const u = [...p];
          for (let i = u.length - 1; i >= 0; i--) {
            if (u[i].type === "tool_call" && u[i].tool === msg.toolName && !u[i].duration) {
              u[i] = { ...u[i], success: msg.success, duration: msg.durationMs || msg.duration, result: msg.result };
              break;
            }
          }
          return u;
        });
        break;

      case "done":
      case "result": {
        const finalActivity = activityRef.current;
        setIsThinking(false);
        setThinking("");
        setIsRunning(false);
        setPendingApprovals([]);
        const text = msg.text || fullTextRef.current;
        if (text) {
          setMessages(p => [...p, {
            id: crypto.randomUUID(), role: "assistant", content: text,
            timestamp: Date.now(),
            duration: startTimeRef.current ? Date.now() - startTimeRef.current : undefined,
            toolCalls: finalActivity.filter(a => a.type === "tool_call" && a.tool).map(a => ({ tool: a.tool || "", args: a.args, success: a.success, duration: a.duration })),
          }]);
        }
        setStreamingContent(null);
        fullTextRef.current = "";
        break;
      }

      case "error":
        setError(msg.error || msg.message || "Error");
        setIsRunning(false);
        setPendingApprovals([]);
        setStreamingContent(null);
        setIsThinking(false);
        break;

      case "tool.approved":
        setPendingApprovals(p => p.filter(a => a.toolCallId !== msg.toolCallId));
        break;

      case "tool.rejected":
        setPendingApprovals(p => p.filter(a => a.toolCallId !== msg.toolCallId));
        break;
    }
  }, []);

  const send = useCallback((text: string, opts?: { model?: string; agentId?: string }) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) { setError("Not connected"); return; }

    setMessages(p => [...p, { id: crypto.randomUUID(), role: "user", content: text, timestamp: Date.now() }]);
    fullTextRef.current = "";
    setStreamingContent("");
    setThinking("");
    setIsThinking(false);
    setPendingApprovals([]);
    setActivity([]);
    setIsRunning(true);
    setError(null);
    startTimeRef.current = Date.now();
    const runId = `run_${Date.now()}`;

    ws.send(JSON.stringify({
      type: "chat.send", message: text, model: opts?.model || "deepseek/deepseek-chat",
      sessionId, agentId: opts?.agentId, runId,
    }));
  }, [sessionId]);

  const approve = useCallback((toolCallId: string, alwaysAllow?: boolean) => {
    wsRef.current?.send(JSON.stringify({ type: "tool.approve", toolCallId, alwaysAllow: !!alwaysAllow, sessionId }));
  }, [sessionId]);

  const reject = useCallback((toolCallId: string) => {
    wsRef.current?.send(JSON.stringify({ type: "tool.reject", toolCallId, sessionId }));
  }, [sessionId]);

  const abort = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "chat.abort", runId: "last" }));
    setIsRunning(false);
    setStreamingContent(null);
    setPendingApprovals([]);
    setIsThinking(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([{ id: "welcome", role: "assistant", content: "## New Session\n\nReady to help. What are we building?", timestamp: Date.now() }]);
    setSessionId(null);
    setStreamingContent(null);
    setThinking("");
    setIsThinking(false);
    setPendingApprovals([]);
    setActivity([]);
    setIsRunning(false);
    fullTextRef.current = "";
  }, []);

  return {
    connected, messages, streamingContent, thinking, isThinking,
    pendingApprovals, activity, isRunning, sessionId, error,
    send, approve, reject, abort, clearMessages, connect,
    setMessages, setSessionId,
  };
}
