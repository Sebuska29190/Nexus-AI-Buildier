import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../utils";

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetPortal = DialogPrimitive.Portal;
const SheetClose = DialogPrimitive.Close;

/* ------------------------------------------------------------------ */
/*  Overlay                                                            */
/* ------------------------------------------------------------------ */

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

/* ------------------------------------------------------------------ */
/*  Direction helpers                                                  */
/* ------------------------------------------------------------------ */

type SheetSide = "top" | "right" | "bottom" | "left";

const sideVariants: Record<SheetSide, { initial: object; animate: object; exit: object }> = {
  top: {
    initial: { y: "-100%" },
    animate: { y: 0 },
    exit: { y: "-100%" },
  },
  bottom: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
  },
  left: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
  },
  right: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
};

const sideClasses: Record<SheetSide, string> = {
  top: "inset-x-0 top-0 border-b rounded-b-xl",
  bottom: "inset-x-0 bottom-0 border-t rounded-t-xl",
  left: "inset-y-0 left-0 border-r h-full w-3/4 max-w-sm sm:max-w-md",
  right: "inset-y-0 right-0 border-l h-full w-3/4 max-w-sm sm:max-w-md",
};

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: SheetSide;
  showClose?: boolean;
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "right", showClose = true, className, children, ...props }, ref) => (
  <SheetPortal forceMount>
    <AnimatePresence>
      <SheetOverlay asChild forceMount>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        />
      </SheetOverlay>

      <DialogPrimitive.Content
        ref={ref}
        asChild
        forceMount
        {...props}
      >
        <motion.div
          initial={sideVariants[side].initial}
          animate={sideVariants[side].animate}
          exit={sideVariants[side].exit}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className={cn(
            "fixed z-50",
            "border-white/[0.08] p-6 shadow-2xl",
            "bg-[rgba(17,17,20,0.85)] backdrop-blur-[32px]",
            "focus:outline-none",
            sideClasses[side],
            className,
          )}
        >
          {children}

          {showClose && (
            <DialogPrimitive.Close
              className={cn(
                "absolute right-4 top-4 rounded-md p-1.5",
                "text-white/40 transition-colors",
                "hover:text-white/80 hover:bg-white/[0.06]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50",
              )}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </motion.div>
      </DialogPrimitive.Content>
    </AnimatePresence>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

/* ------------------------------------------------------------------ */
/*  Header / Footer / Title / Description                             */
/* ------------------------------------------------------------------ */

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-white", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-white/50", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetOverlay,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  type SheetSide,
};
