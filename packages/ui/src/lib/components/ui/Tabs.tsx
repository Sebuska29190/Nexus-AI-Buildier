import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../utils";

/* ------------------------------------------------------------------ */
/*  Variants                                                           */
/* ------------------------------------------------------------------ */

type TabsVariant = "underline" | "pill";

/* ------------------------------------------------------------------ */
/*  Root                                                               */
/* ------------------------------------------------------------------ */

interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: TabsVariant;
}

const TabsContext = React.createContext<TabsVariant>("underline");

const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ variant = "underline", className, children, ...props }, ref) => (
  <TabsContext.Provider value={variant}>
    <TabsPrimitive.Root
      ref={ref}
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </TabsPrimitive.Root>
  </TabsContext.Provider>
));
Tabs.displayName = "Tabs";

/* ------------------------------------------------------------------ */
/*  List                                                               */
/* ------------------------------------------------------------------ */

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsContext);

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "flex items-center",
        variant === "underline"
          ? "border-b border-white/[0.08] gap-1"
          : "gap-1 rounded-lg bg-[rgba(17,17,20,0.85)] backdrop-blur-[32px] border border-white/[0.06] p-1",
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = "TabsList";

/* ------------------------------------------------------------------ */
/*  Trigger                                                            */
/* ------------------------------------------------------------------ */

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const variant = React.useContext(TabsContext);

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "group relative inline-flex items-center justify-center whitespace-nowrap",
        "text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "underline"
          ? [
              "px-4 py-2.5 text-white/50 hover:text-white/80",
              "data-[state=active]:text-[#06b6d4]",
            ]
          : [
              "px-4 py-2 rounded-md text-white/50 hover:text-white/80",
              "data-[state=active]:text-white",
            ],
        className,
      )}
      {...props}
    >
      {/* Active indicator — fades in via group-data-state on the trigger. */}
      {variant === "underline" && <TabsUnderlineIndicator />}
      {variant === "pill" && <TabsPillIndicator />}
      <span className="relative z-10">{children}</span>
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = "TabsTrigger";

/* ------------------------------------------------------------------ */
/*  Indicators                                                         */
/* ------------------------------------------------------------------ */

/**
 * The indicators are CSS-only: they read the parent trigger's `data-state`
 * via the `group` + `group-data-[state]` Tailwind variants. Each trigger
 * owns its own indicator; the indicator inherits visibility from the
 * trigger's active state. This is robust regardless of how many `<Tabs>`
 * instances are mounted on the page, and avoids framer-motion layoutId
 * pitfalls (layoutId only animates between unmount/mount transitions or
 * when the element's bounding rect actually changes — neither happens
 * here, since triggers don't reorder or resize on state flip).
 */

function TabsUnderlineIndicator() {
  return (
    <span
      className={cn(
        "pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#06b6d4]",
        "opacity-0 transition-opacity duration-200",
        "group-data-[state=active]:opacity-100"
      )}
      aria-hidden="true"
    />
  );
}

function TabsPillIndicator() {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-0 rounded-md bg-[#06b6d4]/15 border border-[#06b6d4]/25",
        "opacity-0 transition-opacity duration-200",
        "group-data-[state=active]:opacity-100"
      )}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3 rounded-xl border border-white/[0.06]",
      "bg-[rgba(17,17,20,0.85)] backdrop-blur-[32px] p-5",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]",
      "data-[state=inactive]:hidden",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsVariant };
