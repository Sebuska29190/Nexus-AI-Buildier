import { Handle, Position } from "@xyflow/react";
import { Square } from "lucide-react";

export function EndNode({ data }: { data: any }) {
  return (
    <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] rounded-xl px-4 py-2.5">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#ef4444] !border-2 !border-[#12121a]" />
      <div className="flex items-center gap-2">
        <Square size={12} className="text-[#ef4444]" />
        <span className="text-xs font-bold text-[#ef4444]">{data.label || "End"}</span>
      </div>
    </div>
  );
}
