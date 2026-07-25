import React, { useState, useCallback, useEffect } from "react";
import { cn } from "../../utils";

type StatusType = "online" | "idle" | "offline";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL. */
  src?: string | null;
  /** Alt text for the image. */
  alt?: string;
  /** Fallback initials shown when image is missing or fails to load. */
  initials?: string;
  /** Status indicator dot. */
  status?: StatusType;
  /** Avatar size. */
  size?: AvatarSize;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; dot: string; dotRing: string }> = {
  xs: { container: "h-6 w-6", text: "text-[10px]", dot: "h-1.5 w-1.5", dotRing: "ring-1" },
  sm: { container: "h-8 w-8", text: "text-xs", dot: "h-2 w-2", dotRing: "ring-1" },
  md: { container: "h-9 w-9", text: "text-sm", dot: "h-2.5 w-2.5", dotRing: "ring-2" },
  lg: { container: "h-11 w-11", text: "text-base", dot: "h-3 w-3", dotRing: "ring-2" },
  xl: { container: "h-14 w-14", text: "text-lg", dot: "h-3.5 w-3.5", dotRing: "ring-[3px]" },
};

const statusColors: Record<StatusType, string> = {
  online: "bg-emerald-400",
  idle: "bg-amber-400",
  offline: "bg-zinc-500",
};

export function Avatar({
  src,
  alt = "",
  initials,
  status,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Reset error state when the source changes, otherwise the avatar
  // would stay stuck on the initials fallback forever if a broken
  // URL is later replaced with a valid one.
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const showImage = src && !imgError;

  const handleImageError = useCallback(() => {
    setImgError(true);
  }, []);

  const s = sizeStyles[size];

  // Generate initials from alt text if not provided
  const resolvedInitials = initials ?? alt
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("relative inline-flex shrink-0", className)} {...props}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full overflow-hidden",
          "bg-gradient-to-br from-[rgba(6,182,212,0.2)] to-[rgba(139,92,246,0.2)]",
          "border border-[rgba(255,255,255,0.1)]",
          s.container
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            onError={handleImageError}
            className="h-full w-full object-cover"
          />
        ) : resolvedInitials ? (
          <span
            className={cn(
              "font-semibold bg-gradient-to-br from-cyan-400 to-violet-400 bg-clip-text text-transparent select-none",
              s.text
            )}
          >
            {resolvedInitials}
          </span>
        ) : (
          // Default icon fallback
          <svg
            className="h-1/2 w-1/2 text-[#52525B]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-1a6 6 0 0112 0v1" />
          </svg>
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-[#0a0a0c]",
            s.dot,
            s.dotRing,
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

/* ─── Avatar Group (stacked) ─── */
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum avatars to display before "+N" overflow. */
  max?: number;
}

export function AvatarGroup({
  children,
  max = 5,
  className,
  ...props
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visible = childArray.slice(0, max);
  const overflow = childArray.length - max;

  return (
    <div className={cn("flex items-center -space-x-2", className)} {...props}>
      {visible.map((child, i) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ className?: string }>, {
              className: cn(
                "ring-2 ring-[#0a0a0c]",
                (child as React.ReactElement<{ className?: string }>).props.className
              ),
              key: i,
            })
          : child
      )}
      {overflow > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-[#161618] border border-[rgba(255,255,255,0.1)]",
            "text-[11px] font-medium text-[#71717A] ring-2 ring-[#0a0a0c]",
            "h-9 w-9"
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export type { AvatarProps, AvatarSize, StatusType };
