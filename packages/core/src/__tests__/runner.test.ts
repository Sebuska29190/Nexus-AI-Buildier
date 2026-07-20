import { describe, it, expect } from 'vitest';

describe('Agent Runner Utilities', () => {
  it('should export sessionAgentMap', async () => {
    const runner = await import('../agent/runner.ts');
    expect(runner.sessionAgentMap).toBeDefined();
    expect(runner.sessionAgentMap instanceof Map).toBe(true);
  });

  it('should export RunParams and RunResult types', async () => {
    // Just check the module loads without errors
    const runner = await import('../agent/runner.ts');
    expect(typeof runner.runAgent).toBe('function');
  });
});
