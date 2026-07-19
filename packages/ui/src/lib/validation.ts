/**
 * Zod schemas for form validation in Nexus AI
 */
import { z } from "zod/v4";

// API key form: non-empty string, min 10 chars
export const apiKeySchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  apiKey: z.string().min(1, "API key is required").min(10, "API key must be at least 10 characters"),
});

// Agent config: name required, system prompt min 50 chars
export const agentConfigSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  systemPrompt: z.string().min(50, "System prompt must be at least 50 characters"),
  modelRef: z.string().min(1, "Model reference is required"),
});

// Settings validation per field
export const settingsSchema = z.object({
  appName: z.string().min(1, "App name is required"),
  language: z.string().min(1, "Language is required"),
  timezone: z.string().min(1, "Timezone is required"),
  animations: z.boolean(),
  port: z.coerce.number().int().min(1024, "Port must be >= 1024").max(65535, "Port must be <= 65535"),
  host: z.string().min(1, "Host is required"),
  authEnabled: z.boolean(),
  defaultModel: z.string().min(1, "Default model is required"),
  autoApprove: z.boolean(),
  thinkingMode: z.boolean(),
});

// Channel config validation
export const channelConfigSchema = z.object({
  token: z.string().optional(),
  chatId: z.string().optional(),
  channelId: z.string().optional(),
  topic: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  url: z.string().url().optional().or(z.literal("")),
  host: z.string().optional(),
  port: z.string().optional(),
  user: z.string().optional(),
  pass: z.string().optional(),
});

// Infer types
export type ApiKeyForm = z.infer<typeof apiKeySchema>;
export type AgentConfigForm = z.infer<typeof agentConfigSchema>;
export type SettingsForm = z.infer<typeof settingsSchema>;
