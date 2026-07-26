// @nova/sdk — Redaction helper
//
// Replaces credential-shaped tokens in inbound strings with
// `[REDACTED:<kind>]` markers. The original string is never mutated;
// a new redacted copy is returned.
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
// and any future provider imports this from `@nova/sdk`.

/**
 * Replace credential-shaped substrings in `s` with `[REDACTED:<kind>]`
 * markers. Identifier patterns are anchored on prefix shapes so we
 * never fail to redact on legitimate-but-unfamiliar tokens. Some
 * over-redaction (e.g. a non-secret field literally named "token")
 * is acceptable: defence-in-depth prefers false positives over
 * false negatives.
 */
export function redactSecrets(s: string): string {
  if (!s) return s;
  return s
    // Bearer <token> — strip Bearer scheme and the credential that
    // follows. Token chars are conservative base64-ish.
    .replace(/\bBearer\s+[A-Za-z0-9._\-+/=]+/g, "[REDACTED:bearer]")
    // OpenAI / Anthropic / Deepinfra style sk-... (>= 20 chars after prefix)
    .replace(/\bsk-[A-Za-z0-9_\-]{20,}/g, "[REDACTED:sk]")
    // Google API key AIza... (35 chars typical)
    .replace(/\bAIza[A-Za-z0-9_\-]{30,}/g, "[REDACTED:google]")
    // GitHub personal access tokens (ghp_) and server tokens (ghs_)
    .replace(/\bghp_[A-Za-z0-9]{30,}/g, "[REDACTED:github]")
    .replace(/\bghs_[A-Za-z0-9]{30,}/g, "[REDACTED:github]")
    // Slack: xoxb-, xoxp-, xoxa-, xoxr-, xoxs-
    .replace(/\bxox[baprs]-[A-Za-z0-9-]{10,}/g, "[REDACTED:slack]")
    // Generic JSON field shape: "apiKey":"...", 'token':'...', secret=...
    // Match quoted and unquoted assignments in error JSON bodies. The
    // `$1` keeps the field name so consumers can still see which
    // field triggered the redaction.
    .replace(
      /(\b(?:apiKey|api_key|token|secret|password|accessToken|refreshToken)\b)\s*[:=]\s*["']?([^\s"',}]+)["']?/gi,
      "$1=[REDACTED:json-field]"
    );
}
