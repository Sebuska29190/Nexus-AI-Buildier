import { Handle, Position } from "@xyflow/react";
import { Users } from "lucide-react";

export function AgentNode({ data }: { data: any }) {
  return (
    <div className="glass-card px-4 py-3 min-w-[160px] group hover:border-[rgba(99,102,241,0.3)] transition-all">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#6366f1] !border-2 !border-[#12121a]" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-lg bg-[rgba(99,102,241,0.15)] flex items-center justify-center">
          <Users size={12} className="text-[#818cf8]" />
        </div>
        <span className="text-[10px] font-bold text-[#818cf8] uppercase tracking-wider">Agent</span>
      </div>
      <p className="text-xs text-white font-medium truncate">{data.label || "Agent"}</p>
      {data.agentId && <p className="text-[9px] text-[#475569] font-mono mt-1 truncate">{data.agentId}</p>}
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#6366f1] !border-2 !border-[#12121a]" />
    </div>
  );
}
