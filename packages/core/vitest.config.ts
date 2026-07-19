import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Only include modules that can be meaningfully tested under Vitest
      include: [
        'src/compaction.ts',
        'src/quota.ts',
        'src/api/routes.ts',
        'src/event-bus/index.ts',
        'src/safety/circuit-breaker-tools.ts',
        'src/safety/tool-audit.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 60,
        branches: 50,
        statements: 70,
      },
    },
    // Map bun:test imports to vitest globals
    alias: {
      'bun:test': 'vitest',
    },
    globals: true,
  },
});
