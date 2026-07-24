import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../utils";

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Show current value above thumb. */
  showValue?: boolean;
  /** Format the displayed value. */
  formatValue?: (value: number) => string;
}

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showValue = false, formatValue, value, defaultValue, ...props }, ref) => {
  const displayValue =
    value?.[0] ?? defaultValue?.[0] ?? 0;

  return (
    <div className="relative inline-flex w-full">
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          "group slider-root",
          className
        )}
        value={value}
        defaultValue={defaultValue}
        {...props}
      >
        <SliderPrimitive.Track
          className={cn(
            "relative h-1.5 w-full grow overflow-hidden rounded-full",
            "bg-[rgba(255,255,255,0.08)]"
          )}
        >
          <SliderPrimitive.Range
            className={cn(
              "absolute h-full bg-gradient-to-r from-cyan-500 to-violet-400 rounded-full",
              "transition-colors"
            )}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block h-5 w-5 rounded-full",
            "bg-[#161618] border-2 border-cyan-400",
            "shadow-[0_0_0_3px_rgba(6,182,212,0.15),0_2px_8px_rgba(0,0,0,0.4)]",
            "transition-all duration-150",
            "hover:shadow-[0_0_0_5px_rgba(6,182,212,0.2),0_2px_12px_rgba(0,0,0,0.5)] hover:scale-110",
            "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(6,182,212,0.4)]",
            "active:scale-95",
            "cursor-grab active:cursor-grabbing"
          )}
        />
      </SliderPrimitive.Root>

      {showValue && (
        <span className={cn(
          "absolute -top-7 text-[11px] font-mono text-[#A1A1AA]",
          "bg-[#111113] border border-[rgba(255,255,255,0.08)] rounded px-1.5 py-0.5",
          "pointer-events-none select-none",
          "left-[var(--thumb-pos,50%)] -translate-x-1/2"
        )}>
          {formatValue ? formatValue(displayValue) : displayValue}
        </span>
      )}
    </div>
  );
});
Slider.displayName = "Slider";

export { Slider };
export type { SliderProps };
