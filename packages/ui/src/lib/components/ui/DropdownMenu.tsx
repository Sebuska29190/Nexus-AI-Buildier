import React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../utils";

/* ─── Primitives re-exported for composability ─── */
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/* ─── Content ─── */
interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {}

const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[180px] overflow-hidden rounded-xl p-1",
        "bg-[#0a0a0c]/95 backdrop-blur-xl",
        "border border-[rgba(255,255,255,0.08)]",
        "shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)]",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "duration-150",
        className
      )}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

/* ─── Item ─── */
interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  icon?: React.ReactNode;
  shortcut?: string;
  destructive?: boolean;
}

const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, icon, shortcut, destructive, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none cursor-pointer select-none",
      "transition-colors duration-150",
      destructive
        ? "text-red-400 focus:bg-[rgba(239,68,68,0.12)] focus:text-red-300"
        : "text-[#A1A1AA] focus:bg-[rgba(6,182,212,0.08)] focus:text-[#E4E4E7]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className
    )}
    {...props}
  >
    {icon && (
      <span className={cn("flex-shrink-0 w-4 h-4", destructive ? "text-red-400" : "text-[#71717A]")}>
        {icon}
      </span>
    )}
    <span className="flex-1 truncate">{children}</span>
    {shortcut && (
      <KbdHint>{shortcut}</KbdHint>
    )}
  </DropdownMenuPrimitive.Item>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

/* ─── Kbd hint (internal) ─── */
function KbdHint({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto pl-4 text-[11px] font-mono text-[#52525B] tracking-wide">
      {children}
    </span>
  );
}

/* ─── Separator ─── */
const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("my-1 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

/* ─── Label ─── */
const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#52525B]", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

/* ─── Checkbox Item ─── */
interface DropdownMenuCheckboxItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> {
  icon?: React.ReactNode;
}

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(({ className, children, icon, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none cursor-pointer select-none",
      "text-[#A1A1AA] transition-colors duration-150",
      "focus:bg-[rgba(6,182,212,0.08)] focus:text-[#E4E4E7]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className
    )}
    {...props}
  >
    <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {icon && <span className="flex-shrink-0 w-4 h-4 text-[#71717A]">{icon}</span>}
    <span className="flex-1 truncate">{children}</span>
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

/* ─── Radio Item ─── */
interface DropdownMenuRadioItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> {}

const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none cursor-pointer select-none",
      "text-[#A1A1AA] transition-colors duration-150",
      "focus:bg-[rgba(6,182,212,0.08)] focus:text-[#E4E4E7]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className
    )}
    {...props}
  >
    <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <span className="w-2 h-2 rounded-full bg-gradient-to-br from-cyan-400 to-violet-400" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    <span className="flex-1 truncate">{children}</span>
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

/* ─── Sub Trigger ─── */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { icon?: React.ReactNode }
>(({ className, icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none cursor-pointer select-none",
      "text-[#A1A1AA] transition-colors duration-150",
      "focus:bg-[rgba(6,182,212,0.08)] focus:text-[#E4E4E7]",
      "data-[state=open]:bg-[rgba(6,182,212,0.08)] data-[state=open]:text-[#E4E4E7]",
      className
    )}
    {...props}
  >
    {icon && <span className="flex-shrink-0 w-4 h-4 text-[#71717A]">{icon}</span>}
    <span className="flex-1 truncate">{children}</span>
    <svg className="w-3.5 h-3.5 ml-auto text-[#52525B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

/* ─── Sub Content ─── */
const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      sideOffset={4}
      className={cn(
        "z-50 min-w-[160px] overflow-hidden rounded-xl p-1",
        "bg-[#0a0a0c]/95 backdrop-blur-xl",
        "border border-[rgba(255,255,255,0.08)]",
        "shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

/* ─── Exports ─── */
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};

export type {
  DropdownMenuItemProps,
  DropdownMenuCheckboxItemProps,
  DropdownMenuRadioItemProps,
  DropdownMenuContentProps,
};
