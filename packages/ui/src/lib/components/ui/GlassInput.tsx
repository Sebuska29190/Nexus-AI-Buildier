import React from "react";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, helperText, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-[#94a3b8]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`glass-input w-full py-2.5 text-sm ${
              icon ? "pl-10 pr-4" : "px-4"
            } ${error ? "border-[rgba(239,68,68,0.5)] focus:border-[rgba(239,68,68,0.7)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]" : ""} ${className}`}
            {...props}
          />
        </div>
        {(helperText || error) && (
          <span className={`text-xs ${error ? "text-[#ef4444]" : "text-[#475569]"}`}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

/** Textarea variant */
interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-[#94a3b8]">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`glass-input w-full px-4 py-2.5 text-sm resize-none min-h-[80px] ${
            error ? "border-[rgba(239,68,68,0.5)]" : ""
          } ${className}`}
          {...props}
        />
      </div>
    );
  }
);

GlassTextarea.displayName = "GlassTextarea";
