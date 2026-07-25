import { z } from "zod/v4";

/**
 * API Key form schema — validates key provider selection, name, and key value
 */
export const apiKeySchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć co najmniej 3 znaki"),
  key: z.string().min(10, "Klucz API musi mieć co najmniej 10 znaków"),
  // Zod v4: `errorMap` was removed; use the top-level `message`
  // option on `z.enum` for fixed-message custom errors.
  provider: z.enum(["openai", "anthropic", "google", "deepseek", "grok", "qwen", "openrouter", "custom"], {
    message: "Wybierz dostawcę API",
  }),
  baseUrl: z.string().optional(),
});

export type ApiKeyFormData = z.infer<typeof apiKeySchema>;
