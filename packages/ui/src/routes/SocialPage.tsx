import { useState, useEffect } from "react";

interface Account {
  id: string; name: string; platform: string;
  authMethod: "browser" | "api_key";
  authStatus: "pending" | "connected" | "error";
  username?: string; createdAt: string; lastUsed?: string;
  errorMessage?: string;
}

interface PlatformDef {
  id: string; name: string; icon: string;
  authMethod: "browser" | "api_key";
  loginUrl?: string;
  apiFields?: { key: string; label: string; type: string; required: boolean }[];
}

interface PostEntry {
  id: string; text: string; platforms: string[];
  status: "draft" | "published" | "error";
  error?: string; createdAt: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  bluesky: "🦋", x: "🐦", tiktok: "🎵", instagram: "📸",
  youtube: "▶️", linkedin: "💼", facebook: "👍", reddit: "👽", threads: "🧵",
};

function loadPostHistory(): PostEntry[] {
  try {
    const raw = localStorage.getItem("nova-social-posts");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePostHistory(posts: PostEntry[]) {
  try { localStorage.setItem("nova-social-posts", JSON.stringify(posts.slice(0, 100))); } catch {}
}

export function SocialPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [platformDefs, setPlatformDefs] = useState<PlatformDef[]>([]);
  const [loading, setLoading] = useState(true);

  // Add account
  const [showAdd, setShowAdd] = useState(false);
  const [newPlatform, setNewPlatform] = useState("bluesky");
  const [newName, setNewName] = useState("");
  const [apiConfig, setApiConfig] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);

  // Compose
  const [composeText, setComposeText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["bluesky"]);
  const [publishing, setPublishing] = useState(false);

  // Post history
  const [postHistory, setPostHistory] = useState<PostEntry[]>(loadPostHistory);

  // Messages
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadAll();
    refreshPostHistory();
  }, []);

  useEffect(() => { savePostHistory(postHistory); }, [postHistory]);

  function msg(m: string, type: "error" | "success") {
    if (type === "error") { setErrorMsg(m); setSuccessMsg(""); }
    else { setSuccessMsg(m); setErrorMsg(""); }
    setTimeout(() => { setErrorMsg(""); setSuccessMsg(""); }, 5000);
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [aRes, pRes] = await Promise.all([
        fetch("/api/social/accounts"),
        fetch("/api/social/platforms"),
      ]);
      if (aRes.ok) setAccounts((await aRes.json()).accounts || []);
      if (pRes.ok) setPlatformDefs((await pRes.json()).platforms || []);
    } catch {}
    setLoading(false);
  }

  // ─── Account Management ──────────────────────────────────────

  const platDef = platformDefs.find(p => p.id === newPlatform);
  const isApiPlatform = platDef?.authMethod === "api_key";

  async function addAccount() {
    if (!newName.trim()) return;
    setConnecting(true);
    try {
      const body: any = { name: newName, platform: newPlatform };
      if (isApiPlatform) body.apiConfig = apiConfig;

      const res = await fetch("/api/social/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();

      // If API platform, verify immediately
      if (isApiPlatform) {
        const vRes = await fetch(`/api/social/accounts/${d.account.id}/connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiConfig }),
        });
        const vData = await vRes.json();
        if (vData.ok) {
          msg(`✅ Connected to ${newName} as @${vData.username}`, "success");
        } else {
          msg(`❌ ${vData.error || "Verification failed"}`, "error");
        }
      } else {
        msg(`✅ ${newName} added! Opening browser for login...`, "success");
        // Auto-launch browser
        launchBrowser(d.account.id);
      }

      setShowAdd(false);
      setNewName("");
      setApiConfig({});
      await loadAll();
    } catch (e: any) { msg(e.message || "Failed to add", "error"); }
    setConnecting(false);
  }

  async function removeAccount(id: string) {
    try {
      await fetch(`/api/social/accounts/${id}`, { method: "DELETE" });
      setAccounts(prev => prev.filter(a => a.id !== id));
    } catch {}
  }

  async function launchBrowser(id: string) {
    try {
      const res = await fetch(`/api/social/accounts/${id}/launch`, { method: "POST" });
      const data = await res.json();
      if (data.error) { msg(`❌ ${data.error}`, "error"); return; }
      msg(data.message || "🌐 Opening browser...", "success");
    } catch (e: any) { msg(`❌ ${e.message}`, "error"); }
  }

  async function verifyLogin(id: string) {
    try {
      const res = await fetch(`/api/social/accounts/${id}/verify`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        msg("✅ Login verified! Account is connected.", "success");
        await loadAll();
      } else {
        msg(`❌ ${data.error || "Login not detected. Try again after logging in."}`, "error");
      }
    } catch (e: any) { msg(`❌ ${e.message}`, "error"); }
  }

  async function reconnectApi(id: string) {
    try {
      const res = await fetch(`/api/social/accounts/${id}/connect`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        msg(`✅ Reconnected! @${data.username}`, "success");
        await loadAll();
      } else {
        msg(`❌ ${data.error || "Reconnect failed"}`, "error");
      }
    } catch (e: any) { msg(`❌ ${e.message}`, "error"); }
  }

  // ─── Posting ──────────────────────────────────────────────────

  function refreshPostHistory() { setPostHistory(loadPostHistory()); }

  function togglePlatform(pid: string) {
    setSelectedPlatforms(prev =>
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );
  }

  async function publishPost() {
    if (!composeText.trim()) { msg("Write something to post", "error"); return; }
    if (selectedPlatforms.length === 0) { msg("Select at least one platform", "error"); return; }
    setPublishing(true);

    const results: string[] = [];
    let allOk = true;

    for (const platform of selectedPlatforms) {
      const acc = accounts.find(a => a.platform === platform && a.authStatus === "connected");
      if (!acc) {
        results.push(`${PLATFORM_ICONS[platform] || "🌐"} ${platform}: no connected account`);
        allOk = false;
        continue;
      }

      if (platform === "bluesky") {
        try {
          const res = await fetch("/api/agent/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agentId: "cron-worker",
              message: `Post this to Bluesky (using bsky_post tool): ${composeText.trim()}`,
            }),
          });
          if (res.ok) results.push(`🦋 Bluesky: ✅ posted`);
          else { results.push(`🦋 Bluesky: ❌ ${await res.text()}`); allOk = false; }
        } catch (e: any) { results.push(`🦋 Bluesky: ❌ ${e.message}`); allOk = false; }
      } else if (acc.authMethod === "browser") {
        try {
          const res = await fetch(`/api/social/accounts/${acc.id}/launch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "post", text: composeText.trim() }),
          });
          const data = await res.json();
          results.push(`${PLATFORM_ICONS[platform] || "🌐"} ${platform}: ${data.message || "opened browser"}`);
        } catch (e: any) { results.push(`${PLATFORM_ICONS[platform] || "🌐"} ${platform}: ❌ ${e.message}`); allOk = false; }
      } else {
        results.push(`${PLATFORM_ICONS[platform] || "🌐"} ${platform}: API posting not implemented yet`);
        allOk = false;
      }
    }

    const post: PostEntry = {
      id: Date.now().toString(36),
      text: composeText.trim(),
      platforms: [...selectedPlatforms],
      status: allOk ? "published" : "error",
      error: results.filter(r => r.includes("❌")).join("; "),
      createdAt: new Date().toISOString(),
    };
    setPostHistory(prev => [post, ...prev]);
    setComposeText("");
    if (allOk) msg("✅ " + results.join(" | "), "success");
    else msg("⚠️ " + results.join(" | "), "error");
    setPublishing(false);
  }

  const connectedPlatforms = new Set(accounts.filter(a => a.authStatus === "connected").map(a => a.platform));

  function statusBadge(acc: Account) {
    if (acc.authStatus === "connected") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
    if (acc.authStatus === "error") return "bg-red-500/15 text-red-400 border-red-500/25";
    return "bg-amber-500/15 text-amber-400 border-amber-500/25";
  }

  function authIcon(acc: Account) {
    if (acc.authStatus === "connected") return "✅";
    if (acc.authStatus === "error") return "❌";
    return "⏳";
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 flex items-center justify-center text-lg">🌐</div>
          <div>
            <h2 className="text-lg font-bold text-white">Social Media Hub</h2>
            <p className="text-[10px] text-slate-500">Compose, publish, and manage your social accounts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800">
            {accounts.filter(a => a.authStatus === "connected").length} connected
          </span>
          <button onClick={() => { setShowAdd(!showAdd); setApiConfig({}); }}
            className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-[10px] font-bold text-sky-400 hover:bg-sky-500/20 transition-all">
            + Add Account
          </button>
        </div>
      </div>

      {errorMsg && <div className="glass-panel rounded-xl p-3 mb-4 border border-red-500/30 bg-red-950/20"><p className="text-[11px] text-red-400">{errorMsg}</p></div>}
      {successMsg && <div className="glass-panel rounded-xl p-3 mb-4 border border-emerald-500/30 bg-emerald-950/20"><p className="text-[11px] text-emerald-400">{successMsg}</p></div>}

      {/* Add Account */}
      {showAdd && (
        <div className="glass-panel rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Platform</label>
              <select value={newPlatform} onChange={(e) => { setNewPlatform(e.target.value); setApiConfig({}); }}
                className="w-full bg-[#020408]/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                {platformDefs.map(p => (
                  <optgroup key={p.authMethod} label={p.authMethod === "api_key" ? "🔑 API Login" : "🌐 Browser Login"}>
                    <option value={p.id}>{p.icon} {p.name} — {p.authMethod === "api_key" ? "App Password" : "Browser"}</option>
                  </optgroup>
                ))}
              </select>
              <p className="text-[9px] text-slate-600 mt-1">
                {isApiPlatform
                  ? "🔑 Enter API credentials below — no browser needed"
                  : "🌐 Browser will open for you to log in manually (once)"}
              </p>
            </div>
            <div>
              <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Account Name</label>
              <input type="text" placeholder="e.g. My Bluesky" value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#020408]/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600" />
            </div>
          </div>

          {/* API fields for api_key platforms */}
          {isApiPlatform && platDef?.apiFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {platDef.apiFields.map(field => (
                <div key={field.key}>
                  <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <input type={field.type} value={apiConfig[field.key] || ""}
                    onChange={(e) => setApiConfig({ ...apiConfig, [field.key]: e.target.value })}
                    placeholder={field.label}
                    className="w-full bg-[#020408]/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600" />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
            <button onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 rounded-lg text-[10px] text-slate-400 border border-slate-800 hover:bg-slate-900 transition-all">Cancel</button>
            <button onClick={addAccount} disabled={!newName.trim() || connecting || (isApiPlatform && platDef?.apiFields?.some(f => f.required && !apiConfig[f.key]))}
              className="btn-premium px-4 py-1.5 rounded-lg text-[10px] disabled:opacity-40 flex items-center gap-1.5">
              {connecting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connecting...</> : `Connect ${platDef?.icon || ""}`}
            </button>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Compose */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5">
          <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Compose & Publish
          </h3>
          <textarea value={composeText} onChange={(e) => setComposeText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-[#020408]/60 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 min-h-[120px] resize-y" />
          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-wrap gap-1.5">
              {platformDefs.map(p => {
                const active = selectedPlatforms.includes(p.id);
                const connected = connectedPlatforms.has(p.id);
                return (
                  <button key={p.id} onClick={() => togglePlatform(p.id)}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      active
                        ? connected
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        : "border-slate-800 text-slate-500 hover:text-white hover:border-slate-600"
                    }`}>
                    {p.icon} {p.name}
                    {active && !connected && <span className="text-[8px]">⚠️</span>}
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] text-slate-600 font-mono">{composeText.length}/300</span>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
            <div className="text-[10px] text-slate-500">
              {selectedPlatforms.length === 0 ? "Select platforms above" : `${selectedPlatforms.length} platform(s)`}
            </div>
            <button onClick={publishPost} disabled={publishing || !composeText.trim() || selectedPlatforms.length === 0}
              className="px-5 py-2 rounded-lg bg-sky-500/20 border border-sky-500/30 text-xs font-bold text-sky-400 hover:bg-sky-500/30 transition-all disabled:opacity-40 flex items-center gap-1.5">
              {publishing ? <><span className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /> Publishing...</>
                : <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg> Publish</>}
            </button>
          </div>
        </div>

        {/* Accounts Panel */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Accounts
          </h3>
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-6">Loading...</p>
          ) : accounts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500 mb-2">No accounts yet</p>
              <button onClick={() => setShowAdd(true)}
                className="text-[10px] text-sky-400 hover:underline">+ Add your first account</button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {accounts.map(acc => (
                <div key={acc.id} className="p-2 bg-[#020408]/40 rounded-lg border border-slate-800/50 group">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{PLATFORM_ICONS[acc.platform] || "🌐"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] text-white font-medium truncate">{acc.name}</p>
                        <span className={`text-[8px] px-1 py-0.5 rounded border ${statusBadge(acc)}`}>
                          {authIcon(acc)} {acc.authStatus}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500">
                        {acc.platform}
                        {acc.username ? ` • @${acc.username}` : ""}
                        {acc.authMethod === "api_key" ? " 🔑" : " 🌐"}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons per auth type */}
                  <div className="flex gap-1 mt-1.5 pl-7">
                    {acc.authMethod === "api_key" && acc.authStatus !== "connected" && (
                      <button onClick={() => reconnectApi(acc.id)}
                        className="text-[9px] px-2 py-0.5 rounded bg-sky-900/20 text-sky-400 hover:bg-sky-900/40 transition-all">
                        Reconnect
                      </button>
                    )}
                    {acc.authMethod === "browser" && (
                      <>
                        <button onClick={() => launchBrowser(acc.id)}
                          className="text-[9px] px-2 py-0.5 rounded bg-sky-900/20 text-sky-400 hover:bg-sky-900/40 transition-all">
                          🌐 Open Browser
                        </button>
                        {acc.authStatus !== "connected" && (
                          <button onClick={() => verifyLogin(acc.id)}
                            className="text-[9px] px-2 py-0.5 rounded bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40 transition-all">
                            ✅ Verify Login
                          </button>
                        )}
                      </>
                    )}
                    {acc.errorMessage && (
                      <span className="text-[8px] text-red-400 truncate max-w-[120px]" title={acc.errorMessage}>
                        {acc.errorMessage}
                      </span>
                    )}
                    <button onClick={() => removeAccount(acc.id)}
                      className="text-[9px] px-2 py-0.5 rounded bg-red-950/20 text-red-400 hover:bg-red-950/40 transition-all ml-auto">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post History */}
      <div className="glass-panel rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Post History
          </h3>
          <button onClick={refreshPostHistory} className="text-[9px] text-slate-500 hover:text-white">Refresh</button>
        </div>
        {postHistory.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No posts yet.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {postHistory.map(post => (
              <div key={post.id} className="flex items-start gap-3 p-3 bg-[#020408]/40 rounded-lg border border-slate-800/50">
                <div className="flex gap-1 flex-wrap mt-0.5 min-w-[60px]">
                  {post.platforms.map(p => <span key={p} className="text-xs">{PLATFORM_ICONS[p] || "🌐"}</span>)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-2">{post.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                      post.status === "published" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                    }`}>{post.status}</span>
                    <span className="text-[9px] text-slate-600">
                      {new Date(post.createdAt).toLocaleDateString()} {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {post.error && <p className="text-[9px] text-red-400 mt-0.5">{post.error}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{accounts.filter(a => a.authStatus === "connected").length}</div>
          <div className="text-[9px] text-slate-500 mt-1">Connected</div>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{postHistory.filter(p => p.status === "published").length}</div>
          <div className="text-[9px] text-slate-500 mt-1">Posts Published</div>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{connectedPlatforms.size}</div>
          <div className="text-[9px] text-slate-500 mt-1">Platforms</div>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{platformDefs.length}</div>
          <div className="text-[9px] text-slate-500 mt-1">Available</div>
        </div>
      </div>
    </div>
  );
}
