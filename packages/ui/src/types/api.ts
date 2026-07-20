/**
 * Shared API types for AgentForge UI
 */

// ─── API Response types ─────────────────────────────

export interface APIResponse<T = unknown> {
  status?: string;
  error?: string;
  message?: string;
  data?: T;
}

export interface ProviderEntry {
  id: string;
  providerId?: string;
  name: string;
  hasKey: boolean;
  hasApiKey?: boolean;
  enabled: boolean;
  models?: string[] | number;
  modelCount?: number;
  status?: 'valid' | 'error' | 'untested';
  lastTested?: string;
}

export interface AgentEntry {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  modelRef?: string;
  model?: string;
  systemPrompt?: string;
  status?: string;
  skills?: string[];
  strikes?: number;
  runs?: number;
}

export interface SessionEntry {
  id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  model?: string;
  agentId?: string;
  messageCount?: number;
}

export interface SkillEntry {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  parameters?: ParamDef[];
}

export interface ParamDef {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

export interface ModelEntry {
  id: string;
  owned_by?: string;
  provider?: string;
}

export interface HealthResponse {
  status?: string;
  version?: string;
  uptime?: number;
}

export interface ChannelEntry {
  id: string;
  connected: boolean;
  config?: Record<string, string>;
}

export interface SettingsData {
  appName?: string;
  language?: string;
  timezone?: string;
  animations?: boolean;
  port?: number;
  host?: string;
  authEnabled?: boolean;
  defaultModel?: string;
  autoApprove?: boolean;
  thinkingMode?: boolean;
}

// ─── Chat types ─────────────────────────────────────

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result?: string;
  success?: boolean;
  duration?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  thinking?: string;
  duration?: number;
}

export interface PendingApproval {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface ChatActivity {
  type: string;
  tool?: string;
  args?: Record<string, unknown>;
  content?: string;
  success?: boolean;
  duration?: number;
  timestamp: number;
  result?: string;
}

export interface WebSocketMessage {
  type: string;
  text?: string;
  toolName?: string;
  tool?: string;
  name?: string;
  args?: Record<string, unknown>;
  arguments?: Record<string, unknown>;
  toolCallId?: string;
  sessionId?: string;
  success?: boolean;
  duration?: number;
  durationMs?: number;
  result?: string;
  error?: string;
  message?: string;
}

// ─── Store types ────────────────────────────────────

export interface StoreHealth {
  status?: string;
  version?: string;
  uptime?: number;
}
