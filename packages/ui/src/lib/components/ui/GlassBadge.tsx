import React from "react";

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "accent";
  pulse?: boolean;
  className?: string;
}

const variantStyles = {
  default: "bg-[rgba(255,255,255,0.06)] text-[#94a3b8] border border-[rgba(255,255,255,0.08)]",
  success: "bg-[rgba(34,197,94,0.1)] text-[#22c55e] border border-[rgba(34,197,94,0.2)]",
  warning: "bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]",
  error: "bg-[rgba(239,68,68,0.1)] text-[#ef4444] border border-[rgba(239,68,68,0.2)]",
  info: "bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border border-[rgba(59,130,246,0.2)]",
  accent: "bg-[rgba(99,102,241,0.1)] text-[#818cf8] border border-[rgba(99,102,241,0.2)]",
};

export function GlassBadge({ children, variant = "default", pulse = false, className = "" }: GlassBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold tracking-wide transition-all ${
        variantStyles[variant]
      } ${pulse ? "animate-glow-pulse" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
