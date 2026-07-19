import { Hono } from "hono";
import { randomBytes } from "node:crypto";

// ─── API Key management ─────────────────────────────────────────────────────

const API_KEY = process.env.NEXUS_API_KEY || `nx-${randomBytes(24).toString("hex")}`;
// Export the key so the app can log its value once at startup
export { API_KEY };

// ─── Whitelist paths (no auth required) ─────────────────────────────────────

const WHITELIST_PREFIXES = [
  "/health",
  "/v1/chat/completions",
  "/static",
  "/favicon",
  "/robots.txt",
];

function isWhitelisted(path: string): boolean {
  return WHITELIST_PREFIXES.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p + "?"));
}

// ─── In-memory rate limiter (per API key) ───────────────────────────────────

const rateLimitBucket = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests = 100, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = rateLimitBucket.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateLimitBucket.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= maxRequests) return false;
  bucket.count++;
  return true;
}

// Periodic cleanup of stale buckets
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitBucket) {
    if (now > v.resetAt) rateLimitBucket.delete(k);
  }
}, 60_000);

// ─── Auth middleware ────────────────────────────────────────────────────────

/**
 * Authentication middleware.
 *
 * Checks `Authorization: Bearer <api-key>` or `x-api-key` header.
 * Whitelisted paths (health, chat completions, static assets) skip auth.
 * Rate-limited to 100 req/min per key.
 */
// Local-first default: auth is OFF unless explicitly enabled via NOVA_REQUIRE_AUTH=true.
// The server binds to 127.0.0.1 by default (see .env NOVA_HOST), so exposing it
// publicly requires opting into auth. This matches Claude Code / Codex / Hermes UX.
const REQUIRE_AUTH = process.env.NOVA_REQUIRE_AUTH === "true";

export function authMiddleware(c: any, next: any) {
  // Local-first: skip auth entirely unless explicitly enabled
  if (!REQUIRE_AUTH) return next();

  const path = c.req.path;

  // Whitelisted paths
  if (isWhitelisted(path)) return next();

  // Only protect /api/* and /v1/* paths
  if (!path.startsWith("/api/") && !path.startsWith("/v1/")) return next();

  // Extract API key from header
  const authHeader = c.req.header("Authorization") || "";
  const apiKey =
    authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : c.req.header("x-api-key") || "";

  if (!apiKey) {
    return c.json({ error: "Unauthorized — missing API key" }, 401);
  }

  if (apiKey !== API_KEY) {
    return c.json({ error: "Forbidden — invalid API key" }, 403);
  }

  // Rate-limit per key
  if (!checkRateLimit(apiKey)) {
    return c.json({ error: "Too many requests — rate limit exceeded (100 req/min)" }, 429);
  }

  return next();
}

/**
 * Register auth middleware on the given Hono app.
 * Applied before all other middleware.
 */
export function registerAuth(app: Hono): void {
  app.use("*", authMiddleware);
}
