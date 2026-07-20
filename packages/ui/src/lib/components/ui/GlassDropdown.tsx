import React, { useState, useRef, useEffect } from "react";

interface GlassDropdownProps {
  value: string;
  options: { label: string; value: string; icon?: React.ReactNode }[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function GlassDropdown({ value, options, onChange, placeholder = "Select...", className = "" }: GlassDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="glass-input w-full px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.icon && <span className="flex-shrink-0">{selected.icon}</span>}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        <svg
          className={`w-4 h-4 text-[#71717A] transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#111113] border border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in-up">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                  value === opt.value
                    ? "bg-[rgba(245,158,11,0.1)] text-[#F59E0B]"
                    : "text-[#A1A1AA] hover:bg-[#161618] hover:text-[#E4E4E7]"
                }`}
              >
                {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                <span className="truncate">{opt.label}</span>
                {value === opt.value && (
                  <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-[#F59E0B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
