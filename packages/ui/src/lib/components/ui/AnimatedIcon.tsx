import React from "react";

interface AnimatedIconProps {
  children: React.ReactNode;
  className?: string;
  animation?: "hover" | "pulse" | "spin" | "bounce";
}

export function AnimatedIcon({ children, className = "", animation = "hover" }: AnimatedIconProps) {
  const animationClass = {
    hover: "transition-all duration-200 hover:scale-110 hover:text-[#6366f1]",
    pulse: "animate-glow-pulse",
    spin: "animate-spin",
    bounce: "animate-bounce",
  }[animation];

  return (
    <span className={`inline-flex items-center justify-center ${animationClass} ${className}`}>
      {children}
    </span>
  );
}
