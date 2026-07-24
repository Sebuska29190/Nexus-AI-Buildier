import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../../utils";

/* ------------------------------------------------------------------ */
/*  Switch                                                             */
/* ------------------------------------------------------------------ */

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
}

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, description, id: idProp, ...props }, ref) => {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;
  const descriptionId = description ? `${id}-desc` : undefined;

  const switchElement = (
    <SwitchPrimitive.Root
      ref={ref}
      id={id}
      aria-describedby={descriptionId}
      className={cn(
        "peer inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center",
        "rounded-full border-2 border-transparent transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=unchecked]:bg-white/[0.12]",
        "data-[state=checked]:bg-[#06b6d4]",
        "data-[state=checked]:shadow-[0_0_12px_rgba(6,182,212,0.4),0_0_24px_rgba(6,182,212,0.15)]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-[18px] w-[18px] rounded-full",
          "bg-white shadow-lg",
          "transition-transform duration-200 ease-out",
          "data-[state=checked]:translate-x-[20px]",
          "data-[state=unchecked]:translate-x-[0]",
        )}
      />
    </SwitchPrimitive.Root>
  );

  if (!label && !description) return switchElement;

  return (
    <div className="flex items-start gap-3">
      {switchElement}
      <div className="grid gap-1 leading-none">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "text-sm font-medium leading-none text-white/90 cursor-pointer",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            )}
          >
            {label}
          </label>
        )}
        {description && (
          <p id={descriptionId} className="text-xs text-white/40">
            {description}
          </p>
        )}
      </div>
    </div>
  );
});
Switch.displayName = "Switch";

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export { Switch, type SwitchProps };
