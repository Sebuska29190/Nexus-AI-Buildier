import { useState, useEffect } from "react";
import { GitBranch, GitCommit, GitMerge, RefreshCw, Plus, Minus, Trash2, Eye, Copy, ArrowUp, ArrowDown, Search } from "lucide-react";
import { GlassCard } from "../lib/components/ui/GlassCard";
import { GlassButton } from "../lib/components/ui/GlassButton";
import { GlassInput, GlassTextarea } from "../lib/components/ui/GlassInput";
import { GlassBadge } from "../lib/components/ui/GlassBadge";
import { GlassTabs } from "../lib/components/ui/GlassTabs";

interface GitInfo {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  conflicted: string[];
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export function GitAutomationPage() {
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [diff, setDiff] = useState("");
  const [activeTab, setActiveTab] = useState("status");
  const [cwd, setCwd] = useState("");
  const [result, setResult] = useState("");

  async function runGit(command: string, args?: Record<string, any>) {
    setLoading(true);
    setResult("");
    try {
      const body = { cwd: cwd || undefined, ...args };
      const res = await fetch(`/api/git/${command}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { setResult(`Error: ${data.error}`); }
      else { setResult(typeof data === "string" ? data : JSON.stringify(data, null, 2)); }
      return data;
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    try {
      const data = await runGit("status");
      if (data && !data.error) setGitInfo(data);
    } catch {}
  }

  async function refreshLog() {
    try {
      const data = await runGit("log", { count: 20 });
      if (data && !data.error) setCommits(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function refreshDiff() {
    try {
      const data = await runGit("diff");
      if (data && !data.error) setDiff(typeof data === "string" ? data : "");
    } catch {}
  }

  useEffect(() => { refreshStatus(); refreshLog(); }, []);

  async function handleCommit() {
    if (!commitMsg.trim()) return;
    await runGit("commit", { message: commitMsg });
    setCommitMsg("");
    refreshStatus();
    refreshLog();
  }

  async function handlePush() {
    await runGit("push");
    refreshStatus();
  }

  async function handlePull() {
    await runGit("pull");
    refreshStatus();
    refreshLog();
  }

  const tabs = [
    { id: "status", label: "Status", icon: <GitBranch size={12} /> },
    { id: "log", label: "History", icon: <GitCommit size={12} /> },
    { id: "diff", label: "Diff", icon: <Eye size={12} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <GitBranch size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Git Automation</h1>
            <p className="text-xs text-[#475569]">Manage repositories and create PRs</p>
          </div>
        </div>
        <GlassButton variant="ghost" icon={<RefreshCw size={14} />} onClick={() => { refreshStatus(); refreshLog(); }}>
          Refresh
        </GlassButton>
      </div>

      {/* Branch Info */}
      {gitInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GlassCard padding="sm">
            <p className="text-[9px] text-[#475569] uppercase tracking-wider mb-1">Branch</p>
            <p className="text-sm text-white font-mono font-bold">{gitInfo.branch}</p>
          </GlassCard>
          <GlassCard padding="sm">
            <p className="text-[9px] text-[#475569] uppercase tracking-wider mb-1">Ahead</p>
            <p className="text-sm font-bold flex items-center gap-1">
              <ArrowUp size={12} className="text-[#22c55e]" />
              <span className="text-[#22c55e]">{gitInfo.ahead}</span>
            </p>
          </GlassCard>
          <GlassCard padding="sm">
            <p className="text-[9px] text-[#475569] uppercase tracking-wider mb-1">Behind</p>
            <p className="text-sm font-bold flex items-center gap-1">
              <ArrowDown size={12} className="text-[#f59e0b]" />
              <span className="text-[#f59e0b]">{gitInfo.behind}</span>
            </p>
          </GlassCard>
          <GlassCard padding="sm">
            <p className="text-[9px] text-[#475569] uppercase tracking-wider mb-1">Changes</p>
            <p className="text-sm font-bold text-white">
              {gitInfo.staged.length + gitInfo.modified.length + gitInfo.untracked.length} files
            </p>
          </GlassCard>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <GlassButton variant="primary" size="sm" icon={<ArrowUp size={12} />} onClick={handlePush} loading={loading}>
          Push
        </GlassButton>
        <GlassButton variant="ghost" size="sm" icon={<ArrowDown size={12} />} onClick={handlePull} loading={loading}>
          Pull
        </GlassButton>
        <GlassButton variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => runGit("branch", { name: prompt("Branch name:") })}>
          New Branch
        </GlassButton>
      </div>

      {/* Working Tree */}
      {gitInfo && (gitInfo.staged.length > 0 || gitInfo.modified.length > 0 || gitInfo.untracked.length > 0) && (
        <GlassCard padding="md">
          <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-3">Working Tree</h3>
          <div className="space-y-1">
            {gitInfo.staged.map((f) => (
              <div key={f} className="flex items-center gap-2 py-1 text-xs">
                <GlassBadge variant="success">staged</GlassBadge>
                <span className="text-[#94a3b8] font-mono truncate">{f}</span>
              </div>
            ))}
            {gitInfo.modified.map((f) => (
              <div key={f} className="flex items-center gap-2 py-1 text-xs">
                <GlassBadge variant="warning">modified</GlassBadge>
                <span className="text-[#94a3b8] font-mono truncate">{f}</span>
              </div>
            ))}
            {gitInfo.untracked.map((f) => (
              <div key={f} className="flex items-center gap-2 py-1 text-xs">
                <GlassBadge variant="default">untracked</GlassBadge>
                <span className="text-[#94a3b8] font-mono truncate">{f}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Commit Input */}
      <GlassCard padding="md">
        <label className="text-xs font-medium text-[#94a3b8] mb-2 block">Commit Message</label>
        <div className="flex gap-2">
          <GlassInput
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder="Describe your changes..."
            onKeyDown={(e) => e.key === "Enter" && handleCommit()}
          />
          <GlassButton variant="primary" icon={<GitCommit size={14} />} onClick={handleCommit} loading={loading} disabled={!commitMsg.trim()}>
            Commit
          </GlassButton>
        </div>
      </GlassCard>

      {/* Tabs: Status / History / Diff */}
      <GlassTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "log" && (
        <div className="space-y-2">
          {commits.length === 0 ? (
            <GlassCard padding="md" className="text-center">
              <p className="text-xs text-[#475569]">No commits found</p>
            </GlassCard>
          ) : (
            commits.map((c) => (
              <GlassCard key={c.hash} padding="sm">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white font-medium truncate">{c.message}</p>
                    <p className="text-[10px] text-[#475569] font-mono mt-0.5">
                      {c.hash.slice(0, 7)} · {c.author} · {new Date(c.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(c.hash)}
                    className="text-[#475569] hover:text-[#6366f1] transition-colors ml-2"
                    title="Copy hash"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {activeTab === "diff" && (
        <GlassCard padding="md">
          {diff ? (
            <pre className="text-[11px] text-[#94a3b8] font-mono whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto">
              {diff}
            </pre>
          ) : (
            <p className="text-xs text-[#475569] text-center py-8">No changes to display</p>
          )}
        </GlassCard>
      )}

      {/* Result Output */}
      {result && (
        <GlassCard padding="md" className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">Output</span>
            <button onClick={() => setResult("")} className="text-[10px] text-[#475569] hover:text-white">Clear</button>
          </div>
          <pre className="text-xs text-[#94a3b8] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{result}</pre>
        </GlassCard>
      )}
    </div>
  );
}
