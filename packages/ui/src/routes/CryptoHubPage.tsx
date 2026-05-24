import { useState, useEffect } from "react";

export function CryptoHubPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [coinSearch, setCoinSearch] = useState("");
  const [coinDetail, setCoinDetail] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [alertForm, setAlertForm] = useState({ symbol: "", type: "above", value: 0, message: "" });
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [posForm, setPosForm] = useState({ symbol: "", amount: 0, buyPrice: 0, notes: "" });

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true); setError("");
    try {
      const [dRes, pRes, aRes] = await Promise.allSettled([
        fetch("/api/crypto-hub/dashboard").then(r => r.ok ? r.json() : null),
        fetch("/api/crypto-hub/portfolio").then(r => r.ok ? r.json() : null),
        fetch("/api/crypto-hub/alerts").then(r => r.ok ? r.json() : null),
      ]);
      if (dRes.status === "fulfilled" && dRes.value) setData(dRes.value);
      if (pRes.status === "fulfilled" && pRes.value) setPortfolio(pRes.value);
      if (aRes.status === "fulfilled" && aRes.value) setAlerts(aRes.value.alerts || []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  async function searchCoin() {
    if (!coinSearch.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crypto-hub/coin/${coinSearch.trim().toUpperCase()}`);
      if (res.ok) setCoinDetail(await res.json());
    } catch {}
    setLoading(false);
  }

  async function addAlert() {
    if (!alertForm.symbol.trim()) return;
    try {
      await fetch("/api/crypto-hub/alerts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertForm),
      });
      setShowAddAlert(false);
      setAlertForm({ symbol: "", type: "above", value: 0, message: "" });
      const r = await fetch("/api/crypto-hub/alerts");
      if (r.ok) setAlerts((await r.json()).alerts || []);
    } catch {}
  }

  async function removeAlert(id: string) {
    try { await fetch(`/api/crypto-hub/alerts/${id}`, { method: "DELETE" }); setAlerts(alerts.filter(a => a.id !== id)); } catch {}
  }

  async function addPosition() {
    if (!posForm.symbol.trim() || !posForm.amount || !posForm.buyPrice) return;
    try {
      await fetch("/api/crypto-hub/portfolio", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(posForm),
      });
      setShowAddPosition(false);
      setPosForm({ symbol: "", amount: 0, buyPrice: 0, notes: "" });
      const r = await fetch("/api/crypto-hub/portfolio");
      if (r.ok) setPortfolio(await r.json());
    } catch {}
  }

  async function removePosition(id: string) {
    try {
      await fetch(`/api/crypto-hub/portfolio/${id}`, { method: "DELETE" });
      const r = await fetch("/api/crypto-hub/portfolio");
      if (r.ok) setPortfolio(await r.json());
    } catch {}
  }

  function signalBadge(signal: string) {
    if (signal === "BUY") return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    if (signal === "SELL") return "bg-red-500/20 text-red-400 border border-red-500/30";
    if (signal === "WEAK_BUY") return "bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20";
    if (signal === "WEAK_SELL") return "bg-red-500/10 text-red-400/70 border border-red-500/20";
    return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Crypto Hub V2</h2>
            <p className="text-[10px] text-slate-500">Real-time dashboard, trading signals, alerts & portfolio</p>
          </div>
        </div>
        <button onClick={refresh} className="text-[10px] text-[#00f2fe] hover:underline">Refresh</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {["dashboard", "analysis", "alerts", "portfolio"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-[10px] px-3 py-1.5 rounded-lg border capitalize ${tab === t ? "border-[#00f2fe] bg-[#00f2fe]/10 text-[#00f2fe]" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}>
            {t === "dashboard" ? "🔥 Dashboard" : t === "analysis" ? "📊 Analysis" : t === "alerts" ? "🔔 Alerts" : "💼 Portfolio"}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12"><span className="w-5 h-5 border-2 border-[#00f2fe] border-t-transparent rounded-full animate-spin inline-block"></span></div>}

      {/* ═══ DASHBOARD ═══ */}
      {tab === "dashboard" && data && (
        <div className="space-y-4">
          {/* BTC Overview */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800/60">
            <div className="grid grid-cols-4 gap-4">
              <div><p className="text-[9px] text-slate-500 uppercase">BTC</p><p className="text-sm font-bold text-white">${(data.btcPrice || 0).toLocaleString()}</p></div>
              <div><p className="text-[9px] text-slate-500 uppercase">ETH</p><p className="text-sm font-bold text-white">${(data.ethPrice || 0).toLocaleString()}</p></div>
              <div><p className="text-[9px] text-slate-500 uppercase">BTC Dominance</p><p className="text-sm font-bold text-white">{data.btcDominance}%</p></div>
              <div><p className="text-[9px] text-slate-500 uppercase">Total Market Cap</p><p className="text-sm font-bold text-white">${(data.totalMarketCap ? data.totalMarketCap / 1e12 : 0).toFixed(2)}T</p></div>
            </div>
          </div>

          {/* Signals Table */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] text-slate-400 uppercase tracking-wider">Trading Signals</h3>
              <div className="flex gap-2 text-[9px]">
                <span className="text-emerald-400">🟢 BUY</span>
                <span className="text-amber-400">🟡 HOLD</span>
                <span className="text-red-400">🔴 SELL</span>
              </div>
            </div>
            <div className="space-y-1">
              {data.signals?.map((s: any) => (
                <div key={s.symbol} className="flex items-center gap-3 py-1.5 border-b border-slate-800/40 last:border-0">
                  {s.image && <img src={s.image} className="w-5 h-5 rounded-full" alt={s.symbol} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white font-medium">{s.symbol} <span className="text-[9px] text-slate-500">{s.name}</span></p>
                  </div>
                  <span className="text-[10px] text-white font-mono w-20 text-right">${(s.price || 0).toLocaleString()}</span>
                  <span className={`text-[9px] font-mono w-14 text-right ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {s.change24h >= 0 ? "+" : ""}{s.change24h?.toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-slate-400 w-8 text-right">RSI:{s.rsi}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${signalBadge(s.signal)}`}>
                    {s.signal === "BUY" ? "🟢 BUY" : s.signal === "SELL" ? "🔴 SELL" : s.signal === "WEAK_BUY" ? "🟢" : s.signal === "WEAK_SELL" ? "🔴" : "⚪ HOLD"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gainers / Losers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel rounded-xl p-4 border border-slate-800/60">
              <h3 className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">🚀 Top Gainers</h3>
              {data.gainers?.map((c: any) => (
                <div key={c.id} className="flex justify-between py-1 text-[10px]">
                  <span className="text-white">{c.symbol?.toUpperCase()}</span>
                  <span className="text-emerald-400">+{c.price_change_percentage_24h?.toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="glass-panel rounded-xl p-4 border border-slate-800/60">
              <h3 className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">📉 Top Losers</h3>
              {data.losers?.map((c: any) => (
                <div key={c.id} className="flex justify-between py-1 text-[10px]">
                  <span className="text-white">{c.symbol?.toUpperCase()}</span>
                  <span className="text-red-400">{c.price_change_percentage_24h?.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ ANALYSIS ═══ */}
      {tab === "analysis" && (
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-4 border border-slate-800/60">
            <div className="flex gap-2">
              <input type="text" value={coinSearch} onChange={(e) => setCoinSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchCoin()}
                placeholder="Search coin (e.g. BTC, ETH, SOL)..."
                className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              <button onClick={searchCoin} className="btn-premium px-4 py-2 rounded-lg text-xs">Search</button>
            </div>
          </div>
          {coinDetail && !coinDetail.error && (
            <div className="glass-panel rounded-xl p-4 border border-slate-800/60">
              <div className="flex items-center gap-3 mb-4">
                {coinDetail.image && <img src={coinDetail.image} className="w-8 h-8 rounded-full" alt={coinDetail.symbol} />}
                <div>
                  <h3 className="text-sm font-bold text-white">{coinDetail.name} <span className="text-[10px] text-slate-400">${coinDetail.symbol}</span></h3>
                  <p className="text-lg font-bold text-white">${(coinDetail.price || 0).toLocaleString()}</p>
                </div>
                <span className={`ml-auto text-[11px] px-2 py-1 rounded-lg font-bold ${signalBadge(coinDetail.signal)}`}>
                  {coinDetail.signal === "BUY" ? "🟢 BUY" : coinDetail.signal === "SELL" ? "🔴 SELL" : "⚪ HOLD"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-[10px]">
                <div><span className="text-slate-500">24h Change</span><p className={`font-medium ${coinDetail.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>{coinDetail.change24h?.toFixed(2)}%</p></div>
                <div><span className="text-slate-500">RSI (14)</span><p className="text-white font-medium">{coinDetail.rsi}</p></div>
                <div><span className="text-slate-500">Signal</span><p className="text-white font-medium capitalize">{coinDetail.signal?.replace("_", " ")}</p></div>
                <div><span className="text-slate-500">SMA 7</span><p className="text-white">${coinDetail.sma7?.toLocaleString() || "—"}</p></div>
                <div><span className="text-slate-500">SMA 25</span><p className="text-white">${coinDetail.sma25?.toLocaleString() || "—"}</p></div>
                <div><span className="text-slate-500">MACD</span><p className={`font-medium ${(coinDetail.macd || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{coinDetail.macd?.toFixed(2) || "—"}</p></div>
              </div>
            </div>
          )}
          {coinDetail?.error && <p className="text-xs text-red-400 text-center py-4">{coinDetail.error}</p>}
        </div>
      )}

      {/* ═══ ALERTS ═══ */}
      {tab === "alerts" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] text-slate-400 uppercase tracking-wider">Price Alerts</h3>
            <button onClick={() => setShowAddAlert(!showAddAlert)} className="btn-premium px-3 py-1 rounded-lg text-[10px]">+ Add Alert</button>
          </div>
          {showAddAlert && (
            <div className="glass-panel rounded-xl p-4 border border-[#00f2fe]/20 space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <input type="text" placeholder="Symbol (BTC)" value={alertForm.symbol} onChange={(e) => setAlertForm({...alertForm, symbol: e.target.value})}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white" />
                <select value={alertForm.type} onChange={(e) => setAlertForm({...alertForm, type: e.target.value})}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white">
                  <option value="above">Price Above</option>
                  <option value="below">Price Below</option>
                  <option value="rsi_above">RSI Above</option>
                  <option value="rsi_below">RSI Below</option>
                </select>
                <input type="number" placeholder="Value" value={alertForm.value} onChange={(e) => setAlertForm({...alertForm, value: Number(e.target.value)})}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white" />
                <button onClick={addAlert} className="btn-premium px-3 py-1.5 rounded-lg text-[10px]">Create</button>
              </div>
            </div>
          )}
          {alerts.length === 0 ? (
            <p className="text-[11px] text-slate-600 text-center py-8">No alerts. Create one to get notified when price hits your target.</p>
          ) : (
            alerts.map((a: any) => (
              <div key={a.id} className="glass-panel rounded-xl p-3 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔔</span>
                  <div>
                    <p className="text-[11px] text-white font-medium">{a.symbol} {a.type === "above" ? ">=" : a.type === "below" ? "<=" : a.type === "rsi_above" ? "RSI >=" : "RSI <="} {a.value}</p>
                    <p className="text-[9px] text-slate-500">{a.message || "No message"} · Triggered: {a.triggered || 0}x</p>
                  </div>
                </div>
                <button onClick={() => removeAlert(a.id)} className="text-slate-500 hover:text-red-400 text-[9px]">✕</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ PORTFOLIO ═══ */}
      {tab === "portfolio" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] text-slate-400 uppercase tracking-wider">Portfolio</h3>
            <button onClick={() => setShowAddPosition(!showAddPosition)} className="btn-premium px-3 py-1 rounded-lg text-[10px]">+ Add Position</button>
          </div>
          {portfolio && (
            <div className="glass-panel rounded-xl p-4 border border-slate-800/60">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><p className="text-[9px] text-slate-500">Total Invested</p><p className="text-sm font-bold text-white">${(portfolio.totalInvested || 0).toLocaleString()}</p></div>
                <div><p className="text-[9px] text-slate-500">Current Value</p><p className="text-sm font-bold text-white">${(portfolio.totalValue || 0).toLocaleString()}</p></div>
                <div><p className="text-[9px] text-slate-500">P&L</p><p className={`text-sm font-bold ${(portfolio.totalPnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {(portfolio.totalPnl || 0) >= 0 ? "+" : ""}${(portfolio.totalPnl || 0).toLocaleString()} ({(portfolio.totalPnlPercent || 0) >= 0 ? "+" : ""}{portfolio.totalPnlPercent}%)
                </p></div>
              </div>
            </div>
          )}
          {showAddPosition && (
            <div className="glass-panel rounded-xl p-4 border border-[#00f2fe]/20 space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <input type="text" placeholder="Symbol (BTC)" value={posForm.symbol} onChange={(e) => setPosForm({...posForm, symbol: e.target.value})}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white" />
                <input type="number" placeholder="Amount" value={posForm.amount} onChange={(e) => setPosForm({...posForm, amount: Number(e.target.value)})}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white" />
                <input type="number" placeholder="Buy Price $" value={posForm.buyPrice} onChange={(e) => setPosForm({...posForm, buyPrice: Number(e.target.value)})}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white" />
                <button onClick={addPosition} className="btn-premium px-3 py-1.5 rounded-lg text-[10px]">Add</button>
              </div>
            </div>
          )}
          {portfolio?.entries?.length > 0 ? (
            <div className="space-y-1.5">
              {portfolio.entries.map((e: any) => (
                <div key={e.id} className="glass-panel rounded-xl p-3 border border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{e.symbol === "BTC" ? "₿" : "🪙"}</span>
                    <div>
                      <p className="text-[11px] text-white font-medium">{e.symbol} · {e.amount} coins</p>
                      <p className="text-[9px] text-slate-500">Buy: ${e.buy_price} · Current: ${(e.currentPrice || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-medium ${e.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {e.pnl >= 0 ? "+" : ""}${(e.pnl || 0).toLocaleString()}
                    </p>
                    <p className={`text-[9px] ${e.pnlPercent >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>({e.pnlPercent}%)</p>
                  </div>
                  <button onClick={() => removePosition(e.id)} className="text-slate-500 hover:text-red-400 text-[9px] ml-2">✕</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-600 text-center py-8">No positions. Add your crypto holdings to track P&L.</p>
          )}
        </div>
      )}
    </div>
  );
}
