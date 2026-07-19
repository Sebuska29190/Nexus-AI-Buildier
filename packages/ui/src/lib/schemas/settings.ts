import { z } from "zod/v4";

/**
 * Settings schema — validates all application settings fields
 */
export const settingsSchema = z.object({
  appName: z
    .string()
    .min(1, "Nazwa aplikacji jest wymagana")
    .max(64, "Nazwa aplikacji może mieć maksymalnie 64 znaki"),
  theme: z.enum(["dark", "light", "system"], {
    errorMap: () => ({ message: "Wybierz motyw: dark, light lub system" }),
  }),
  language: z.enum(["pl", "en"], {
    errorMap: () => ({ message: "Wybierz język: polski lub angielski" }),
  }),
  timezone: z.string().min(1, "Strefa czasowa jest wymagana"),
  animations: z.boolean(),
  port: z.coerce
    .number()
    .int("Port musi być liczbą całkowitą")
    .min(1024, "Port musi być >= 1024")
    .max(65535, "Port musi być <= 65535"),
  host: z.string().min(1, "Host jest wymagany"),
  authEnabled: z.boolean(),
  defaultModel: z.string().min(1, "Domyślny model jest wymagany"),
  autoApprove: z.boolean(),
  thinkingMode: z.boolean(),
  notifications: z.boolean().optional().default(true),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
