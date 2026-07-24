import React from "react";
import { cn } from "../../utils";

type ProgressVariant = "default" | "thick";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value (0–100). */
  value?: number;
  /** Visual variant. */
  variant?: ProgressVariant;
  /** Show percentage label. */
  showLabel?: boolean;
  /** Accessible label for screen readers. */
  label?: string;
}

const variantSizes: Record<ProgressVariant, string> = {
  default: "h-1.5",
  thick: "h-3",
};

export function Progress({
  value = 0,
  variant = "default",
  showLabel = false,
  label = "Progress",
  className,
  ...props
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)} {...props}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#71717A]">{label}</span>
          <span className="text-xs font-mono text-[#A1A1AA]">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn(
          "w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]",
          variantSizes[variant]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-[width] duration-500 ease-out",
            variant === "thick" && "shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
