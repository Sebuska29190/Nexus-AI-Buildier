import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";

const selectWrapperVariants = cva(
  "relative inline-flex items-center rounded-lg border transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] focus-within:border-[rgba(6,182,212,0.4)] focus-within:shadow-[0_0_0_3px_rgba(6,182,212,0.1)]",
        ghost:
          "bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.04)] focus-within:border-[rgba(6,182,212,0.4)] focus-within:shadow-[0_0_0_3px_rgba(6,182,212,0.1)]",
      },
      size: {
        sm: "h-8",
        md: "h-9",
        lg: "h-11",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

const selectVariants = cva(
  "w-full appearance-none bg-transparent text-[#E4E4E7] placeholder:text-[#52525B] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "pl-2.5 pr-8 text-xs",
        md: "pl-3 pr-9 text-sm",
        lg: "pl-4 pr-10 text-base",
      },
    },
    defaultVariants: { size: "md" },
  }
);

const chevronSizes = {
  sm: "right-2 h-3.5 w-3.5",
  md: "right-2.5 h-4 w-4",
  lg: "right-3 h-5 w-5",
};

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectWrapperVariants> {
  label?: string;
  error?: string;
  placeholder?: string;
  options?: SelectOption[];
  icon?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      variant,
      size,
      label,
      error,
      placeholder,
      options,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-[#A1A1AA]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] z-10 pointer-events-none">
              {icon}
            </span>
          )}
          <div
            className={cn(
              selectWrapperVariants({ variant, size }),
              icon && (size === "sm" ? "pl-8" : size === "lg" ? "pl-11" : "pl-10"),
              error &&
                "border-[rgba(239,68,68,0.5)] focus-within:border-[rgba(239,68,68,0.7)] focus-within:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
              className
            )}
          >
            <select
              ref={ref}
              className={cn(selectVariants({ size }))}
              {...props}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options
                ? options.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                    >
                      {opt.label}
                    </option>
                  ))
                : children}
            </select>
            <svg
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none text-[#71717A]",
                chevronSizes[size || "md"]
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        {error && <span className="text-xs text-[#ef4444]">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select, selectWrapperVariants, selectVariants };
