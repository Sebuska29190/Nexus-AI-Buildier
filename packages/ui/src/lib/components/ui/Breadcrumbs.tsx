import React from "react";
import { cn } from "../../utils";

interface BreadcrumbItem {
  /** Display label. */
  label: string;
  /** Optional href for links. */
  href?: string;
  /** Optional click handler. */
  onClick?: (e: React.MouseEvent) => void;
  /** Optional icon before the label. */
  icon?: React.ReactNode;
}

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  /** Array of breadcrumb items, or auto-generated from a path string. */
  items?: BreadcrumbItem[];
  /** File-system style path string to auto-generate items from. */
  path?: string;
  /** Custom separator. Defaults to "/". */
  separator?: React.ReactNode;
  /** Maximum items to display before truncating. 0 = no limit. */
  maxItems?: number;
}

function generateItemsFromPath(path: string): BreadcrumbItem[] {
  const segments = path.split("/").filter(Boolean);
  return segments.map((segment, i) => ({
    label: decodeURIComponent(segment),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));
}

export function Breadcrumbs({
  items,
  path,
  separator = "/",
  maxItems = 0,
  className,
  ...props
}: BreadcrumbsProps) {
  const resolvedItems = items ?? (path ? generateItemsFromPath(path) : []);

  let displayItems = resolvedItems;
  let truncated = false;

  if (maxItems > 0 && resolvedItems.length > maxItems) {
    truncated = true;
    const first = resolvedItems[0];
    const last = maxItems - 1;
    displayItems = [first, ...resolvedItems.slice(-last)];
  }

  const isLast = (index: number) => index === displayItems.length - 1;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center min-w-0", className)} {...props}>
      <ol className="flex items-center gap-1 min-w-0">
        {displayItems.map((item, i) => {
          const last = isLast(i);
          const showTruncation = truncated && i === 1;

          return (
            <React.Fragment key={i}>
              {showTruncation && (
                <li className="flex items-center">
                  <span className="text-[#52525B] text-xs px-1 select-none" aria-hidden="true">…</span>
                  <span className="text-[#3f3f46] mx-1 text-xs select-none" aria-hidden="true">
                    {separator}
                  </span>
                </li>
              )}
              <li className="flex items-center min-w-0">
                {i > 0 && !showTruncation && (
                  <span className="text-[#3f3f46] mx-1.5 text-xs select-none" aria-hidden="true">
                    {separator}
                  </span>
                )}
                {item.href || item.onClick ? (
                  <a
                    href={item.href}
                    onClick={(e) => {
                      if (item.onClick) {
                        e.preventDefault();
                        item.onClick(e);
                      }
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm truncate rounded-md px-1 py-0.5 -mx-1 transition-colors duration-150",
                      last
                        ? "text-cyan-400 font-medium"
                        : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.04)]"
                    )}
                    aria-current={last ? "page" : undefined}
                  >
                    {item.icon && <span className="flex-shrink-0 w-3.5 h-3.5">{item.icon}</span>}
                    <span className="truncate">{item.label}</span>
                  </a>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm truncate px-1",
                      last ? "text-cyan-400 font-medium" : "text-[#71717A]"
                    )}
                    aria-current={last ? "page" : undefined}
                  >
                    {item.icon && <span className="flex-shrink-0 w-3.5 h-3.5">{item.icon}</span>}
                    <span className="truncate">{item.label}</span>
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export type { BreadcrumbsProps, BreadcrumbItem };
