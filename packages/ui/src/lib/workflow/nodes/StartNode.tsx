import { Handle, Position } from "@xyflow/react";
import { Play } from "lucide-react";

export function StartNode({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl px-4 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
      <div className="flex items-center gap-2">
        <Play size={12} className="text-white" fill="white" />
        <span className="text-xs font-bold text-white">{data.label || "Start"}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-white !border-2 !border-[#6366f1]" />
    </div>
  );
}
