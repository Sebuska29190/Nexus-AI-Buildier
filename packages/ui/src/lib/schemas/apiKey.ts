import { z } from "zod/v4";

/**
 * API Key form schema — validates key provider selection, name, and key value
 */
export const apiKeySchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć co najmniej 3 znaki"),
  key: z.string().min(10, "Klucz API musi mieć co najmniej 10 znaków"),
  provider: z.enum(["openai", "anthropic", "google", "deepseek", "grok", "qwen", "openrouter", "custom"], {
    errorMap: () => ({ message: "Wybierz dostawcę API" }),
  }),
});

export type ApiKeyFormData = z.infer<typeof apiKeySchema>;
