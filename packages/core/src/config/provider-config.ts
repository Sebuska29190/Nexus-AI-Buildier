/**
 * Provider Config — persistent API key & settings management
 *
 * Stores provider configurations (API keys, base URLs, token limits)
 * in a JSON file at data/provider-config.json.
 * API keys are encrypted at rest with AES-256-GCM.
 *
 * On startup, saved configs are merged into process.env so existing
 * provider plugins pick them up automatically.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { registry } from "../plugin/registry.ts";
import { safeMessage } from "../errors.ts";
import { encrypt, decrypt, isEncrypted } from "./encryption.ts";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ModelConfig {
  id: string;
  name?: string;
  contextWindow?: number;
  maxTokens?: number;
}

export interface ProviderConfigEntry {
  providerId: string;
  name?: string;
  key: string;
  baseUrl?: string;
  enabled: boolean;
  maxTokens?: number;
  thinkingLevel?: string;
  models?: ModelConfig[];
  isDynamic?: boolean;
  updatedAt: string;
}

interface ProviderConfigStore {
  providers: Record<string, ProviderConfigEntry>;
}

// ─── Path ────────────────────────────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), "data");
const CONFIG_PATH = join(DATA_DIR, "provider-config.json");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ─── Load / Save ─────────────────────────────────────────────────────────────

/** @internal exposed for harness/pi.ts to read maxTokens */
export function loadRaw(): ProviderConfigStore {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, "utf-8");
      const store: ProviderConfigStore = JSON.parse(raw);
      // Decrypt API keys on load
      for (const [id, entry] of Object.entries(store.providers)) {
        if (entry.key && isEncrypted(entry.key)) {
          const plain = decrypt(entry.key);
          if (plain) {
            store.providers[id] = { ...entry, key: plain };
          } else {
            // Decryption failed — key corrupted or wrong key
            store.providers[id] = { ...entry, key: "" };
          }
        }
      }
      return store;
    }
  } catch {
    // Corrupted file — start fresh
  }
  return { providers: {} };
}

function saveRaw(store: ProviderConfigStore): void {
  ensureDataDir();
  const clone = JSON.parse(JSON.stringify(store)) as ProviderConfigStore;
  // Encrypt all API keys before saving
  for (const [id, entry] of Object.entries(clone.providers)) {
    if (entry.key && !isEncrypted(entry.key)) {
      clone.providers[id] = { ...entry, key: encrypt(entry.key) };
    }
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(clone, null, 2), "utf-8");
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Load all saved provider configs and merge API keys into process.env.
 * Call this ONCE during server startup, AFTER providers are registered.
 */
export function loadProviderConfigs(): void {
  const store = loadRaw();
  let restored = 0;

  for (const [providerId, entry] of Object.entries(store.providers)) {
    if (entry.key) {
      // Derive env var name from provider auth definition
      const provider = registry.getProvider(providerId);
      const envVar = provider?.auth?.envVar || `${providerId.toUpperCase()}_API_KEY`;
      if (!process.env[envVar]) {
        process.env[envVar] = entry.key;
        restored++;
      }
    }

    // Re-create dynamic providers if they exist in saved config
    if (entry.isDynamic && entry.baseUrl && entry.models && entry.models.length > 0) {
      const existingProvider = registry.getProvider(providerId);
      if (!existingProvider) {
        createDynamicProvider({
          providerId,
          name: entry.name || providerId,
          baseUrl: entry.baseUrl,
          key: entry.key,
          models: entry.models,
        });
      }
    }
  }

  if (restored > 0) {
    console.log(`  ✓ Restored ${restored} provider API key(s) from config`);
  }
}

/**
 * Get all provider configs (saved + registered providers with status).
 */
export function getAllProviderConfigs(): Array<{
  providerId: string;
  name: string;
  configured: boolean;
  enabled: boolean;
  hasKey: boolean;
  keySource: "env" | "saved" | "none";
  modelCount: number;
  maxTokens?: number;
  thinkingLevel?: string;
  baseUrl?: string;
  models?: ModelConfig[];
  isDynamic?: boolean;
}> {
  const store = loadRaw();
  const result: Array<{
    providerId: string;
    name: string;
    configured: boolean;
    enabled: boolean;
    hasKey: boolean;
    keySource: "env" | "saved" | "none";
    modelCount: number;
    maxTokens?: number;
    thinkingLevel?: string;
    baseUrl?: string;
    models?: ModelConfig[];
    isDynamic?: boolean;
  }> = [];

  // Add all registered providers
  for (const [id, provider] of registry.providers) {
    const saved = store.providers[id];
    const envVar = provider.auth?.envVar || `${id.toUpperCase()}_API_KEY`;
    const hasEnvKey = !!process.env[envVar];
    const hasSavedKey = !!saved?.key;
    const keySource = hasEnvKey ? "env" : hasSavedKey ? "saved" : "none";

    result.push({
      providerId: id,
      name: provider.name,
      configured: hasEnvKey || hasSavedKey,
      enabled: saved?.enabled ?? true,
      hasKey: hasEnvKey || hasSavedKey,
      keySource,
      modelCount: provider.models.length,
      maxTokens: saved?.maxTokens,
      thinkingLevel: saved?.thinkingLevel,
      baseUrl: saved?.baseUrl,
      models: saved?.models,
      isDynamic: saved?.isDynamic,
    });
  }

  // Add dynamic providers that are saved but not yet registered (e.g., before loadProviderConfigs() runs)
  for (const [id, saved] of Object.entries(store.providers)) {
    if (saved.isDynamic && !registry.getProvider(id)) {
      const envVar = `${id.toUpperCase()}_API_KEY`;
      const hasEnvKey = !!process.env[envVar];
      const hasSavedKey = !!saved?.key;
      const keySource = hasEnvKey ? "env" : hasSavedKey ? "saved" : "none";

      result.push({
        providerId: id,
        name: saved.name || id,
        configured: hasEnvKey || hasSavedKey,
        enabled: saved?.enabled ?? true,
        hasKey: hasEnvKey || hasSavedKey,
        keySource,
        modelCount: saved.models?.length || 0,
        maxTokens: saved?.maxTokens,
        thinkingLevel: saved?.thinkingLevel,
        baseUrl: saved?.baseUrl,
        models: saved?.models,
        isDynamic: true,
      });
    }
  }

  return result;
}

/**
 * Save (or update) a provider's API key and settings.
 * Also sets process.env so the provider picks it up immediately.
 */
export function saveProviderConfig(
  providerId: string,
  config: { key?: string; baseUrl?: string; maxTokens?: number; thinkingLevel?: string; enabled?: boolean },
): ProviderConfigEntry {
  const store = loadRaw();
  const existing = store.providers[providerId] || {
    providerId,
    key: "",
    enabled: true,
    updatedAt: "",
  };

  const entry: ProviderConfigEntry = {
    providerId,
    key: config.key ?? existing.key,
    baseUrl: config.baseUrl ?? existing.baseUrl,
    enabled: config.enabled ?? existing.enabled,
    maxTokens: config.maxTokens ?? existing.maxTokens,
    thinkingLevel: config.thinkingLevel ?? existing.thinkingLevel,
    updatedAt: new Date().toISOString(),
  };

  store.providers[providerId] = entry;
  saveRaw(store);

  // Set env var immediately so provider picks it up
  if (entry.key) {
    const provider = registry.getProvider(providerId);
    const envVar = provider?.auth?.envVar || `${providerId.toUpperCase()}_API_KEY`;
    process.env[envVar] = entry.key;
  }

  return entry;
}

/**
 * Remove a provider's API key (unbind).
 */
export function deleteProviderConfig(providerId: string): boolean {
  const store = loadRaw();
  if (!store.providers[providerId]) return false;

  delete store.providers[providerId];
  saveRaw(store);

  // Clear env var
  const provider = registry.getProvider(providerId);
  const envVar = provider?.auth?.envVar || `${providerId.toUpperCase()}_API_KEY`;
  delete process.env[envVar];

  return true;
}

/**
 * Test a provider connection by making a lightweight API call.
 * Returns { ok: true } or { ok: false, error: string }.
 */
export async function testProviderConnection(
  providerId: string,
  key?: string,
): Promise<{ ok: boolean; error?: string }> {
  const provider = registry.getProvider(providerId);
  if (!provider) return { ok: false, error: "Provider not registered" };

  const k = key || process.env[provider.auth?.envVar || `${providerId.toUpperCase()}_API_KEY`];
  if (!k) return { ok: false, error: "No API key provided" };

  // Use the first model to test
  const firstModel = provider.models[0];
  if (!firstModel) return { ok: false, error: "Provider has no models" };

  try {
    let response = "";
    await provider.stream({
      model: firstModel.id,
      messages: [{ role: "user", content: "Respond with exactly: OK" }],
      onChunk: (chunk) => {
        if (chunk.type === "text") response += chunk.text;
        if (chunk.type === "error") throw new Error(chunk.message);
      },
    });

    if (response.includes("OK")) return { ok: true };
    return { ok: true }; // Got some response, connection works
  } catch (e: unknown) {
    return { ok: false, error: safeMessage(e) };
  }
}

/**
 * Create and register a dynamic custom provider at runtime.
 * This allows users to add OpenAI-compatible providers with custom models.
 */
export function createDynamicProvider(config: {
  providerId: string;
  name: string;
  baseUrl: string;
  key: string;
  models: ModelConfig[];
}): ProviderConfigEntry {
  // Create provider plugin dynamically
  const models = config.models.map((m) => ({
    id: m.id,
    name: m.name || m.id,
    contextWindow: m.contextWindow || 128_000,
    maxTokens: m.maxTokens || 16_384,
    cost: { input: 0, output: 0 },
  }));

  const dynamicPlugin = {
    id: config.providerId,
    name: config.name,
    models,
    auth: { method: "api-key" as const, envVar: `${config.providerId.toUpperCase()}_API_KEY` },
    classifyError: (e: unknown) => {
      const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
      if (msg.includes("401") || msg.includes("auth")) return "auth";
      if (msg.includes("429") || msg.includes("rate")) return "rate";
      if (msg.includes("refused") || msg.includes("econn")) return "timeout";
      return "unknown";
    },
    stream: async (p: { model: string; messages: any[]; tools?: any[]; signal?: AbortSignal; maxTokens?: number; onChunk: (chunk: any) => void }) => {
      const base = config.baseUrl;
      const k = process.env[`${config.providerId.toUpperCase()}_API_KEY`] || "";

      const body: Record<string, unknown> = {
        model: p.model,
        messages: p.messages,
        stream: true,
        max_tokens: p.maxTokens ?? 4096,
      };
      if (p.tools?.length) body.tools = p.tools;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (k) headers["Authorization"] = `Bearer ${k}`;

      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: p.signal,
      });

      if (!res.ok) {
        p.onChunk({ type: "error", message: `${config.name} ${res.status}: ${await res.text()}` });
        return;
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        for (const line of buf.split("\n").slice(0, -1)) {
          const t = line.trim();
          if (!t.startsWith("data: ")) continue;
          const d = t.slice(6);
          if (d === "[DONE]") continue;

          try {
            const j = JSON.parse(d);
            const delta = j.choices?.[0]?.delta;
            if (!delta) {
              if (j.usage) {
                p.onChunk({
                  type: "usage",
                  input: j.usage.prompt_tokens ?? 0,
                  output: j.usage.completion_tokens ?? 0,
                });
              }
              continue;
            }
            if (delta.content) p.onChunk({ type: "text", text: delta.content });
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                p.onChunk({
                  type: "tool_call",
                  id: tc.id,
                  name: tc.function?.name ?? "",
                  args: tc.function?.arguments ?? "",
                });
              }
            }
          } catch {
            /* skip */
          }
        }
        buf = buf.split("\n").pop() ?? "";
      }
      p.onChunk({ type: "done" });
    },
  };

  // Register in runtime registry
  registry.registerProvider(dynamicPlugin);

  // Save to persistent storage
  const entry = saveProviderConfig(config.providerId, {
    key: config.key,
    baseUrl: config.baseUrl,
    enabled: true,
  });

  // Mark as dynamic and save additional metadata
  const store = loadRaw();
  if (store.providers[config.providerId]) {
    store.providers[config.providerId] = {
      ...store.providers[config.providerId],
      name: config.name,
      models: config.models,
      isDynamic: true,
    };
    saveRaw(store);
  }

  console.log(`  ✓ Registered dynamic provider: ${config.name} (${config.providerId}) with ${models.length} model(s)`);

  return entry;
}
