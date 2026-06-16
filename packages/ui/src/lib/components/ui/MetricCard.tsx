import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, value, change, changeType = "neutral", icon, className = "" }: MetricCardProps) {
  const changeColor = {
    up: "text-[#22c55e]",
    down: "text-[#ef4444]",
    neutral: "text-[#475569]",
  }[changeType];

  const changeIcon = {
    up: "↑",
    down: "↓",
    neutral: "→",
  }[changeType];

  return (
    <div className={`glass-card p-4 group ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-medium text-[#475569] uppercase tracking-wider">{label}</span>
        {icon && (
          <span className="text-[#475569] group-hover:text-[#6366f1] transition-colors">
            {icon}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-[#f1f5f9] font-mono tracking-tight">{value}</div>
      {change && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${changeColor}`}>
          <span>{changeIcon}</span>
          <span>{change}</span>
        </div>
      )}
    </div>
  );
}
