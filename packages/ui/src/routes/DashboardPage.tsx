import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Users,
  Terminal,
  Code,
  Settings,
  BookOpen,
  Activity,
  Clock,
  Cpu,
  Zap,
  TrendingUp,
  ChevronRight,
  Layers,
} from "lucide-react";
import { AnimatedCounter } from "../lib/components/ui/AnimatedCounter";
import { Card } from "../lib/components/ui/Card";

/* ────────────────────────────────────────────────
   Props — kept compatible with App.tsx wiring
   ──────────────────────────────────────────────── */
interface DashboardPageProps {
  sessions?: any[];
  agents?: any[];
  models?: any[];
  health?: any;
  connected?: boolean;
  onNavigate?: (route: string) => void;
  onRefresh?: () => void;
}

/* ────────────────────────────────────────────────
   Framer-motion presets
   ──────────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

/* ────────────────────────────────────────────────
   Glass helper style
   ──────────────────────────────────────────────── */
const glass =
  "bg-[rgba(17,17,20,0.6)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.06)] rounded-xl";

/* ────────────────────────────────────────────────
   Data
   ──────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "New Chat", icon: MessageSquare, route: "chat", gradient: "from-cyan-500 to-violet-500" },
  { label: "Browse Agents", icon: Users, route: "agents", gradient: "from-violet-500 to-fuchsia-500" },
  { label: "Terminal", icon: Terminal, route: "terminal", gradient: "from-emerald-500 to-cyan-500" },
  { label: "Code Editor", icon: Code, route: "editor", gradient: "from-cyan-500 to-blue-500" },
  { label: "Settings", icon: Settings, route: "settings", gradient: "from-slate-400 to-violet-500" },
  { label: "Docs", icon: BookOpen, route: "docs", gradient: "from-amber-400 to-orange-500" },
];

/* ────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  color,
  delay,
}: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  trend?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div variants={item}>
      <Card
        variant="default"
        padding="md"
        className="group relative overflow-hidden"
      >
        {/* subtle gradient glow */}
        <div
          className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20`}
        />

        <div className="flex items-start justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${color} shadow-lg`}
          >
            <Icon size={18} className="text-white" />
          </div>
          {trend && (
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-400">
              <TrendingUp size={12} />
              {trend}
            </span>
          )}
        </div>

        <div className="mt-3">
          <AnimatedCounter
            value={value}
            suffix={suffix}
            duration={1400}
            className="text-3xl font-bold text-white"
          />
          <p className="mt-1 text-xs text-[#A1A1AA]">{label}</p>
        </div>
      </Card>
    </motion.div>
  );
}

function QuickActionCard({
  label,
  icon: Icon,
  gradient,
  onClick,
}: {
  label: string;
  icon: any;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <motion.div variants={item}>
      <button
        onClick={onClick}
        className={`group relative flex w-full flex-col items-center gap-3 ${glass} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(255,255,255,0.12)] hover:shadow-[0_8px_40px_rgba(6,182,212,0.12)]`}
      >
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon size={20} className="text-white" />
        </div>
        <span className="text-sm font-medium text-[#E4E4E7] group-hover:text-white transition-colors">
          {label}
        </span>
      </button>
    </motion.div>
  );
}

function RecentActivityRow({ session }: { session: any }) {
  const model = session.modelRef || session.model || "unknown";
  const shortModel = model.includes("/") ? model.split("/").pop() : model;
  const time = session.updatedAt || session.createdAt;
  const relative = time ? getRelativeTime(new Date(time)) : "";

  return (
    <motion.div variants={item}>
      <button
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent("nova-resume-session", { detail: { sessionId: session.id } })
          );
        }}
        className={`group flex w-full items-center justify-between ${glass} p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.12)] hover:shadow-[0_4px_24px_rgba(6,182,212,0.08)] text-left`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
            <MessageSquare size={14} className="text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-[#E4E4E7] truncate">
              {session.name || session.title || `Session ${String(session.id).slice(0, 8)}`}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-cyan-400">
                {shortModel}
              </span>
              <span className="text-[10px] text-[#71717A]">{session.messageCount || 0} msgs</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[#71717A]">{relative}</span>
          <ChevronRight
            size={14}
            className="text-[#52525B] transition-colors group-hover:text-cyan-400"
          />
        </div>
      </button>
    </motion.div>
  );
}

function SystemStatusPanel({
  connected,
  health,
  models,
  agents,
}: {
  connected?: boolean;
  health?: any;
  models: number;
  agents: number;
}) {
  const uptimeSec = health?.uptime ?? 0;
  const uptimeFormatted =
    uptimeSec > 3600
      ? `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`
      : uptimeSec > 60
        ? `${Math.floor(uptimeSec / 60)}m ${Math.floor(uptimeSec % 60)}s`
        : `${Math.round(uptimeSec)}s`;

  const rows = [
    {
      label: "Connection",
      value: (
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]"}`}
          />
          <span className={connected ? "text-emerald-400" : "text-red-400"}>
            {connected ? "Online" : "Offline"}
          </span>
        </span>
      ),
    },
    {
      label: "Version",
      value: (
        <span className="rounded bg-violet-500/10 px-2 py-0.5 text-[11px] font-mono font-medium text-violet-400">
          v4.0.0
        </span>
      ),
    },
    {
      label: "Models",
      value: (
        <span className="text-sm font-medium text-[#E4E4E7]">
          {models} loaded
        </span>
      ),
    },
    {
      label: "Agents",
      value: (
        <span className="text-sm font-medium text-[#E4E4E7]">
          {agents} active
        </span>
      ),
    },
    {
      label: "Uptime",
      value: (
        <span className="font-mono text-sm text-[#E4E4E7]">{uptimeFormatted}</span>
      ),
    },
  ];

  return (
    <motion.div variants={item}>
      <Card variant="default" padding="lg">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#E4E4E7]">
          <Activity size={15} className="text-cyan-400" />
          System Status
        </h3>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-xs text-[#A1A1AA]">{row.label}</span>
              {row.value}
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────── */
function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

/* ────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────── */
export function DashboardPage({
  agents = [],
  sessions = [],
  models = [],
  health,
  connected,
  onNavigate,
  onRefresh,
}: DashboardPageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const recentSessions = [...sessions]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
    )
    .slice(0, 6);

  // Compute "messages today" – count messages from sessions updated today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const messagesToday = sessions.reduce((sum, s) => {
    const updated = new Date(s.updatedAt || s.createdAt || 0);
    if (updated >= todayStart) return sum + (s.messageCount || 0);
    return sum;
  }, 0);

  const uptimeSec = health?.uptime ?? 0;
  const uptimeMinutes = Math.round(uptimeSec / 60);

  if (!mounted) return null;

  return (
    <div className="relative min-h-full w-full overflow-y-auto">
      {/* ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
        <div className="absolute -bottom-32 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full px-6 py-8 space-y-10">
        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
        >
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-[#A1A1AA]">
            Welcome back — here's your AgentForge overview at a glance.
          </p>
        </motion.div>

        {/* ─── Stat Cards ─── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            icon={Layers}
            label="Total Sessions"
            value={sessions.length}
            trend="+12%"
            color="from-cyan-500 to-cyan-600"
            delay={0}
          />
          <StatCard
            icon={Users}
            label="Active Agents"
            value={agents.length}
            trend="+3"
            color="from-violet-500 to-violet-600"
            delay={1}
          />
          <StatCard
            icon={MessageSquare}
            label="Messages Today"
            value={messagesToday}
            trend="+8%"
            color="from-fuchsia-500 to-pink-500"
            delay={2}
          />
          <StatCard
            icon={Clock}
            label="Uptime"
            value={uptimeMinutes}
            suffix="m"
            color="from-emerald-500 to-teal-500"
            delay={3}
          />
        </motion.div>

        {/* ─── Quick Actions ─── */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#E4E4E7]"
          >
            <Zap size={14} className="text-cyan-400" />
            Quick Actions
          </motion.h2>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.route}
                label={action.label}
                icon={action.icon}
                gradient={action.gradient}
                onClick={() => onNavigate?.(action.route)}
              />
            ))}
          </motion.div>
        </div>

        {/* ─── Bottom grid: Recent Activity + System Status ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Activity — wider column */}
          <div className="lg:col-span-3">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#E4E4E7]"
            >
              <Activity size={14} className="text-violet-400" />
              Recent Activity
            </motion.h2>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-2.5"
            >
              {recentSessions.length === 0 ? (
                <motion.div variants={item}>
                  <div
                    className={`${glass} flex flex-col items-center justify-center p-10 text-center`}
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10">
                      <MessageSquare size={22} className="text-cyan-400" />
                    </div>
                    <p className="text-sm text-[#A1A1AA]">No sessions yet</p>
                    <p className="mt-1 text-xs text-[#52525B]">
                      Start a new chat to see your activity here.
                    </p>
                    <button
                      onClick={() => onNavigate?.("chat")}
                      className="mt-4 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-[0_4px_24px_rgba(6,182,212,0.3)]"
                    >
                      <MessageSquare size={13} />
                      New Chat
                    </button>
                  </div>
                </motion.div>
              ) : (
                recentSessions.map((s: any) => (
                  <RecentActivityRow key={s.id} session={s} />
                ))
              )}
            </motion.div>
          </div>

          {/* System Status — narrower column */}
          <div className="lg:col-span-2">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#E4E4E7]"
            >
              <Cpu size={14} className="text-cyan-400" />
              System
            </motion.h2>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              <SystemStatusPanel
                connected={connected}
                health={health}
                models={models.length}
                agents={agents.length}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
