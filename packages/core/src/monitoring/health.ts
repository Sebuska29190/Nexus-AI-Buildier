import { Hono } from 'hono';
import { metrics } from './metrics.ts';

export const healthRouter = new Hono();

healthRouter.get('/health', async (c) => {
  const checks = {
    database: false,
    memory: process.memoryUsage().heapUsed < 1e9, // <1GB
    uptime: process.uptime()
  };
  
  try {
    // Verify database connectivity via a simple query
    const { sessionManager } = await import('../session/manager.ts');
    const sessionCount = sessionManager.listSessions().length;
    checks.database = typeof sessionCount === 'number';
  } catch {}
  
  const healthy = checks.database && checks.memory;
  return c.json({ healthy, checks }, healthy ? 200 : 503);
});

healthRouter.get('/metrics', (c) => {
  return c.json(metrics.snapshot());
});
