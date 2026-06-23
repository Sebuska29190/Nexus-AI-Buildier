import { Hono } from "hono";

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

export { rateLimit, rateLimitMap };

/**
 * Register middleware on the given Hono app.
 */
export function registerRoutes(app: Hono): void {
  // Rate limiting
  app.use("*", rateLimitMiddleware);

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
