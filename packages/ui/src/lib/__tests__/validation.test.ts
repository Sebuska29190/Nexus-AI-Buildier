import { describe, it, expect } from 'vitest';
import { apiKeySchema, agentConfigSchema, settingsSchema, channelConfigSchema } from '../validation';

describe('apiKeySchema', () => {
  it('validates a correct API key entry', () => {
    const result = apiKeySchema.safeParse({ provider: 'openai', apiKey: 'sk-1234567890' });
    expect(result.success).toBe(true);
  });

  it('rejects empty provider', () => {
    const result = apiKeySchema.safeParse({ provider: '', apiKey: 'sk-1234567890' });
    expect(result.success).toBe(false);
  });

  it('rejects short API key (< 10 chars)', () => {
    const result = apiKeySchema.safeParse({ provider: 'openai', apiKey: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects empty API key', () => {
    const result = apiKeySchema.safeParse({ provider: 'openai', apiKey: '' });
    expect(result.success).toBe(false);
  });
});

describe('agentConfigSchema', () => {
  it('validates a correct agent config', () => {
    const result = agentConfigSchema.safeParse({
      name: 'Code Assistant',
      systemPrompt: 'You are a helpful coding assistant that writes clean TypeScript code.',
      modelRef: 'gpt-4',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = agentConfigSchema.safeParse({
      name: '',
      systemPrompt: 'You are a helpful coding assistant that writes clean TypeScript code.',
      modelRef: 'gpt-4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short system prompt (< 50 chars)', () => {
    const result = agentConfigSchema.safeParse({
      name: 'Test',
      systemPrompt: 'Too short.',
      modelRef: 'gpt-4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty modelRef', () => {
    const result = agentConfigSchema.safeParse({
      name: 'Test',
      systemPrompt: 'A longer system prompt that must be at least fifty characters to pass validation.',
      modelRef: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('settingsSchema', () => {
  it('validates correct settings', () => {
    const result = settingsSchema.safeParse({
      appName: 'Nexus AI',
      language: 'en',
      timezone: 'Europe/Warsaw',
      animations: true,
      port: 4123,
      host: '127.0.0.1',
      authEnabled: false,
      defaultModel: 'deepseek/deepseek-chat',
      autoApprove: false,
      thinkingMode: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects port below 1024', () => {
    const result = settingsSchema.safeParse({
      appName: 'Nexus AI',
      language: 'en',
      timezone: 'Europe/Warsaw',
      animations: true,
      port: 80,
      host: '127.0.0.1',
      authEnabled: false,
      defaultModel: 'deepseek/deepseek-chat',
      autoApprove: false,
      thinkingMode: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects port above 65535', () => {
    const result = settingsSchema.safeParse({
      appName: 'Nexus AI',
      language: 'en',
      timezone: 'Europe/Warsaw',
      animations: true,
      port: 70000,
      host: '127.0.0.1',
      authEnabled: false,
      defaultModel: 'deepseek/deepseek-chat',
      autoApprove: false,
      thinkingMode: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('channelConfigSchema', () => {
  it('validates a telegram config', () => {
    const result = channelConfigSchema.safeParse({ token: 'abc123', chatId: '12345' });
    expect(result.success).toBe(true);
  });

  it('validates an empty config', () => {
    const result = channelConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates webhook URL', () => {
    const result = channelConfigSchema.safeParse({ webhookUrl: 'https://hooks.example.com' });
    expect(result.success).toBe(true);
  });
});
