import { Users, Wrench, GitBranch, Clock, Bell, Play, Square } from "lucide-react";

interface NodeTemplate {
  type: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  defaults: Record<string, any>;
}

const NODE_TEMPLATES: NodeTemplate[] = [
  { type: "start", label: "Start", icon: Play, color: "#6366f1", bgColor: "rgba(99,102,241,0.1)", defaults: { label: "Start" } },
  { type: "agent", label: "Agent", icon: Users, color: "#818cf8", bgColor: "rgba(99,102,241,0.1)", defaults: { label: "Agent", agentId: "", message: "" } },
  { type: "tool", label: "Tool", icon: Wrench, color: "#22c55e", bgColor: "rgba(34,197,94,0.1)", defaults: { label: "Tool", toolName: "", arguments: "" } },
  { type: "condition", label: "Condition", icon: GitBranch, color: "#f59e0b", bgColor: "rgba(245,158,11,0.1)", defaults: { label: "Condition", variable: "", operator: "equals", value: "" } },
  { type: "delay", label: "Delay", icon: Clock, color: "#3b82f6", bgColor: "rgba(59,130,246,0.1)", defaults: { label: "Delay", ms: 1000 } },
  { type: "notify", label: "Notify", icon: Bell, color: "#a78bfa", bgColor: "rgba(167,139,250,0.1)", defaults: { label: "Notify", message: "" } },
  { type: "end", label: "End", icon: Square, color: "#ef4444", bgColor: "rgba(239,68,68,0.1)", defaults: { label: "End" } },
];

interface NodePaletteProps {
  onAddNode: (type: string, defaults: Record<string, any>) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">Drag to add</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {NODE_TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.type}
              onClick={() => onAddNode(t.type, t.defaults)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-all text-left group"
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: t.bgColor }}>
                <Icon size={12} style={{ color: t.color }} />
              </div>
              <span className="text-[10px] font-medium text-[#94a3b8] group-hover:text-white transition-colors">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
