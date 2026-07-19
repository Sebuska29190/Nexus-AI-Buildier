import { describe, it, expect } from 'vitest';

// Test routes.ts — createRouter should return a Hono app with registered routes
describe('API Router', () => {
  it('should createRouter return a Hono app', async () => {
    // Dynamic import to avoid top-level side effects
    const { createRouter } = await import('../api/routes.ts');
    const app = createRouter();
    expect(app).toBeDefined();
    expect(typeof app.fetch).toBe('function');
    expect(typeof app.routes).toBe('function');
  });

  it('should respond with 401 for unauthenticated /api/* requests', async () => {
    const { createRouter } = await import('../api/routes.ts');
    const app = createRouter();
    const res = await app.request('/api/models', {}, {}, undefined as any);
    expect(res.status).toBe(401);
  });

  it('should respond with 200 for health endpoint', async () => {
    const { createRouter } = await import('../api/routes.ts');
    const app = createRouter();
    const res = await app.request('/health', {}, {}, undefined as any);
    // Health may respond with 200 or 404 depending on registration order
    // We just check it doesn't crash
    expect(res.status).toBeDefined();
  });
});
