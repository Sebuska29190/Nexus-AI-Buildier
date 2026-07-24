import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../utils";

interface AnimatedCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Target numeric value to count up to. */
  value: number;
  /** Animation duration in milliseconds. */
  duration?: number;
  /** Number of decimal places. */
  decimals?: number;
  /** Locale for number formatting. */
  locale?: string;
  /** Optional prefix (e.g., "$"). */
  prefix?: string;
  /** Optional suffix (e.g., "%", "K"). */
  suffix?: string;
  /** Easing function. Default: ease-out cubic. */
  easing?: (t: number) => number;
  /** Disable animation. */
  disableAnimation?: boolean;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({
  value,
  duration = 1200,
  decimals = 0,
  locale = "en-US",
  prefix = "",
  suffix = "",
  easing = easeOutCubic,
  disableAnimation = false,
  className,
  ...props
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(disableAnimation ? value : 0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const startValueRef = useRef<number>(0);

  useEffect(() => {
    if (disableAnimation) {
      setDisplayValue(value);
      return;
    }

    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();

    const from = startValueRef.current;
    const to = value;
    const totalDistance = Math.abs(to - from);

    // Skip animation for zero-distance or near-instant updates
    if (totalDistance < 0.001) {
      setDisplayValue(value);
      return;
    }

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const current = from + (to - from) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(to);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
    // Only re-run when target value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, disableAnimation]);

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayValue);

  return (
    <span className={cn("tabular-nums", className)} {...props}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export type { AnimatedCounterProps };
