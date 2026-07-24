import React from "react";
import { cn } from "../../utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Visual size variant. */
  size?: "sm" | "md";
}

export function Kbd({
  children,
  size = "sm",
  className,
  ...props
}: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center font-mono select-none",
        "rounded-md border border-[rgba(255,255,255,0.08)]",
        "bg-[rgba(255,255,255,0.04)] backdrop-blur-sm",
        "text-zinc-400",
        "shadow-[0_1px_0_rgba(255,255,255,0.06),0_1px_3px_rgba(0,0,0,0.3)]",
        size === "sm"
          ? "h-5 min-w-[20px] px-1.5 text-[11px] leading-none"
          : "h-6 min-w-[24px] px-2 text-xs leading-none",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

/* ─── Compound: KbdGroup for multi-key shortcuts ─── */
interface KbdGroupProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Keys to display. */
  keys: React.ReactNode[];
  /** Separator between keys. Defaults to " ". */
  separator?: React.ReactNode;
  size?: "sm" | "md";
}

export function KbdGroup({
  keys,
  separator = " ",
  size = "sm",
  className,
  ...props
}: KbdGroupProps) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} {...props}>
      {keys.map((key, i) => (
        <React.Fragment key={i}>
          <Kbd size={size}>{key}</Kbd>
          {i < keys.length - 1 && (
            <span className="text-[#3f3f46] text-[10px] select-none">{separator}</span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}

export type { KbdProps, KbdGroupProps };
