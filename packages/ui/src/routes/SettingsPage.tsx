/**
 * SettingsPage — Real settings with live provider/model data
 * Now with real API save/load and react-hook-form + zod validation
 */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Monitor, Shield, Bot, Globe, Save, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { settingsSchema, type SettingsFormData } from "../lib/validation";

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "models", label: "Models & Providers", icon: Bot },
  { id: "security", label: "Security", icon: Shield },
];

function SettingsPage() {
  const [tab, setTab] = useState("general");
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
      appName: "Nexus AI",
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

  const animationsValue = watch("animations");

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
          appName: settings.appName || "Nexus AI",
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
          appName: "Nexus AI",
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

  // Reusable field error component
  const FieldError = ({ field }: { field: keyof SettingsFormData }) => {
    const err = errors[field];
    if (!err) return null;
    return (
      <p className="flex items-center gap-1 text-xs text-[#ef4444] mt-1">
        <AlertCircle className="w-3 h-3" /> {err.message}
      </p>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#818cf8]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#e8ecf2]">Settings</h1>
            <p className="text-xs text-[#4a5068]">
              {loading ? "Loading..." : `${providersWithKeys} providers · ${totalModels} models available`}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-[rgba(99,102,241,0.12)] text-[#818cf8]" : "text-[#4a5068] hover:text-[#8892a8] hover:bg-[rgba(255,255,255,0.03)]"
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-[#818cf8] animate-spin" />
          </div>
        ) : tab === "general" ? (
          <div className="space-y-6">
            <Section title="Application">
              <div>
                <Field label="App Name" {...register("appName")} />
                <FieldError field="appName" />
              </div>
              <div>
                <SelectField label="Theme" {...register("theme")}
                  options={[{v:"dark",l:"Dark"},{v:"light",l:"Light"},{v:"system",l:"System"}]} />
                <FieldError field="theme" />
              </div>
              <div>
                <SelectField label="Language" {...register("language")}
                  options={[{v:"en",l:"English"},{v:"pl",l:"Polski"}]} />
                <FieldError field="language" />
              </div>
              <div>
                <SelectField label="Timezone" {...register("timezone")}
                  options={[{v:"Europe/Warsaw",l:"Warsaw (CET)"},{v:"Europe/London",l:"London (GMT)"},{v:"America/New_York",l:"New York (EST)"}]} />
                <FieldError field="timezone" />
              </div>
              <ToggleField label="Animations" checked={animationsValue} onChange={v => setValue("animations", v)} />
            </Section>
            <Section title="Server">
              <div>
                <Field label="Port" {...register("port")} />
                <FieldError field="port" />
              </div>
              <div>
                <Field label="Host" {...register("host")} />
                <FieldError field="host" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8892a8]">Status</span>
                <span className="text-xs text-[#10b981] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Connected — port {watch("port")}
                </span>
              </div>
            </Section>
            <Section title="Notifications">
              <ToggleField label="Enable Notifications" checked={watch("notifications")} onChange={v => setValue("notifications", v)} />
            </Section>
          </div>
        ) : tab === "models" ? (
          <div className="space-y-6">
            <Section title={`Providers (${providersWithKeys}/${providers.length} configured)`}>
              <div className="space-y-2">
                {providers.map((p: any) => (
                  <div key={p.id || p.providerId} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.hasKey ? 'bg-[#10b981]' : 'bg-[#4a5068]'}`} />
                      <span className="text-sm text-[#e8ecf2]">{p.name || p.id}</span>
                    </div>
                    <span className="text-xs text-[#4a5068]">{p.models?.length || p.modelCount || 0} models</span>
                  </div>
                ))}
              </div>
            </Section>
            <Section title={`Available Models (${totalModels})`}>
              {models.length === 0 ? (
                <p className="text-xs text-[#4a5068]">No models loaded. Check provider API keys.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {models.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                      <span className="text-xs font-mono text-[#e8ecf2] truncate">{m.id}</span>
                      <span className="text-[9px] text-[#4a5068] ml-auto shrink-0">{m.owned_by || m.provider}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
            <Section title="Agent Defaults">
              <SelectField label="Default Model" {...register("defaultModel")}
                options={models.map((m: any) => ({ v: m.id, l: m.id }))} />
              <ToggleField label="Auto-Approve Safe Tools" checked={watch("autoApprove")} onChange={v => setValue("autoApprove", v)} />
              <ToggleField label="Extended Thinking" checked={watch("thinkingMode")} onChange={v => setValue("thinkingMode", v)} />
            </Section>
          </div>
        ) : (
          <div className="space-y-6">
            <Section title="Authentication">
              <ToggleField label="Enable JWT Auth" checked={watch("authEnabled")} onChange={v => setValue("authEnabled", v)} />
            </Section>
            <Section title="Security Notes">
              <div className="text-xs text-[#4a5068] space-y-2">
                <p>🔐 API keys are encrypted with AES-256-GCM at rest</p>
                <p>🔑 Encryption key from NOVA_ENCRYPTION_KEY env or auto-generated</p>
                <p>🛡️ Keys are never sent back to client after save</p>
                <p>📁 Workspace restricted to configured paths</p>
              </div>
            </Section>
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="shrink-0 px-6 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {saved && !saveError && (
            <span className="text-xs text-[#10b981]" role="alert">✅ Settings saved</span>
          )}
          {saveError && (
            <span className="text-xs text-[#ef4444]" role="alert">❌ {saveError}</span>
          )}
          {!saved && !saveError && (
            <span className="text-xs text-[#4a5068]">Changes not saved</span>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleReset} className="btn-glass px-4 py-2 text-sm flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button type="submit" disabled={saving} className="btn-nova px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Sub-components ──────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4a5068] mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, ...inputProps }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-[#8892a8] font-medium min-w-[180px]">{label}</label>
      <input type="text" className="glass-input flex-1 px-3 py-2 text-sm" {...inputProps} />
    </div>
  );
}

function SelectField({ label, options, ...selectProps }: {
  label: string;
  options: Array<{ v: string; l: string }>;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-[#8892a8] font-medium min-w-[180px]">{label}</label>
      <select className="glass-input flex-1 px-3 py-2 text-sm" {...selectProps}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#8892a8] font-medium">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
          checked ? 'bg-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.3)]' : 'bg-[rgba(255,255,255,0.1)]'
        }`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${
          checked ? 'left-[22px]' : 'left-[2px]'
        }`} />
      </button>
    </div>
  );
}

export { SettingsPage };
export default SettingsPage;
