import React from "react";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-2.5 text-base gap-2.5",
};

const variantStyles = {
  primary:
    "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-semibold rounded-xl transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:brightness-110 active:translate-y-0",
  ghost:
    "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-[#94a3b8] font-medium rounded-xl transition-all duration-200 hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f1f5f9] hover:border-[rgba(255,255,255,0.15)]",
  danger:
    "bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#ef4444] font-medium rounded-xl transition-all duration-200 hover:bg-[rgba(239,68,68,0.15)] hover:border-[rgba(239,68,68,0.3)]",
};

export function GlassButton({
  children,
  className = "",
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled,
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center ${sizeStyles[size]} ${variantStyles[variant]} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
