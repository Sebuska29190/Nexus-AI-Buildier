import { useState, useEffect, useRef } from "react";

interface Account {
  id: string;
  name: string;
  platform: string;
  username?: string;
  createdAt: string;
  lastUsed?: string;
}

export function SocialPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPlatform, setNewPlatform] = useState("tiktok");
  const [newName, setNewName] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) { const d = await res.json(); setAccounts(d.accounts || []); }
    } catch {}
    setLoading(false);
  }

  async function addAccount() {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/social/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, platform: newPlatform }),
      });
      if (res.ok) {
        const d = await res.json();
        setAccounts(prev => [...prev, d.account]);
        setShowAdd(false);
        setNewName("");
        // Automatically launch browser for login
        try {
          const launchRes = await fetch(`/api/social/accounts/${d.account.id}/launch`, { method: "POST" });
          const launchData = await launchRes.json();
          setChatMessage(launchData.message || `✅ **${newName}** account created!\n\n🌐 Browser should open now — log in, then close the browser.`);
        } catch {
          setChatMessage(`✅ **${newName}** added! Say "launch browser for ${newName}" to log in.`);
        }
      }
    } catch {}
  }

  async function removeAccount(id: string) {
    try {
      await fetch(`/api/social/accounts/${id}`, { method: "DELETE" });
      setAccounts(prev => prev.filter(a => a.id !== id));
    } catch {}
  }

  const platformIcons: Record<string, string> = {
    tiktok: "🎵", instagram: "📸", youtube: "▶️", linkedin: "💼",
    facebook: "👍", reddit: "👽", threads: "🧵", pinterest: "📌",
    bluesky: "🦋",
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Social Media Hub</h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect your social accounts and post across platforms
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[10px] font-bold text-[#00f2fe] hover:bg-[#00f2fe]/20 transition-all">
          + Add Account
        </button>
      </div>

      {/* Add Account Form */}
      {showAdd && (
        <div className="glass-panel rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Platform</label>
              <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}
                className="w-full bg-[#020408]/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                <option value="tiktok">🎵 TikTok</option>
                <option value="instagram">📸 Instagram</option>
                <option value="youtube">▶️ YouTube</option>
                <option value="linkedin">💼 LinkedIn</option>
                <option value="facebook">👍 Facebook</option>
                <option value="reddit">👽 Reddit</option>
                <option value="threads">🧵 Threads</option>
                <option value="pinterest">📌 Pinterest</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Account Name</label>
              <input type="text" placeholder="My TikTok channel" value={newName} onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#020408]/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600" />
            </div>
            <div className="flex items-end">
              <button onClick={addAccount} disabled={!newName.trim()}
                className="w-full px-3 py-2 rounded-lg bg-teal-500/20 border border-teal-500/30 text-xs font-bold text-teal-400 hover:bg-teal-500/30 transition-all disabled:opacity-50">
                Create & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Accounts */}
      {loading ? (
        <div className="text-xs text-slate-500 text-center py-12">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🌐</div>
          <p className="text-sm text-slate-400 mb-2">No social accounts connected</p>
          <p className="text-xs text-slate-600">Click "Add Account" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {accounts.map((acc) => (
            <div key={acc.id} className="glass-panel rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#020408]/60 flex items-center justify-center text-lg">
                  {platformIcons[acc.platform] || "🌐"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{acc.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{acc.platform}</div>
                  {acc.username && <div className="text-[10px] text-slate-400">@{acc.username}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setChatMessage(`Pokaż szczegóły konta ${acc.name}`)}
                  className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-all">
                  Info
                </button>
                <button onClick={() => removeAccount(acc.id)}
                  className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-xs font-bold text-white mb-3">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Post to Bluesky", desc: "Write and publish", action: "bsky_post text=..." },
            { label: "Upload TikTok", desc: "Video + description", action: "social_upload_video" },
            { label: "Post to all", desc: "Cross-post everywhere", action: "Post to all connected accounts" },
            { label: "Check Bluesky cron", desc: "See scheduled posts", action: "cron_list" },
          ].map((action) => (
            <button key={action.label} onClick={() => setChatMessage(action.action)}
              className="p-3 rounded-lg bg-[#020408]/40 border border-slate-800 hover:border-[#00f2fe]/30 text-left transition-all">
              <div className="text-xs font-medium text-white">{action.label}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{action.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Agent Chat Mini */}
      {chatMessage && (
        <div ref={chatRef} className="glass-panel rounded-xl p-5 mt-4">
          <h3 className="text-xs font-bold text-white mb-3">💬 Agent Chat</h3>
          <div className="text-xs text-slate-300 whitespace-pre-wrap mb-3">{chatMessage}</div>
          <div className="flex gap-2">
              <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
              className="flex-1 bg-[#020408]/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600" />
            <button onClick={async () => {
              // Copy to clipboard and navigate to chat
              try {
                await navigator.clipboard.writeText(chatMessage);
              } catch {}
              window.dispatchEvent(new CustomEvent("nova-navigate", { detail: "chat" }));
              // Also try to send via localStorage
              try { localStorage.setItem("nova-pending-msg", chatMessage); } catch {}
            }}
              className="px-4 py-2 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[10px] font-bold text-[#00f2fe] hover:bg-[#00f2fe]/20 transition-all">
              Go to Chat (paste Ctrl+V)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
