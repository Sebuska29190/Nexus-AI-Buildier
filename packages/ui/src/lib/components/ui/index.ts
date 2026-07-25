// AgentForge Premium — UI Component Library
// Re-exports all primitive components

export { Button, buttonVariants, type ButtonProps } from "./Button";
export { Input, type InputProps } from "./Input";
export { Badge, badgeVariants, type BadgeProps } from "./Badge";
export { Card, type CardProps } from "./Card";
export { Select, type SelectProps } from "./Select";
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
} from "./DropdownMenu";
export type { DropdownMenuItemProps, DropdownMenuCheckboxItemProps, DropdownMenuRadioItemProps, DropdownMenuContentProps } from "./DropdownMenu";

export { Skeleton, SkeletonTextBlock, SkeletonCard } from "./Skeleton";

export { Progress } from "./Progress";
export type { ProgressProps } from "./Progress";

export { Slider } from "./Slider";
export type { SliderProps } from "./Slider";

export { Avatar, AvatarGroup } from "./Avatar";
export type { AvatarProps, AvatarSize, StatusType } from "./Avatar";

export { Breadcrumbs } from "./Breadcrumbs";
export type { BreadcrumbsProps, BreadcrumbItem } from "./Breadcrumbs";

export { Separator } from "./Separator";
export type { SeparatorProps } from "./Separator";

export { Kbd, KbdGroup } from "./Kbd";
export type { KbdProps, KbdGroupProps } from "./Kbd";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export { AnimatedCounter } from "./AnimatedCounter";
export type { AnimatedCounterProps } from "./AnimatedCounter";
export { Toaster, toast, ToastProvider, useToast, type ToastLevel } from "./Toast";

// Legacy exports (backward compatibility — will be removed after migration)
export { GlassCard } from "./GlassCard";
export { GlassButton } from "./GlassButton";
export { GlassInput, GlassTextarea } from "./GlassInput";
export { GlassBadge } from "./GlassBadge";
export { GlassDropdown } from "./GlassDropdown";
export { GlassTabs } from "./GlassTabs";

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./Dialog";

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
} from "./Sheet";
export type { SheetSide } from "./Sheet";

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./Tabs";
export type { TabsVariant } from "./Tabs";

export { Switch } from "./Switch";
export type { SwitchProps } from "./Switch";

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipWrapper,
} from "./Tooltip";
export type { TooltipContentProps } from "./Tooltip";

export {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
} from "./Popover";
export type { PopoverContentProps } from "./Popover";
