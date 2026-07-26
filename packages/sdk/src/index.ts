export type {
  PluginManifest, ModelDef, ProviderPlugin, StreamParams, StreamChunk,
  ThinkingProfile, AgentMessage, ToolDef, ToolCall, ToolPlugin, ToolContext,
  ChannelPlugin, ChannelBot, ChannelMessage,
  HarnessV2, HarnessContext, HarnessResult, HarnessOutcome,
  SessionEntry, AuthProfile, AgentConfig,
} from "./types.ts";

// Redaction helper used by provider plugins to strip credential-
// shaped tokens from outbound error messages. UI / harness / channel
// consumers should apply the same redaction before serialising any
// `AuthProfile.apiKey` field to logs, persistent storage, or the
// window object.
export { redactSecrets } from "./redact.ts";
