import * as React from "react";
import { cn } from "../../utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-[#A1A1AA]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]">
              {icon}
            </span>
          )}
          <input
            type={type}
            className={cn(
              "flex h-9 w-full rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-3 py-2 text-sm text-[#E4E4E7] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#52525B] focus-visible:outline-none focus-visible:border-[rgba(6,182,212,0.4)] focus-visible:shadow-[0_0_0_3px_rgba(6,182,212,0.1)] disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              error &&
                "border-[rgba(239,68,68,0.5)] focus-visible:border-[rgba(239,68,68,0.7)]",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-[#ef4444]">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
