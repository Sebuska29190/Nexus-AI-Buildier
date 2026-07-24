import React from "react";
import { cn } from "../../utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon element (e.g., from lucide-react). */
  icon?: React.ReactNode;
  /** Main heading text. */
  title: string;
  /** Supporting description text. */
  description?: string;
  /** Optional CTA button or action element. */
  action?: React.ReactNode;
  /** Visual size variant. */
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: {
    container: "py-8 px-4 gap-3",
    iconWrap: "h-10 w-10 mb-1",
    icon: "h-5 w-5",
    title: "text-sm",
    desc: "text-xs",
  },
  md: {
    container: "py-12 px-6 gap-4",
    iconWrap: "h-14 w-14 mb-1",
    icon: "h-7 w-7",
    title: "text-base",
    desc: "text-sm",
  },
  lg: {
    container: "py-20 px-8 gap-5",
    iconWrap: "h-20 w-20 mb-2",
    icon: "h-10 w-10",
    title: "text-lg",
    desc: "text-base",
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "md",
  className,
  ...props
}: EmptyStateProps) {
  const s = sizeStyles[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        s.container,
        className
      )}
      role="status"
      {...props}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-xl",
            "bg-gradient-to-br from-[rgba(6,182,212,0.08)] to-[rgba(139,92,246,0.08)]",
            "border border-[rgba(255,255,255,0.06)]",
            s.iconWrap
          )}
        >
          <span className={cn("text-[#52525B]", s.icon)}>{icon}</span>
        </div>
      )}

      <div className="space-y-1.5 max-w-sm">
        <h3 className={cn("font-semibold text-[#E4E4E7]", s.title)}>{title}</h3>
        {description && (
          <p className={cn("text-[#71717A] leading-relaxed", s.desc)}>{description}</p>
        )}
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export type { EmptyStateProps };
