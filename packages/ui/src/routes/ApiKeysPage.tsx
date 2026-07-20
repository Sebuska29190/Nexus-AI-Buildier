/**
 * ApiKeysPage — Full provider & API key management
 * Backend: /api/config/providers, /api/config/provider/add, /api/config/provider/:id/key
 * Design: AgentForge v3 (amber, flat, rounded-md)
 */
import { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, RotateCw, Trash2, Plus, Shield, Loader2, AlertCircle, X, Server, Layers } from "lucide-react";
import { ConfirmDialog } from "../lib/components/ui/ConfirmDialog";

interface ProviderEntry {
  id: string;
  name: string;
  hasKey: boolean;
  enabled: boolean;
  models: number;
  keySource: "env" | "saved" | "none";
  baseUrl?: string;
  isDynamic?: boolean;
  modelList?: Array<{ id: string; name?: string; contextWindow?: number; maxTokens?: number }>;
}

interface CustomModel {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
}

const BUILTIN_PROVIDERS = ["deepseek", "anthropic", "openai", "gemini", "ollama", "grok"];

function ApiKeysPage() {
  const [providers, setProviders] = useState<ProviderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; error?: string }>>({});
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ providerId: string; name: string } | null>(null);

  // Custom provider form
  const [customId, setCustomId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [customModels, setCustomModels] = useState<CustomModel[]>([{ id: "", name: "", contextWindow: 128000, maxTokens: 16384 }]);

  // Existing provider key form
  const [keyFormProvider, setKeyFormProvider] = useState("");
  const [keyFormKey, setKeyFormKey] = useState("");

  useEffect(() => { loadProviders(); }, []);

  async function loadProviders() {
    setLoading(true);
    try {
      const res = await fetch("/api/config/providers");
      const data = await res.json();
      const list: ProviderEntry[] = (data.providers || []).map((p: any) => ({
        id: p.id || p.providerId,
        name: p.name || p.id || p.providerId,
        hasKey: p.hasKey || false,
        enabled: p.enabled !== false,
        models: p.models || p.modelCount || 0,
        keySource: p.keySource || "none",
        baseUrl: p.baseUrl,
        isDynamic: p.isDynamic,
        modelList: p.modelList,
      }));
      setProviders(list);
    } catch (e) {
      setMessage("Failed to load providers");
    } finally {
      setLoading(false);
    }
  }

  async function addCustomProvider() {
    if (!customId.trim() || !customName.trim() || !customBaseUrl.trim()) {
      setMessage("❌ Provider ID, Name i Base URL są wymagane");
      return;
    }
    const validModels = customModels.filter(m => m.id.trim());
    if (validModels.length === 0) {
      setMessage("❌ Dodaj przynajmniej jeden model");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/config/provider/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: customId.trim(),
          name: customName.trim(),
          baseUrl: customBaseUrl.trim(),
          key: customKey.trim(),
          models: validModels,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setMessage(`✅ Provider "${customName}" dodany z ${validModels.length} modelami`);
        resetCustomForm();
        setShowAddProvider(false);
        loadProviders();
      } else {
        setMessage(`❌ ${result.error || "Failed"}`);
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function saveKeyForProvider() {
    if (!keyFormProvider || !keyFormKey.trim()) {
      setMessage("❌ Wybierz provider i wpisz key");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/config/provider/${keyFormProvider}/key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyFormKey.trim() }),
      });
      const result = await res.json();
      if (result.success || res.ok) {
        setMessage(`✅ Key zapisany dla ${keyFormProvider}`);
        setKeyFormProvider("");
        setKeyFormKey("");
        loadProviders();
      } else {
        setMessage(`❌ ${result.error || "Failed"}`);
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function testProvider(providerId: string) {
    setTesting(prev => new Set(prev).add(providerId));
    try {
      const res = await fetch(`/api/config/providers/${providerId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await res.json();
      setTestResults(prev => ({ ...prev, [providerId]: result }));
    } catch (e: any) {
      setTestResults(prev => ({ ...prev, [providerId]: { ok: false, error: e.message } }));
    } finally {
      setTesting(prev => { const s = new Set(prev); s.delete(providerId); return s; });
    }
  }

  function resetCustomForm() {
    setCustomId("");
    setCustomName("");
    setCustomBaseUrl("");
    setCustomKey("");
    setCustomModels([{ id: "", name: "", contextWindow: 128000, maxTokens: 16384 }]);
  }

  function addModelRow() {
    setCustomModels(prev => [...prev, { id: "", name: "", contextWindow: 128000, maxTokens: 16384 }]);
  }

  function removeModelRow(idx: number) {
    setCustomModels(prev => prev.filter((_, i) => i !== idx));
  }

  function updateModel(idx: number, field: keyof CustomModel, value: string | number) {
    setCustomModels(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }

  const builtinList = providers.filter(p => BUILTIN_PROVIDERS.includes(p.id));
  const customList = providers.filter(p => p.isDynamic);

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 mb-6 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">API Providers</h1>
              <p className="text-xs text-zinc-500">
                {providers.filter(p => p.hasKey).length}/{providers.length} skonfigurowanych · {customList.length} custom
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mx-4 mb-4 p-3 rounded-md text-xs font-medium ${
          message.startsWith("✅")
            ? "bg-emerald-500/8 border border-emerald-500/20 text-emerald-400"
            : "bg-red-500/8 border border-red-500/20 text-red-400"
        }`}>
          {message}
        </div>
      )}

      {/* ─── SECTION: Add Custom Provider ─────────────────────────────── */}
      <div className="mx-4 mb-4">
        <button
          onClick={() => setShowAddProvider(!showAddProvider)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-md bg-amber-500/8 border border-amber-500/15 text-amber-400 text-sm font-medium hover:bg-amber-500/12 transition-all"
        >
          <Plus className="w-4 h-4" />
          Dodaj Custom Provider (OpenAI-compatible API)
        </button>

        {showAddProvider && (
          <div className="mt-3 p-4 rounded-md bg-zinc-900/80 border border-zinc-700/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-zinc-300">Nowy Custom Provider</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">Provider ID</label>
                <input
                  type="text"
                  value={customId}
                  onChange={e => setCustomId(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                  placeholder="np. localai, together-ai"
                  className="w-full px-3 py-2 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">Display Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="np. LocalAI, Together AI"
                  className="w-full px-3 py-2 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">Base URL</label>
              <input
                type="text"
                value={customBaseUrl}
                onChange={e => setCustomBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full px-3 py-2 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">API Key (opcjonalne)</label>
              <input
                type="password"
                value={customKey}
                onChange={e => setCustomKey(e.target.value)}
                placeholder="sk-... lub zostaw puste dla API bez auth"
                className="w-full px-3 py-2 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 font-mono"
              />
            </div>

            {/* Models */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Modele</span>
                </div>
                <button onClick={addModelRow} className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Dodaj model
                </button>
              </div>
              <div className="space-y-2">
                {customModels.map((model, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={model.id}
                      onChange={e => updateModel(idx, "id", e.target.value)}
                      placeholder="model-id"
                      className="flex-1 px-2 py-1.5 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-200 placeholder-zinc-600 font-mono focus:outline-none focus:border-amber-500/40"
                    />
                    <input
                      type="text"
                      value={model.name}
                      onChange={e => updateModel(idx, "name", e.target.value)}
                      placeholder="Display name"
                      className="flex-1 px-2 py-1.5 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40"
                    />
                    <input
                      type="number"
                      value={model.contextWindow}
                      onChange={e => updateModel(idx, "contextWindow", parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1.5 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500/40"
                      title="Context window"
                    />
                    <input
                      type="number"
                      value={model.maxTokens}
                      onChange={e => updateModel(idx, "maxTokens", parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1.5 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500/40"
                      title="Max output tokens"
                    />
                    {customModels.length > 1 && (
                      <button onClick={() => removeModelRow(idx)} className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={addCustomProvider}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-amber-500 text-zinc-900 text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                {saving ? "Tworzenie..." : "Utwórz Provider"}
              </button>
              <button
                onClick={() => { setShowAddProvider(false); resetCustomForm(); }}
                className="px-4 py-2 rounded-md bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-all"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── SECTION: Add Key to Existing Provider ───────────────────── */}
      <div className="mx-4 mb-6">
        <div className="p-4 rounded-md bg-zinc-900/50 border border-zinc-700/30 space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono">Dodaj Key do Providera</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={keyFormProvider}
              onChange={e => setKeyFormProvider(e.target.value)}
              className="px-3 py-2 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/40"
            >
              <option value="">Wybierz provider...</option>
              {providers.filter(p => !p.hasKey && !p.isDynamic).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.models} modeli)</option>
              ))}
            </select>
            <input
              type="password"
              value={keyFormKey}
              onChange={e => setKeyFormKey(e.target.value)}
              placeholder="API Key"
              className="flex-1 px-3 py-2 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 font-mono"
            />
            <button
              onClick={saveKeyForProvider}
              disabled={saving || !keyFormProvider || !keyFormKey}
              className="px-4 py-2 rounded-md bg-zinc-700 text-zinc-200 text-sm font-medium hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              Zapisz
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECTION: Built-in Providers ─────────────────────────────── */}
      <div className="mx-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-zinc-500" />
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider font-mono">Built-in Providers</span>
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="rounded-md bg-zinc-900/50 border border-zinc-700/30 p-6 text-center">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Ładowanie providerów...</p>
            </div>
          ) : (
            builtinList.map(p => (
              <ProviderCard
                key={p.id}
                provider={p}
                isTesting={testing.has(p.id)}
                testResult={testResults[p.id]}
                onTest={() => testProvider(p.id)}
                onDelete={() => setConfirmDelete({ providerId: p.id, name: p.name })}
              />
            ))
          )}
        </div>
      </div>

      {/* ─── SECTION: Custom Providers ───────────────────────────────── */}
      {customList.length > 0 && (
        <div className="mx-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-medium text-amber-500/70 uppercase tracking-wider font-mono">Custom Providers</span>
          </div>
          <div className="space-y-2">
            {customList.map(p => (
              <ProviderCard
                key={p.id}
                provider={p}
                isTesting={testing.has(p.id)}
                testResult={testResults[p.id]}
                onTest={() => testProvider(p.id)}
                onDelete={() => setConfirmDelete({ providerId: p.id, name: p.name })}
              />
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Usuń Provider"
        message={`Czy na pewno chcesz usunąć konfigurację ${confirmDelete?.name}? Ta akcja nie może być cofnięta.`}
        confirmLabel="Usuń"
        variant="danger"
        onConfirm={async () => {
          if (!confirmDelete) return;
          const { providerId } = confirmDelete;
          setConfirmDelete(null);
          try {
            await fetch(`/api/config/provider/${providerId}`, { method: "DELETE" });
            loadProviders();
            setMessage(`✅ Usunięto konfigurację ${providerId}`);
          } catch {}
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ─── Provider Card Component ─────────────────────────────────────────────────

function ProviderCard({
  provider,
  isTesting,
  testResult,
  onTest,
  onDelete,
}: {
  provider: ProviderEntry;
  isTesting: boolean;
  testResult?: { ok: boolean; error?: string };
  onTest: () => void;
  onDelete: () => void;
}) {
  const statusBadge = () => {
    if (!provider.hasKey) return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800/60 border border-zinc-700/50 text-zinc-500">
        No key
      </span>
    );
    if (testResult?.ok) return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
        ✓ Connected
      </span>
    );
    if (testResult && !testResult.ok) return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-500/10 border border-red-500/20 text-red-400">
        ✗ Error
      </span>
    );
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 border border-amber-500/15 text-amber-400">
        Configured
      </span>
    );
  };

  return (
    <div className={`rounded-md p-4 flex items-center gap-4 ${
      provider.isDynamic
        ? "bg-amber-500/5 border border-amber-500/10"
        : "bg-zinc-900/50 border border-zinc-700/30"
    }`}>
      <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
        provider.hasKey
          ? "bg-amber-500/10 border border-amber-500/20"
          : "bg-zinc-800/60 border border-zinc-700/50"
      }`}>
        <span className={`text-sm font-bold ${provider.hasKey ? "text-amber-500" : "text-zinc-500"}`}>
          {provider.name.slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-200">{provider.name}</span>
          {provider.isDynamic && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 border border-amber-500/15 text-amber-500/70 uppercase">
              custom
            </span>
          )}
          {provider.keySource === "env" && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800/60 border border-zinc-700/50 text-zinc-500 uppercase">
              env
            </span>
          )}
          {statusBadge()}
          <span className="text-[10px] text-zinc-500 font-mono">{provider.models} models</span>
        </div>
        {provider.baseUrl && (
          <div className="mt-1">
            <code className="text-[10px] text-zinc-500 font-mono">{provider.baseUrl}</code>
          </div>
        )}
        {provider.modelList && provider.modelList.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {provider.modelList.slice(0, 5).map(m => (
              <span key={m.id} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800/60 border border-zinc-700/40 text-zinc-500">
                {m.id}
              </span>
            ))}
            {provider.modelList.length > 5 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800/60 border border-zinc-700/40 text-zinc-500">
                +{provider.modelList.length - 5}
              </span>
            )}
          </div>
        )}
        {testResult && !testResult.ok && testResult.error && (
          <p className="text-[10px] text-red-400 mt-1">{testResult.error}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {provider.hasKey && (
          <>
            <button
              onClick={onTest}
              disabled={isTesting}
              className="p-2 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 transition-all"
              title="Test połączenia"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
              title="Usuń konfigurację"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export { ApiKeysPage };
export default ApiKeysPage;
