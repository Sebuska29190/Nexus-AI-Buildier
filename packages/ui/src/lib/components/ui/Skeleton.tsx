import React from "react";
import { cn } from "../../utils";

type SkeletonVariant = "text" | "card" | "circle" | "avatar";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  /** Width override (Tailwind class or inline). */
  width?: string;
  /** Height override (Tailwind class or inline). */
  height?: string;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: "h-4 w-full rounded-md",
  card: "h-32 w-full rounded-xl",
  circle: "h-10 w-10 rounded-full",
  avatar: "h-9 w-9 rounded-full",
};

export function Skeleton({
  variant = "text",
  className,
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", variantStyles[variant], className)}
      style={{ ...(width ? { width } : {}), ...(height ? { height } : {}), ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}

/* ─── Compound: Text block skeleton (multiple lines) ─── */
interface SkeletonTextBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of lines to render. */
  lines?: number;
  /** Width of the last line as a percentage (0-100). */
  lastLineWidth?: number;
}

export function SkeletonTextBlock({
  lines = 3,
  lastLineWidth = 60,
  className,
  ...props
}: SkeletonTextBlockProps) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          style={i === lines - 1 ? { width: `${lastLineWidth}%` } : undefined}
        />
      ))}
    </div>
  );
}

/* ─── Compound: Card skeleton with image + text lines ─── */
interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show image placeholder area. */
  hasImage?: boolean;
  /** Number of text lines below the image. */
  lines?: number;
}

export function SkeletonCard({
  hasImage = true,
  lines = 3,
  className,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111113] p-4 space-y-4",
        className
      )}
      {...props}
    >
      {hasImage && <Skeleton variant="card" className="!h-40" />}
      <SkeletonTextBlock lines={lines} />
    </div>
  );
}
