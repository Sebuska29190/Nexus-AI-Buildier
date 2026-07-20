/**
 * Settings & Config routes — persistent settings, provider listing, API key management
 *
 * GET    /api/settings                    — get current settings
 * POST   /api/settings                    — update settings
 * POST   /api/settings/reset              — reset to defaults
 * GET    /api/config/providers            — list providers with key status
 * POST   /api/config/provider/:id/key     — save provider API key
 * POST   /api/config/provider/:id/update  — update provider config (key, baseUrl, name)
 */

import { Hono } from "hono";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { registry } from "../../plugin/registry.ts";
import {
  getAllProviderConfigs,
  saveProviderConfig,
  deleteProviderConfig,
} from "../../config/provider-config.ts";
import { safeMessage } from "../../errors.ts";

// ─── Settings persistence ────────────────────────────────────────────────────

const SETTINGS_PATH = join(process.cwd(), "data", "settings.json");

export interface AppSettings {
  appName: string;
  theme: string;
  language: string;
  timezone: string;
  animations: boolean;
  port: number;
  host: string;
  authEnabled: boolean;
  defaultModel: string;
  autoApprove: boolean;
  thinkingMode: boolean;
  notifications: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  appName: "AgentForge",
  theme: "dark",
  language: "en",
  timezone: "Europe/Warsaw",
  animations: true,
  port: 4123,
  host: "127.0.0.1",
  authEnabled: false,
  defaultModel: "",
  autoApprove: false,
  thinkingMode: true,
  notifications: true,
};

function ensureDataDir(): void {
  const dir = dirname(SETTINGS_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadSettings(): AppSettings {
  try {
    if (existsSync(SETTINGS_PATH)) {
      const raw = readFileSync(SETTINGS_PATH, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Corrupted file — start fresh
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: AppSettings): void {
  ensureDataDir();
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

function resetSettings(): AppSettings {
  const defaults = { ...DEFAULT_SETTINGS };
  saveSettings(defaults);
  return defaults;
}

// ─── Provider helper ─────────────────────────────────────────────────────────

interface ProviderInfo {
  id: string;
  name: string;
  hasKey: boolean;
  enabled: boolean;
  models: number;
  modelCount: number;
  keySource: "env" | "saved" | "none";
  baseUrl?: string;
}

function getProviderList(): ProviderInfo[] {
  const fullConfigs = getAllProviderConfigs();
  return fullConfigs.map((p) => ({
    id: p.providerId,
    name: p.name,
    hasKey: p.hasApiKey,
    enabled: p.enabled,
    models: p.modelCount,
    modelCount: p.modelCount,
    keySource: p.keySource,
    baseUrl: p.baseUrl,
  }));
}

// ─── Register routes ─────────────────────────────────────────────────────────

export function register(app: Hono): void {
  // ─── GET /api/settings ──────────────────────────────────────────────────
  app.get("/api/settings", (c) => {
    try {
      const settings = loadSettings();
      return c.json(settings);
    } catch (e: unknown) {
      return c.json({ error: safeMessage(e) }, 500);
    }
  });

  // ─── POST /api/settings ─────────────────────────────────────────────────
  app.post("/api/settings", async (c) => {
    try {
      const body = await c.req.json<Partial<AppSettings>>();
      const current = loadSettings();
      const merged: AppSettings = { ...current, ...body };
      saveSettings(merged);
      return c.json({ success: true, settings: merged });
    } catch (e: unknown) {
      return c.json({ error: safeMessage(e) }, 500);
    }
  });

  // ─── POST /api/settings/reset ──────────────────────────────────────────
  app.post("/api/settings/reset", (c) => {
    try {
      const defaults = resetSettings();
      return c.json({ success: true, settings: defaults });
    } catch (e: unknown) {
      return c.json({ error: safeMessage(e) }, 500);
    }
  });

  // ─── GET /api/config/providers ─────────────────────────────────────────
  app.get("/api/config/providers", (c) => {
    try {
      const providers = getProviderList();
      return c.json({ providers });
    } catch (e: unknown) {
      return c.json({ error: safeMessage(e) }, 500);
    }
  });

  // ─── POST /api/config/provider/:id/key ─────────────────────────────────
  app.post("/api/config/provider/:id/key", async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json<{ apiKey: string }>();
      if (!body.apiKey || typeof body.apiKey !== "string" || body.apiKey.trim().length === 0) {
        return c.json({ error: "apiKey is required" }, 400);
      }
      saveProviderConfig(id, { apiKey: body.apiKey.trim() });
      return c.json({ success: true });
    } catch (e: unknown) {
      return c.json({ error: safeMessage(e) }, 500);
    }
  });

  // ─── POST /api/config/provider/:id/update ──────────────────────────────
  app.post("/api/config/provider/:id/update", async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json<{ apiKey?: string; baseUrl?: string; name?: string; enabled?: boolean }>();
      saveProviderConfig(id, {
        apiKey: body.apiKey?.trim() || undefined,
        baseUrl: body.baseUrl?.trim() || undefined,
        enabled: body.enabled,
      });
      return c.json({ success: true });
    } catch (e: unknown) {
      return c.json({ error: safeMessage(e) }, 500);
    }
  });

  // ─── DELETE /api/config/provider/:id ───────────────────────────────────
  // Support for delete (called by ApiKeysPage)
  app.delete("/api/config/provider/:id", (c) => {
    try {
      const id = c.req.param("id");
      const ok = deleteProviderConfig(id);
      if (!ok) {
        return c.json({ error: "Provider not found or not configured" }, 404);
      }
      return c.json({ success: true });
    } catch (e: unknown) {
      return c.json({ error: safeMessage(e) }, 500);
    }
  });
}
