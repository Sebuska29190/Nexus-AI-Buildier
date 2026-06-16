import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";

export function ConditionNode({ data }: { data: any }) {
  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#f59e0b] !border-2 !border-[#12121a]" />
      <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] rounded-xl px-4 py-3 min-w-[160px] hover:border-[rgba(245,158,11,0.4)] transition-all">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
            <GitBranch size={12} className="text-[#f59e0b]" />
          </div>
          <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider">Condition</span>
        </div>
        <p className="text-xs text-white font-medium truncate">{data.label || "Condition"}</p>
        {data.variable && (
          <p className="text-[9px] text-[#475569] font-mono mt-1">
            {data.variable} {data.operator || "="} {data.value || "?"}
          </p>
        )}
      </div>
      {/* True handle (left) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: "30%" }}
        className="!w-3 !h-3 !bg-[#22c55e] !border-2 !border-[#12121a]"
      />
      {/* False handle (right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "70%" }}
        className="!w-3 !h-3 !bg-[#ef4444] !border-2 !border-[#12121a]"
      />
      {/* Labels */}
      <span className="absolute -bottom-5 left-[22%] text-[8px] text-[#22c55e] font-bold">TRUE</span>
      <span className="absolute -bottom-5 left-[62%] text-[8px] text-[#ef4444] font-bold">FALSE</span>
    </div>
  );
}
