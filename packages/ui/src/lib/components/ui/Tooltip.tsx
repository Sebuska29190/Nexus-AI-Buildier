import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../utils";

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

const TooltipProvider = TooltipPrimitive.Provider;

/* ------------------------------------------------------------------ */
/*  Root / Trigger                                                     */
/* ------------------------------------------------------------------ */

const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  /** Show the arrow indicator. Default true. */
  showArrow?: boolean;
}

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 6, showArrow = true, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[100] overflow-hidden rounded-md px-3 py-1.5",
        "text-xs font-medium text-white/90",
        "bg-[rgba(17,17,20,0.85)] backdrop-blur-[32px]",
        "border border-white/[0.08] shadow-xl",
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    >
      {children}
      {showArrow && (
        <TooltipPrimitive.Arrow className="fill-[rgba(17,17,20,0.85)] drop-shadow-[0_1px_0_rgba(255,255,255,0.08)]" />
      )}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

/* ------------------------------------------------------------------ */
/*  Convenience wrapper                                                */
/* ------------------------------------------------------------------ */

interface TooltipWrapperProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  className?: string;
  showArrow?: boolean;
}

/**
 * Self-contained Tooltip component with built-in Provider, Root, Trigger, and Content.
 * Wrap any element with `<Tooltip content="…">` and it just works.
 */
function TooltipWrapper({
  content,
  children,
  side = "top",
  delayDuration = 300,
  className,
  showArrow = true,
}: TooltipWrapperProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn(
              "z-[100] overflow-hidden rounded-md px-3 py-1.5",
              "text-xs font-medium text-white/90",
              "bg-[rgba(17,17,20,0.85)] backdrop-blur-[32px]",
              "border border-white/[0.08] shadow-xl",
              "animate-in fade-in-0 zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
              "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              className,
            )}
          >
            {content}
            {showArrow && (
              <TooltipPrimitive.Arrow className="fill-[rgba(17,17,20,0.85)] drop-shadow-[0_1px_0_rgba(255,255,255,0.08)]" />
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
TooltipWrapper.displayName = "TooltipWrapper";

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipWrapper,
  type TooltipContentProps,
};
