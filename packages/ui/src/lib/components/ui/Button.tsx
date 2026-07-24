import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white font-semibold shadow-[0_2px_12px_rgba(6,182,212,0.15)] hover:shadow-[0_4px_24px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 active:translate-y-0 hover:brightness-110",
        secondary:
          "bg-[#18181b] border border-[rgba(255,255,255,0.10)] text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#E4E4E7] hover:border-[rgba(255,255,255,0.15)]",
        ghost:
          "text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#E4E4E7]",
        destructive:
          "bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.15)] hover:border-[rgba(239,68,68,0.3)]",
        outline:
          "border border-[rgba(255,255,255,0.10)] text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#E4E4E7]",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
