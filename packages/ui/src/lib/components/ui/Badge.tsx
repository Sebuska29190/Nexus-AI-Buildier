import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.10)] text-[#A1A1AA]",
        success:
          "bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[#22c55e]",
        warning:
          "bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.2)] text-[#eab308]",
        error:
          "bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#ef4444]",
        info:
          "bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.2)] text-[#06b6d4]",
        accent:
          "bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] text-[#8b5cf6]",
        outline:
          "bg-transparent border border-[rgba(255,255,255,0.15)] text-[#A1A1AA]",
      },
      size: {
        sm: "h-5 px-1.5 text-[10px] rounded",
        md: "h-6 px-2.5 text-xs rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "rounded-full shrink-0",
              size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
              variant === "success" && "bg-[#22c55e]",
              variant === "warning" && "bg-[#eab308]",
              variant === "error" && "bg-[#ef4444]",
              variant === "info" && "bg-[#06b6d4]",
              variant === "accent" && "bg-[#8b5cf6]",
              variant === "default" && "bg-[#A1A1AA]",
              variant === "outline" && "bg-[#A1A1AA]"
            )}
          />
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
