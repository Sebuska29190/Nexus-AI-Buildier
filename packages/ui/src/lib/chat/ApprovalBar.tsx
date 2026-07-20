import { Shield, Check, X, CheckCheck } from "lucide-react";

interface ApprovalBarProps {
  tool: string;
  args: any;
  onApprove: () => void;
  onReject: () => void;
  onAlwaysAllow: () => void;
}

export function ApprovalBar({ tool, args, onApprove, onReject, onAlwaysAllow }: ApprovalBarProps) {
  const argsStr = args ? Object.entries(args).map(([k, v]) => `${k}: ${String(v).slice(0, 60)}`).join(", ") : "";

  return (
    <div className="my-2 p-3 rounded-lg border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)]">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={14} className="text-[#f59e0b]" />
        <span className="text-xs font-medium text-[#f59e0b]">{tool}</span>
        {argsStr && <span className="text-[10px] text-[#71717A] font-mono truncate">{argsStr}</span>}
        <span className="text-[10px] text-[#f59e0b] ml-auto animate-pulse">Needs approval</span>
      </div>
      {args && (
        <div className="mb-2 px-2 py-1 rounded bg-[rgba(0,0,0,0.2)] text-[10px] text-[#64748b] font-mono max-h-20 overflow-y-auto">
          {JSON.stringify(args, null, 2)}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button onClick={onApprove} className="flex items-center gap-1 px-3 py-1 text-[10px] font-medium rounded-lg bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white hover:shadow-[0_2px_8px_rgba(34,197,94,0.3)] transition-all">
          <Check size={10} /> Approve
        </button>
        <button onClick={onReject} className="flex items-center gap-1 px-3 py-1 text-[10px] font-medium rounded-lg bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.2)] transition-all">
          <X size={10} /> Reject
        </button>
        <button onClick={onAlwaysAllow} className="flex items-center gap-1 px-3 py-1 text-[10px] font-medium rounded-lg bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] text-[#F59E0B] hover:bg-[rgba(245,158,11,0.15)] transition-all">
          <CheckCheck size={10} /> Always allow
        </button>
      </div>
    </div>
  );
}
