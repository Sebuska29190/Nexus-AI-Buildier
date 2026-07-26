// @agentforge/sdk — Core Types + Redaction Helper
//
// Public surface re-export. Provider plugins in this monorepo
// (provider-qwen) and downstream consumers (UI / harness / channel)
// import types AND the runtime helper from `@agentforge/sdk`.

export type {
  PluginManifest, ModelDef, ProviderPlugin, StreamParams, StreamChunk,
  ThinkingProfile, AgentMessage, ToolDef, ToolCall, ToolPlugin, ToolContext,
  ChannelPlugin, ChannelBot, ChannelMessage,
  HarnessV2, HarnessContext, HarnessResult, HarnessOutcome,
  SessionEntry, AuthProfile, AgentConfig,
} from "./types.ts";

//
// ─── Redaction helper ─────────────────────────────────────────────
//
// Replaces credential-shaped tokens in `s` with `[REDACTED:<kind>]`
// markers. The original string is never mutated; a new redacted copy
// is returned. Inlined in the barrel so `@agentforge/sdk` consumers don't
// pull in a separate file path that bundler-mode tsc + a downstream
// import boundary occasionally mis-resolves under strict conventions.
//
// Threat model:
//   • A misbehaving reverse proxy / TLS-interceptor echoes the
//     incoming `Authorization: Bearer …` header verbatim in 502/504
//     response bodies.
//   • An upstream provider accidentally echoes a related token in
//     the JSON-encoded error response.
//   • An SDK consumer logs a `JSON.stringify(authStore)` containing
//     `AuthProfile.apiKey`.
//
// Patterns caught (deliberately broad for defence-in-depth):
//   • `Bearer <token>`               → `[REDACTED:bearer]`
//   • `sk-<token>`  (OpenAI, Anthropic, DeepInfra) → `[REDACTED:sk]`
//   • `AIza<token>`  (Google API key)  → `[REDACTED:google]`
//   • `ghp_<token>` / `ghs_<token>`  (GitHub) → `[REDACTED:github]`
//   • `xox[baprs]-<token>`  (Slack)   → `[REDACTED:slack]`
//   • JSON-field assignment  (`apiKey|key|token|secret|password = …`)
//                                          → `[REDACTED:json-field]`
//
// Regex-based, no tokenizer dep, O(n) over input string with one
// allocation (the result). Single source of truth — provider-qwen
// and any future provider imports this from `@agentforge/sdk`.
export function redactSecrets(s: string): string {
  if (!s) return s;
  return s
    // Bearer <token> — strip Bearer scheme and the credential that
    // follows. Token chars are conservative base64-url-safe.
    .replace(/\bBearer\s+[A-Za-z0-9._\-+/=]+/g, "[REDACTED:bearer]")
    // OpenAI / Anthropic / Deepinfra style sk-… (≥ 23 chars total)
    .replace(/\bsk-[A-Za-z0-9_\-]{20,}/g, "[REDACTED:sk]")
    // Google API key AIza… (35 chars typical)
    .replace(/\bAIza[A-Za-z0-9_\-]{30,}/g, "[REDACTED:google]")
    // GitHub personal access tokens (ghp_) and server tokens (ghs_)
    .replace(/\bghp_[A-Za-z0-9]{30,}/g, "[REDACTED:github]")
    .replace(/\bghs_[A-Za-z0-9]{30,}/g, "[REDACTED:github]")
    // Slack: xoxb-, xoxp-, xoxa-, xoxr-, xoxs-
    .replace(/\bxox[baprs]-[A-Za-z0-9-]{10,}/g, "[REDACTED:slack]")
    // Generic JSON field shape: "apiKey":"...", 'token':'...', secret=…
    // The value class is anchored on whitespace / quote / comma /
    // brace / backslash. The trailing backslash handles malformed
    // JSON with `\`-escaped nested content so redaction does not
    // truncate mid-token.
    .replace(
      /(\b(?:apiKey|api_key|token|secret|password|accessToken|refreshToken)\b)\s*[:=]\s*["']?([^\s"',}\\]+)["']?/gi,
      "$1=[REDACTED:json-field]"
    );
}
