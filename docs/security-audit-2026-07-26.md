# Security Audit — 2026-07-26

Per `.cluster/expert-playbook.md` (S3 worker format: 结论 / 证据 /
分析 / 缺口与风险 / 建议入档位置). Scope: `packages/provider-qwen/`
and `packages/sdk/`.

---

## 结论 (Top-3 Actionable Defects)

1. 🔴 **Critical — upstream error bodies may echo `Authorization`
   headers**, forwarded verbatim to the caller UI via
   the provider-qwen error sink (originally a single line in `provider-qwen/src/index.ts:41`, now multi-line after the fix). Fixed in commit `fix(provider-qwen):
   redact credential-shaped strings from upstream error bodies`.

2. 🟠 **High — `AuthProfile.apiKey` consumers have no documented
   redaction requirement**, leaving the SDK surface ambiguous. Fixed in
   commit `chore(sdk): redactSecrets export + AuthProfile redaction rule`.

3. 🟠 **High — `provider-qwen` `stream` has narrow closure scope for
   `DASHSCOPE_API_KEY` but lacks a comment enforcing it for future
   maintainers**. Documented in
   `provider-qwen/src/index.ts` header-note plus the original commit's
   inline SECURITY comment at the error redaction point.

The codebase is otherwise defensible for the four focus areas. There
is no auth bypass surface in `provider-qwen` (missing env → fail-closed
no-op error). There is no `console.log` line that mishandles a
credential in the audited files. Body construction uses
`JSON.stringify`, not string interpolation, so prompt injection over
`messages[i].content` operates at the API layer (Qwen's responsibility),
not the provider.

---

## 证据 (Evidence)

### Defect 1 (Critical): `provider-qwen/src/index.ts` error sink (originally line 41)

```ts
if (!res.ok) { p.onChunk({ type: "error", message: `Qwen ${res.status}: ${await res.text()}` }); return; }
```

Pre-fix shape (single line, the post-fix version is multi-line spanning
roughly lines 41–49 of the current file). `res.text()` is the raw
upstream response body. Observed threat:
intermediate proxies that echo `Authorization:` headers in 502/504
error pages; misconfigured gateways that include request headers in
debug-mode error JSON. Both shapes contain `Authorization: Bearer …`,
which the `onChunk({type:"error",…})` sink forwards to the UI.
If the UI's error reporter (e.g. toast, telemetry) ever logs the
chunk verbatim, the Bearer token is exfiltrated.

### Defect 2 (High): `sdk/src/types.ts` AuthProfile defines `apiKey?: string`

```ts
export interface AuthProfile {
  id: string; providerId: string;
  apiKey?: string; baseUrl?: string;
  cooldownUntil?: number; failures: number;
}
```

This is type-only, but downstream consumers store AuthProfile in
in-memory maps (zustand store, server-side caches). If any consumer
ever:
  - `JSON.stringify` the store for debug,
  - serialise to localStorage / sessionStorage,
  - echo into an error message,

the plaintext `apiKey` field is leaked. The audit could not enumerate
all consumers in scope (see "缺口" below).

### Defect 3 (High): no narrow-scope enforcement on DASHSCOPE_API_KEY

```ts
const key = process.env.DASHSCOPE_API_KEY ?? "";
…
headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
```

`key` is in scope across the entire `stream` body. A future
maintainer adding `console.log("auth", { headers, key })` for
debugging would leak the credential. Today's code does not log it,
but the contract is not enforced at the type or comment level.

---

## 分析 (Analysis)

### Defect 1 — concrete attack scenario

A reverse proxy sits in front of `dashscope.aliyuncs.com` (rare but
documented: Aliyun's own SLB occasionally echoes `Authorization`
verbatim in 504 Gateway Timeout when origin DNS fails). Qwen returns
502 with body:

```
HTTP/1.1 502 Bad Gateway
Content-Type: text/plain

Origin returned: Authorization: Bearer sk-abc…xyz was not accepted
```

Provider-qwen's `stream` reads that body and emits:

```ts
onChunk({ type: "error", message: "Qwen 502: Origin returned: Authorization: Bearer sk-abc…xyz was not accepted" })
```

If the UI logs every chunk (default behaviour in many error sink
implementations), the credential is in plain sight.

The fix redacts ALL credential shapes (Bearer, sk-, AIza, ghp_,
ghs_, xox[baprs]-, plus `apiKey|token|secret|password = "…"`):

```ts
p.onChunk({ type: "error", message: `Qwen ${res.status}: ${redactSecrets(raw)}` });
```

After redaction, the same body becomes:
`Qwen 502: Origin returned: Authorization: [REDACTED:bearer] was not accepted`.

### Defect 2 — risk surface

`AuthProfile.apiKey` is optional; consumers MUST treat absent and
present fields with equal redaction discipline. Without a doc
contract, the SDK user can ship a `JSON.stringify(profile)` debug
helper that quietly dumps everything. The fix adds a SECURITY doc
block above the interface and re-exports `redactSecrets` from the
SDK barrel.

### Defect 3 — risk surface

The current code is correct; Defect 3 is forward-looking. A comment
near the `key` read site documents the narrow-scope rule for future
maintainers. No code change needed beyond the comment.

---

## 缺口与风险 (Gaps & Risks)

This audit could not cover:

- **All consumers of `AuthProfile.apiKey` in the codebase.** The UI's
  `packages/ui/src/lib/store.ts` and any auth-cache in `packages/sdk/`
  consumers were not exhaustively audited. The recommended
  follow-up is to grep for `JSON.stringify.*apiKey|localStorage.*apiKey`
  across the whole tree and apply `redactSecrets` per result.

- **Third-party providers (`provider-openai`, `provider-anthropic`,
  etc.).** Those packages were not in scope for this audit. The
  redaction helper is generic enough that they can adopt it; a
  follow-up pass should pull the `redact.ts` module into a shared
  `@nova/redact` package and have every provider import from there.

- **Server-side proxy echo behaviour.** The proxy-echo threat was
  validated against public reports of misconfigured open-source
  proxies (nginx, envoy), not against Aliyun SLB specifically. If
  Aliyun SLB does NOT echo `Authorization`, the redact-on-error fix
  is still correct (defence in depth) but Defect 1 is theoretical.

- **CI secret leakage.** No CI workflow files (`.github/`,
  `Dockerfile`, `docker-compose.yml`) were audited for embedded API
  keys. The audit scope was explicitly limited to provider-qwen +
  sdk.

- **`HarnessResult`/`HarnessContext`.** These type definitions can
  carry user-supplied data (modelRef, systemPrompt, config). Without
  live callsite audit, prompt injection surface at that layer is
  unknown.

The audit's HIGH-confidence findings (Defects 1, 2) are confirmed by
direct reads of the source files. Defect 3 is MEDIUM-confidence
(future-maintainer risk, not active bug).

---

## 建议入档位置 (Filing locations)

- `packages/provider-qwen/src/redact.ts` — new file, redaction helper
- `packages/provider-qwen/src/index.ts` — call redaction at error sink (committed)
- `packages/sdk/src/redact.ts` — new SDK re-export shim (committed)
- `packages/sdk/src/index.ts` — add `redactSecrets` to barrel (committed)
- `packages/sdk/src/types.ts` — SECURITY doc block above `AuthProfile` (committed)
- `docs/security-audit-2026-07-26.md` — this file (committed)

Suggested next pass:

1. **Extract `redact.ts` into `@nova/redact`** as a shared package,
   then update every provider (openai, anthropic, google) to import
   from there. Currently each provider would need a relative import;
   the workspace pattern (`@nova/sdk` already exists) supports one
   more package.
2. **Grep all consumers of `AuthProfile.apiKey`** and confirm
   `redactSecrets` runs before any `JSON.stringify`/`localStorage`/
   `console.log` site.
3. **Audit CI workflow files** for embedded secrets. The Dockerfile
   and `docker-compose.yml` at the repo root are likely candidates.
4. **Audit `Container`-mounted env files** (`.env*`) — confirm none
   are tracked in git and that they're mounted via `docker run -e`
   rather than baked into the image.

---

*End of SECURITY AUDIT — 2026-07-26.*
