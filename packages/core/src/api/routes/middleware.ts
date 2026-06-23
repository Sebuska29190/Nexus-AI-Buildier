import { Hono } from "hono";
import { getCookie } from "hono/cookie";

// Auth middleware — auth/jwt.ts was removed; verifyToken stubbed
function verifyToken(token: string): unknown | null {
  // Stub: auth not configured
  return null;
}

// Auth middleware — bypass for /health, /api/auth, /v1, and /api/sessions
const PUBLIC_PATHS = ["/health", "/api/auth", "/", "/assets"];

function authMiddleware(c: any, next: any) {
  const path = c.req.path;
  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p))) return next();
  const auth = c.req.header("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : getCookie(c, "nova_token") || "";
  if (token) {
    const user = verifyToken(token);
    if (user) {
      c.set("user", user);
      return next();
    }
  }
  // Allow public GET requests only for known safe endpoints
  const PUBLIC_GET_PATHS = ["/api/sessions", "/api/tools", "/api/agents", "/api/skills", "/v1/models", "/health"];
  if (c.req.method === "GET" && PUBLIC_GET_PATHS.some(p => path === p || path.startsWith(p + "/"))) return next();
  return c.json({ error: "Unauthorized" }, 401);
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// Periodic cleanup of expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 60000);

// Rate limiting middleware (applied to all API routes)
function rateLimitMiddleware(c: any, next: any) {
  const path = c.req.path;
  // Skip rate limiting for static assets and health checks
  if (!path.startsWith("/v1/") && !path.startsWith("/api/")) return next();

  // Use IP as key (fallback to "anonymous")
  const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
  const isGet = c.req.method === "GET";

  // GET: 60 req/min per IP, POST: 20 req/min per IP
  const max = isGet ? 60 : 20;
  if (!rateLimit(ip, max, 60000)) {
    return c.json({ error: "Too many requests — rate limit exceeded" }, 429);
  }
  return next();
}

export { authMiddleware, rateLimit, rateLimitMap, PUBLIC_PATHS, PUBLIC_GET_PATHS };

/**
 * Register middleware on the given Hono app.
 */
export function registerRoutes(app: Hono): void {
  // Rate limiting (applied first, before auth)
  app.use("*", rateLimitMiddleware);

  // Auth middleware
  app.use("*", authMiddleware);

  // Security headers
  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    const path = c.req.path;
    if (!path.startsWith("/v1/") && !path.includes("/stream") && !path.includes("/events")) {
      c.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:;");
    }
  });
}
