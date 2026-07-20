import { describe, it, expect, beforeEach } from 'vitest';

describe('Plugin Tools', () => {
  let tools: typeof import('../plugin/tools.ts');
  
  beforeEach(async () => {
    // Re-import to get fresh module state
    tools = await import('../plugin/tools.ts');
  });

  it('should register and retrieve a tool', () => {
    const testTool = {
      name: 'test_tool',
      description: 'A test tool',
      parameters: { type: 'object' as const, properties: {}, additionalProperties: false },
      execute: async () => 'test result',
    };
    tools.registerTool(testTool);
    const retrieved = tools.getTool('test_tool');
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('test_tool');
  });

  it('should list all registered tools', () => {
    const allTools = tools.listTools();
    expect(Array.isArray(allTools)).toBe(true);
    // Should have some built-in tools (web_fetch, web_search, get_current_time, etc.)
    expect(allTools.length).toBeGreaterThan(0);
    
    // Check built-in tools exist
    const names = allTools.map(t => t.name);
    expect(names).toContain('web_fetch');
    expect(names).toContain('web_search');
    expect(names).toContain('get_current_time');
  });

  it('should return undefined for unknown tool', () => {
    const result = tools.getTool('nonexistent_tool');
    expect(result).toBeUndefined();
  });

  it('should execute registered tool and return result', async () => {
    const testTool = {
      name: 'echo_tool',
      description: 'Echoes input',
      parameters: { type: 'object' as const, 
        properties: { msg: { type: 'string' } }, 
        required: ['msg'], 
        additionalProperties: false 
      },
      execute: async (args: any) => `Echo: ${args.msg}`,
    };
    tools.registerTool(testTool);
    const retrieved = tools.getTool('echo_tool');
    expect(retrieved).toBeDefined();
    const result = await retrieved!.execute({ msg: 'hello' }, {} as any);
    expect(result).toBe('Echo: hello');
  });
});
