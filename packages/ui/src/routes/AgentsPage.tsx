import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Play, MessageSquare, Settings, Users } from "lucide-react";
import { EmptyState } from "../lib/components/ui/EmptyState";

/* ───────────────────────── types ───────────────────────── */

interface AgentsPageProps {
  agents?: any[];
  models?: any[];
  onNavigate?: (route: string) => void;
  onRefresh?: () => void;
}

type FilterKey = "all" | "active" | "idle";

/* ───────────────────── animation ───────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

/* ─────────────────────── helpers ────────────────────────── */

function statusColor(status?: string) {
  if (status === "active" || status === "ready") return "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]";
  if (status === "idle" || status === "paused") return "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]";
  return "bg-zinc-500";
}

function statusLabel(status?: string) {
  if (status === "active" || status === "ready") return "Active";
  if (status === "idle" || status === "paused") return "Idle";
  return "Offline";
}

/* ─────────────────── filter definitions ─────────────────── */

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "idle", label: "Idle" },
];

/* ─────────────────────── component ──────────────────────── */

export function AgentsPage({ agents = [], models, onNavigate, onRefresh }: AgentsPageProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  /* ── filtering logic ── */
  const matchesSearch = (a: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.name || "").toLowerCase().includes(q) ||
      (a.description || "").toLowerCase().includes(q) ||
      (a.modelRef || "").toLowerCase().includes(q)
    );
  };

  const matchesFilter = (a: any) => {
    if (filter === "all") return true;
    const s = (a.status || "").toLowerCase();
    if (filter === "active") return s === "active" || s === "ready";
    if (filter === "idle") return s === "idle" || s === "paused";
    return true;
  };

  const filtered = agents.filter((a) => matchesSearch(a) && matchesFilter(a));

  /* ── quick-action handlers (stub — wire to real logic) ── */
  const handleRun = (agent: any) => {
    onNavigate?.(`chat?agent=${agent.id}`);
  };

  const handleChat = (agent: any) => {
    window.dispatchEvent(new CustomEvent("nova-navigate", { detail: "chat" }));
  };

  const handleConfigure = (agent: any) => {
    onNavigate?.(`agents/${agent.id}/settings`);
  };

  /* ──────────────── render ──────────────── */
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ───────── header ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-[rgba(6,182,212,0.15)] to-[rgba(139,92,246,0.15)] border border-[rgba(255,255,255,0.06)]">
            <Users size={18} className="text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold text-[#E4E4E7] tracking-tight">Agents</h1>
          <span className="inline-flex items-center justify-center h-5 min-w-[1.5rem] px-1.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/20">
            {agents.length}
          </span>
        </div>

        <button
          onClick={() => onNavigate?.("agents/new")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500
            shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_28px_rgba(6,182,212,0.4)]
            transition-all duration-200 active:scale-[0.97]"
        >
          <Plus size={16} />
          Create Agent
        </button>
      </div>

      {/* ───────── search + filter bar ───────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name, model, or description…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-[#E4E4E7] placeholder-[#52525B]
              bg-white/[0.04] border border-white/[0.06] backdrop-blur-md
              focus:outline-none focus:border-cyan-500/40 focus:shadow-[0_0_12px_rgba(6,182,212,0.12)]
              transition-all duration-200"
          />
        </div>

        {/* filter pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md self-start">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                filter === f.key
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.12)]"
                  : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.04]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ───────── agent grid / empty state ───────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={search || filter !== "all" ? "No agents match your filters" : "No agents yet"}
          description={
            search || filter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Create your first agent to get started with AgentForge."
          }
          action={
            !search && filter === "all" ? (
              <button
                onClick={() => onNavigate?.("agents/new")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
                  bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500
                  shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-200"
              >
                <Plus size={16} />
                Create Agent
              </button>
            ) : undefined
          }
          size="md"
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((agent) => (
            <motion.div key={agent.id} variants={cardItem}>
              <div
                className="group relative flex flex-col gap-4 p-5 rounded-2xl
                  bg-white/[0.03] border border-white/[0.06] backdrop-blur-md
                  hover:border-cyan-500/30 hover:shadow-[0_0_24px_rgba(6,182,212,0.10)]
                  hover:-translate-y-0.5 transition-all duration-300 cursor-default"
              >
                {/* top row: avatar + name + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* emoji avatar */}
                    <div className="flex items-center justify-center h-11 w-11 rounded-xl shrink-0
                      bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/[0.06]
                      text-xl select-none">
                      {agent.emoji || "🤖"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#E4E4E7] truncate">{agent.name}</h3>
                        {/* status dot */}
                        <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${statusColor(agent.status)}`} />
                      </div>
                      {/* model badge */}
                      {agent.modelRef && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-[#A1A1AA]
                          bg-white/[0.04] border border-white/[0.06] truncate max-w-[180px]">
                          {agent.modelRef}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* description */}
                <p className="text-xs leading-relaxed text-[#71717A] line-clamp-2">
                  {agent.description || "No description provided."}
                </p>

                {/* tags */}
                {agent.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {agent.skills.slice(0, 4).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium text-violet-300
                          bg-violet-500/10 border border-violet-500/15"
                      >
                        {tag}
                      </span>
                    ))}
                    {agent.skills.length > 4 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] text-[#52525B]">
                        +{agent.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* divider */}
                <div className="h-px bg-white/[0.04]" />

                {/* quick actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRun(agent)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium
                      text-cyan-300 bg-cyan-500/10 border border-cyan-500/15
                      hover:bg-cyan-500/20 hover:border-cyan-500/25 hover:shadow-[0_0_12px_rgba(6,182,212,0.12)]
                      transition-all duration-200"
                  >
                    <Play size={13} />
                    Run
                  </button>
                  <button
                    onClick={() => handleChat(agent)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium
                      text-violet-300 bg-violet-500/10 border border-violet-500/15
                      hover:bg-violet-500/20 hover:border-violet-500/25 hover:shadow-[0_0_12px_rgba(139,92,246,0.12)]
                      transition-all duration-200"
                  >
                    <MessageSquare size={13} />
                    Chat
                  </button>
                  <button
                    onClick={() => handleConfigure(agent)}
                    className="flex items-center justify-center h-9 w-9 rounded-xl
                      text-[#71717A] bg-white/[0.03] border border-white/[0.06]
                      hover:text-[#E4E4E7] hover:bg-white/[0.06] hover:border-white/[0.10]
                      transition-all duration-200"
                    title="Configure"
                  >
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
