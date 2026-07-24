/**
 * SettingsPage — Premium AgentForge settings with cyan/violet design system.
 * Uses glass cards, Tabs, Input, Select, Switch, Button components.
 * Keeps all original settings functionality + react-hook-form + zod validation.
 */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Shield, Bot, Globe, Save, RotateCcw, AlertCircle, Bell, Server, Sliders } from "lucide-react";
import { api } from "../lib/api";
import { settingsSchema, type SettingsFormData } from "../lib/validation";

import { Button } from "../lib/components/ui/Button";
import { Input } from "../lib/components/ui/Input";
import { Select, type SelectOption } from "../lib/components/ui/Select";
import { Switch } from "../lib/components/ui/Switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../lib/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../lib/components/ui/Card";

// ─── SettingsPage ──────────────────────────────────────────────────

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [models, setModels] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // React Hook Form with zod resolver
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    // Load settings from API on mount
    Promise.all([
      api.models().catch(() => []),
      fetch("/api/config/providers").then(r => r.json()).then(d => d.providers || []).catch(() => []),
      fetch("/api/settings").then(r => r.json()).then(d => d.settings || d).catch(() => null),
    ]).then(([m, p, settings]) => {
      setModels(m);
      setProviders(p);

      // Apply loaded settings
      if (settings) {
        reset({
          appName: settings.appName || "AgentForge",
          theme: settings.theme || "dark",
          language: settings.language || "en",
          timezone: settings.timezone || "Europe/Warsaw",
          animations: settings.animations !== undefined ? settings.animations : true,
          port: settings.port ? Number(settings.port) : 4123,
          host: settings.host || "127.0.0.1",
          authEnabled: settings.authEnabled !== undefined ? settings.authEnabled : false,
          defaultModel: settings.defaultModel || (m.length > 0 ? m[0].id : ""),
          autoApprove: settings.autoApprove !== undefined ? settings.autoApprove : false,
          thinkingMode: settings.thinkingMode !== undefined ? settings.thinkingMode : true,
          notifications: settings.notifications !== undefined ? settings.notifications : true,
        });
      } else if (m.length > 0) {
        setValue("defaultModel", m[0].id);
      }
    }).finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Save failed (${res.status})`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" }).catch(() => null);
      if (res?.ok) {
        reset({
          appName: "AgentForge",
          theme: "dark",
          language: "en",
          timezone: "Europe/Warsaw",
          animations: true,
          port: 4123,
          host: "127.0.0.1",
          authEnabled: false,
          defaultModel: models.length > 0 ? models[0].id : "",
          autoApprove: false,
          thinkingMode: true,
          notifications: true,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {}
  };

  const providersWithKeys = providers.filter((p: any) => p.hasKey).length;
  const totalModels = models.length;

  // Select option presets
  const themeOptions: SelectOption[] = [
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
    { value: "system", label: "System" },
  ];
  const languageOptions: SelectOption[] = [
    { value: "en", label: "English" },
    { value: "pl", label: "Polski" },
  ];
  const timezoneOptions: SelectOption[] = [
    { value: "Europe/Warsaw", label: "Warsaw (CET)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "America/New_York", label: "New York (EST)" },
  ];
  const modelOptions: SelectOption[] = models.map((m: any) => ({
    value: m.id,
    label: m.id,
  }));

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="h-full flex flex-col overflow-hidden max-w-5xl mx-auto w-full"
    >
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06b6d4]/20 to-[#8b5cf6]/20 border border-[rgba(6,182,212,0.2)] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.08)]">
            <Settings className="w-5 h-5 text-[#06b6d4]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#E4E4E7] tracking-tight">Settings</h1>
            <p className="text-xs text-[#71717A]">
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse" />
                  Loading configuration...
                </span>
              ) : (
                <>
                  <span className="text-[#06b6d4]">{providersWithKeys}</span> providers configured ·{" "}
                  <span className="text-[#8b5cf6]">{totalModels}</span> models available
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs + Content ────────────────────────────────────── */}
      <Tabs defaultValue="general" variant="pill" className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 px-6 pt-4 pb-0">
          <TabsList>
            <TabsTrigger value="general">
              <span className="inline-flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                General
              </span>
            </TabsTrigger>
            <TabsTrigger value="providers">
              <span className="inline-flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Providers
              </span>
            </TabsTrigger>
            <TabsTrigger value="agents">
              <span className="inline-flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                Agents
              </span>
            </TabsTrigger>
            <TabsTrigger value="security">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Security
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Scrollable Content ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />
                <span className="text-xs text-[#71717A]">Loading settings...</span>
              </div>
            </div>
          ) : (
            <>
              {/* ── General Tab ─────────────────────────────────── */}
              <TabsContent value="general" className="space-y-5 border-0 bg-transparent p-0 mt-0">
                {/* Application */}
                <Card variant="default" padding="lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Settings className="w-4 h-4 text-[#06b6d4]" />
                      Application
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="App Name"
                      {...register("appName")}
                      error={errors.appName?.message}
                      placeholder="AgentForge"
                    />
                    <Select
                      label="Theme"
                      options={themeOptions}
                      {...register("theme")}
                      error={errors.theme?.message}
                    />
                    <Select
                      label="Language"
                      options={languageOptions}
                      {...register("language")}
                      error={errors.language?.message}
                    />
                    <Select
                      label="Timezone"
                      options={timezoneOptions}
                      {...register("timezone")}
                      error={errors.timezone?.message}
                    />
                    <Switch
                      label="Animations"
                      description="Enable UI transition animations and micro-interactions"
                      checked={watch("animations")}
                      onCheckedChange={(v) => setValue("animations", v)}
                    />
                  </CardContent>
                </Card>

                {/* Server */}
                <Card variant="default" padding="lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Server className="w-4 h-4 text-[#8b5cf6]" />
                      Server
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Port"
                      type="number"
                      {...register("port")}
                      error={errors.port?.message}
                      placeholder="4123"
                    />
                    <Input
                      label="Host"
                      {...register("host")}
                      error={errors.host?.message}
                      placeholder="127.0.0.1"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-medium text-[#A1A1AA]">Status</span>
                      <span className="inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                        Connected — port {watch("port")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card variant="default" padding="lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Bell className="w-4 h-4 text-[#06b6d4]" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Switch
                      label="Enable Notifications"
                      description="Receive alerts for agent completions and errors"
                      checked={watch("notifications")}
                      onCheckedChange={(v) => setValue("notifications", v)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Providers Tab ───────────────────────────────── */}
              <TabsContent value="providers" className="space-y-5 border-0 bg-transparent p-0 mt-0">
                {/* Providers list */}
                <Card variant="default" padding="lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#06b6d4]" />
                        Providers
                      </span>
                      <span className="text-xs font-normal text-[#71717A]">
                        <span className="text-[#06b6d4]">{providersWithKeys}</span>/{providers.length} configured
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {providers.length === 0 ? (
                        <p className="text-xs text-[#71717A]">No providers configured.</p>
                      ) : (
                        providers.map((p: any) => (
                          <div
                            key={p.id || p.providerId}
                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  p.hasKey
                                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                                    : "bg-[#52525B]"
                                }`}
                              />
                              <span className="text-sm text-[#E4E4E7] font-medium">
                                {p.name || p.id}
                              </span>
                            </div>
                            <span className="text-xs text-[#71717A] bg-white/[0.04] px-2 py-0.5 rounded-md">
                              {p.models?.length || p.modelCount || 0} models
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Available models */}
                <Card variant="default" padding="lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-[#8b5cf6]" />
                        Available Models
                      </span>
                      <span className="text-xs font-normal text-[#71717A]">
                        <span className="text-[#8b5cf6]">{totalModels}</span> total
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {models.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-xs text-[#71717A]">No models loaded. Check provider API keys.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {models.map((m: any) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-[rgba(6,182,212,0.2)] hover:bg-white/[0.04] transition-all"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]/60 shrink-0" />
                            <span className="text-xs font-mono text-[#E4E4E7] truncate">{m.id}</span>
                            <span className="text-[9px] text-[#71717A] ml-auto shrink-0 uppercase tracking-wider">
                              {m.owned_by || m.provider}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Agents Tab ──────────────────────────────────── */}
              <TabsContent value="agents" className="space-y-5 border-0 bg-transparent p-0 mt-0">
                <Card variant="default" padding="lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Bot className="w-4 h-4 text-[#8b5cf6]" />
                      Agent Defaults
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select
                      label="Default Model"
                      options={modelOptions}
                      placeholder={models.length === 0 ? "No models available" : "Select a model"}
                      {...register("defaultModel")}
                      error={errors.defaultModel?.message}
                    />
                    <Switch
                      label="Auto-Approve Safe Tools"
                      description="Automatically approve tool calls marked as safe"
                      checked={watch("autoApprove")}
                      onCheckedChange={(v) => setValue("autoApprove", v)}
                    />
                    <Switch
                      label="Extended Thinking"
                      description="Enable chain-of-thought reasoning for complex tasks"
                      checked={watch("thinkingMode")}
                      onCheckedChange={(v) => setValue("thinkingMode", v)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Security Tab ────────────────────────────────── */}
              <TabsContent value="security" className="space-y-5 border-0 bg-transparent p-0 mt-0">
                {/* Authentication */}
                <Card variant="default" padding="lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-[#06b6d4]" />
                      Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Switch
                      label="Enable JWT Auth"
                      description="Require authentication tokens for API access"
                      checked={watch("authEnabled")}
                      onCheckedChange={(v) => setValue("authEnabled", v)}
                    />
                  </CardContent>
                </Card>

                {/* Security Notes */}
                <Card variant="default" padding="lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-[#8b5cf6]" />
                      Security Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { icon: "🔐", text: "API keys are encrypted with AES-256-GCM at rest" },
                        { icon: "🔑", text: "Encryption key from NOVA_ENCRYPTION_KEY env or auto-generated" },
                        { icon: "🛡️", text: "Keys are never sent back to client after save" },
                        { icon: "📁", text: "Workspace restricted to configured paths" },
                      ].map((note, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 text-xs text-[#A1A1AA] bg-white/[0.02] border border-white/[0.06] rounded-lg p-3"
                        >
                          <span className="text-sm shrink-0">{note.icon}</span>
                          <span className="leading-relaxed">{note.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      {/* ── Save Bar (sticky at bottom) ───────────────────────── */}
      <div className="shrink-0 px-6 py-4 border-t border-white/[0.06] bg-[#050507]/80 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-2 min-h-[24px]">
          {saved && !saveError && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1" role="alert">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Settings saved
            </span>
          )}
          {saveError && (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1" role="alert">
              <AlertCircle className="w-3 h-3" />
              {saveError}
            </span>
          )}
          {!saved && !saveError && (
            <span className="text-xs text-[#52525B]">No unsaved changes</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={saving}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export { SettingsPage };
export default SettingsPage;
