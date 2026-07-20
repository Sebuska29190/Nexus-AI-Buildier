import { useState } from "react";
import { Play, Copy, Save, RotateCcw, FlaskConical, Clock, Zap, DollarSign, ChevronDown } from "lucide-react";
import { GlassCard } from "../lib/components/ui/GlassCard";
import { GlassButton } from "../lib/components/ui/GlassButton";
import { GlassInput, GlassTextarea } from "../lib/components/ui/GlassInput";
import { GlassDropdown } from "../lib/components/ui/GlassDropdown";
import { GlassBadge } from "../lib/components/ui/GlassBadge";

interface RunResult {
  id: number;
  model: string;
  response: string;
  tokens: number;
  latency: number;
  cost: number;
  timestamp: Date;
}

interface PromptPlaygroundProps {
  models?: Array<{ id: string }>;
}

export function PromptPlaygroundPage({ models = [] }: PromptPlaygroundProps) {
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant. Be concise and accurate.");
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-chat");
  const [temperature, setTemperature] = useState("0.7");
  const [maxTokens, setMaxTokens] = useState("2048");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});

  const modelOptions = models.length > 0
    ? models.map((m) => ({ label: m.id.split("/").pop() || m.id, value: m.id }))
    : [
        { label: "deepseek-chat", value: "deepseek/deepseek-chat" },
        { label: "deepseek-coder", value: "deepseek/deepseek-coder" },
      ];

  async function handleRun() {
    if (!userPrompt.trim() || running) return;

    setRunning(true);
    setCurrentResponse("");
    const startTime = Date.now();

    try {
      // Replace variables in prompts
      let resolvedUser = userPrompt;
      let resolvedSystem = systemPrompt;
      for (const [key, val] of Object.entries(variables)) {
        resolvedUser = resolvedUser.split(`{{${key}}}`).join(val);
        resolvedSystem = resolvedSystem.split(`{{${key}}}`).join(val);
      }

      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: resolvedSystem },
            { role: "user", content: resolvedUser },
          ],
          temperature: parseFloat(temperature),
          max_tokens: parseInt(maxTokens),
          stream: true,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              fullText += delta;
              setCurrentResponse(fullText);
            } catch {}
          }
        }
      }

      const latency = (Date.now() - startTime) / 1000;
      const tokenCount = fullText.split(/\s+/).length * 1.3; // rough estimate

      setResults((prev) => [{
        id: Date.now(),
        model: selectedModel.split("/").pop() || selectedModel,
        response: fullText,
        tokens: Math.round(tokenCount),
        latency: parseFloat(latency.toFixed(2)),
        cost: 0,
        timestamp: new Date(),
      }, ...prev]);

    } catch (err: any) {
      setCurrentResponse(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  }

  // Extract variables from prompts
  const variableMatches = [...systemPrompt.matchAll(/\{\{(\w+)\}\}/g), ...userPrompt.matchAll(/\{\{(\w+)\}\}/g)];
  const foundVars = [...new Set(variableMatches.map((m) => m[1]))];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#F59E0B] to-[#F59E0B] flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <FlaskConical size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Prompt Playground</h1>
          <p className="text-xs text-[#71717A]">Test prompts with different models and parameters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: Editors */}
        <div className="space-y-4">
          {/* System Prompt */}
          <GlassCard padding="md">
            <label className="text-xs font-medium text-[#A1A1AA] mb-2 block">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="glass-input w-full px-4 py-3 text-sm font-mono min-h-[100px] resize-y"
              placeholder="Define the AI's behavior..."
            />
          </GlassCard>

          {/* User Prompt */}
          <GlassCard padding="md">
            <label className="text-xs font-medium text-[#A1A1AA] mb-2 block">User Prompt</label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="glass-input w-full px-4 py-3 text-sm font-mono min-h-[120px] resize-y"
              placeholder="Enter your prompt here... Use {{variable}} for dynamic values"
            />
            {foundVars.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[#71717A]">
                <span>Variables detected:</span>
                {foundVars.map((v) => (
                  <GlassBadge key={v} variant="accent">{`{{${v}}}`}</GlassBadge>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Run Button */}
          <div className="flex items-center gap-3">
            <GlassButton
              variant="primary"
              size="lg"
              icon={<Play size={16} />}
              loading={running}
              onClick={handleRun}
            >
              {running ? "Running..." : "Run Prompt"}
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="md"
              icon={<RotateCcw size={14} />}
              onClick={() => { setUserPrompt(""); setCurrentResponse(""); }}
            >
              Clear
            </GlassButton>
          </div>

          {/* Current Response */}
          {(currentResponse || running) && (
            <GlassCard padding="md" className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#A1A1AA]">Response</span>
                {running && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-glow-pulse" />
                    <span className="text-[10px] text-[#71717A]">Streaming...</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-[#cbd5e1] font-mono whitespace-pre-wrap leading-relaxed">
                {currentResponse || (
                  <span className="text-[#71717A] italic">Waiting for response...</span>
                )}
              </div>
            </GlassCard>
          )}

          {/* History */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">History</h3>
              {results.map((r) => (
                <GlassCard key={r.id} padding="md" className="animate-slide-in">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GlassBadge variant="accent">{r.model}</GlassBadge>
                      <span className="text-[10px] text-[#71717A]">{r.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#71717A]">
                      <span className="flex items-center gap-1"><Zap size={10} />{r.tokens} tokens</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{r.latency}s</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.response)}
                        className="text-[#71717A] hover:text-[#F59E0B] transition-colors"
                        title="Copy response"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#A1A1AA] line-clamp-3">{r.response}</p>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Right: Settings */}
        <div className="space-y-4">
          <GlassCard padding="md">
            <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-4">Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Model</label>
                <GlassDropdown
                  value={selectedModel}
                  options={modelOptions}
                  onChange={setSelectedModel}
                />
              </div>

              <GlassInput
                label="Temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                helperText="0 = deterministic, 2 = very creative"
              />

              <GlassInput
                label="Max Tokens"
                type="number"
                min="1"
                max="128000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
              />
            </div>
          </GlassCard>

          {/* Variables */}
          {foundVars.length > 0 && (
            <GlassCard padding="md" className="animate-fade-in-up">
              <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-4">Variables</h3>
              <div className="space-y-3">
                {foundVars.map((v) => (
                  <GlassInput
                    key={v}
                    label={`{{${v}}}`}
                    value={variables[v] || ""}
                    onChange={(e) => setVariables((prev) => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Value for ${v}...`}
                  />
                ))}
              </div>
            </GlassCard>
          )}

          {/* Quick Templates */}
          <GlassCard padding="md">
            <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-4">Quick Templates</h3>
            <div className="space-y-2">
              {[
                { label: "Code Review", system: "You are a senior code reviewer. Analyze code for bugs, security issues, and improvements.", user: "Review this code:\n\n```javascript\nfunction example() {\n  // review this\n}\n```" },
                { label: "Summarize", system: "You are a concise summarizer. Extract key points.", user: "Summarize the following text:\n\n{{text}}" },
                { label: "Translate", system: "You are a professional translator. Translate accurately.", user: "Translate to {{language}}:\n\n{{text}}" },
              ].map((t) => (
                <button
                  key={t.label}
                  onClick={() => { setSystemPrompt(t.system); setUserPrompt(t.user); }}
                  className="w-full text-left px-3 py-2 rounded-md text-xs text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#E4E4E7] transition-all duration-200 border border-transparent hover:border-[rgba(255,255,255,0.06)]"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
