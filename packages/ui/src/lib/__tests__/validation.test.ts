import { describe, it, expect } from 'vitest';
import { apiKeySchema, agentConfigSchema, settingsSchema } from '../validation';

describe('apiKeySchema', () => {
  it('validates a correct API key entry', () => {
    const result = apiKeySchema.safeParse({ provider: 'openai', name: 'My Key', key: 'sk-1234567890' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid provider', () => {
    const result = apiKeySchema.safeParse({ provider: 'invalid', name: 'My Key', key: 'sk-1234567890' });
    expect(result.success).toBe(false);
  });

  it('rejects short name (< 3 chars)', () => {
    const result = apiKeySchema.safeParse({ provider: 'openai', name: 'AB', key: 'sk-1234567890' });
    expect(result.success).toBe(false);
  });

  it('rejects short API key (< 10 chars)', () => {
    const result = apiKeySchema.safeParse({ provider: 'openai', name: 'My Key', key: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects empty key', () => {
    const result = apiKeySchema.safeParse({ provider: 'openai', name: 'My Key', key: '' });
    expect(result.success).toBe(false);
  });
});

describe('agentConfigSchema', () => {
  it('validates a correct agent config', () => {
    const result = agentConfigSchema.safeParse({
      name: 'Code Assistant',
      systemPrompt: 'You are a helpful coding assistant that writes clean TypeScript code with best practices.',
      model: 'gpt-4',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = agentConfigSchema.safeParse({
      name: '',
      systemPrompt: 'You are a helpful coding assistant that writes clean TypeScript code with best practices.',
      model: 'gpt-4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short system prompt (< 50 chars)', () => {
    const result = agentConfigSchema.safeParse({
      name: 'Test',
      systemPrompt: 'Too short.',
      model: 'gpt-4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty model', () => {
    const result = agentConfigSchema.safeParse({
      name: 'Test',
      systemPrompt: 'A longer system prompt that must be at least fifty characters to pass validation easily.',
      model: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('settingsSchema', () => {
  const validSettings = {
    appName: 'AgentForge',
    theme: 'dark' as const,
    language: 'pl' as const,
    timezone: 'Europe/Warsaw',
    animations: true,
    port: 4123,
    host: '127.0.0.1',
    authEnabled: false,
    defaultModel: 'deepseek/deepseek-chat',
    autoApprove: false,
    thinkingMode: true,
  };

  it('validates correct settings', () => {
    const result = settingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it('rejects invalid theme', () => {
    const result = settingsSchema.safeParse({ ...validSettings, theme: 'blue' });
    expect(result.success).toBe(false);
  });

  it('rejects port below 1024', () => {
    const result = settingsSchema.safeParse({ ...validSettings, port: 80 });
    expect(result.success).toBe(false);
  });

  it('rejects port above 65535', () => {
    const result = settingsSchema.safeParse({ ...validSettings, port: 70000 });
    expect(result.success).toBe(false);
  });

  it('allows optional notifications field to default', () => {
    const { notifications, ...withoutNotif } = validSettings;
    const result = settingsSchema.safeParse(withoutNotif);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notifications).toBe(true);
    }
  });
});
