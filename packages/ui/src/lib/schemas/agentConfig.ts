import { z } from "zod/v4";

/**
 * Agent configuration schema — validates agent name, system prompt, and model
 */
export const agentConfigSchema = z.object({
  name: z.string().min(1, "Nazwa agenta jest wymagana"),
  systemPrompt: z
    .string()
    .min(50, "System prompt musi mieć co najmniej 50 znaków"),
  model: z.string().min(1, "Model jest wymagany"),
});

export type AgentConfigFormData = z.infer<typeof agentConfigSchema>;
