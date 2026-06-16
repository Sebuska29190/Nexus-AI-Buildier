import { Handle, Position } from "@xyflow/react";
import { Wrench } from "lucide-react";

export function ToolNode({ data }: { data: any }) {
  return (
    <div className="glass-card px-4 py-3 min-w-[160px] group hover:border-[rgba(34,197,94,0.3)] transition-all">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#22c55e] !border-2 !border-[#12121a]" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-lg bg-[rgba(34,197,94,0.15)] flex items-center justify-center">
          <Wrench size={12} className="text-[#22c55e]" />
        </div>
        <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-wider">Tool</span>
      </div>
      <p className="text-xs text-white font-medium truncate">{data.label || "Tool"}</p>
      {data.toolName && <p className="text-[9px] text-[#475569] font-mono mt-1 truncate">{data.toolName}</p>}
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#22c55e] !border-2 !border-[#12121a]" />
    </div>
  );
}
