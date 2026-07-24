import React from "react";
import { cn } from "../../utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation of the separator. */
  orientation?: "horizontal" | "vertical";
  /** Use the glass gradient style. */
  variant?: "glass" | "solid";
  /** Decorative (hidden from assistive tech). Set false if semantic. */
  decorative?: boolean;
}

export function Separator({
  orientation = "horizontal",
  variant = "glass",
  decorative = true,
  className,
  ...props
}: SeparatorProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0",
        isHorizontal ? "w-full h-px" : "h-full w-px",
        variant === "glass"
          ? isHorizontal
            ? "bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent"
            : "bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.08)] to-transparent"
          : "bg-[rgba(255,255,255,0.06)]",
        className
      )}
      {...props}
    />
  );
}

export type { SeparatorProps };
