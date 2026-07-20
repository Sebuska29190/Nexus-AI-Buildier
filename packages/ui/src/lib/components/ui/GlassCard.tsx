import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export function GlassCard({
  children,
  className = "",
  hover = true,
  padding = "md",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`glass-card ${paddingMap[padding]} ${
        hover ? "hover:border-[rgba(245,158,11,0.25)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_40px_rgba(245,158,11,0.06)]" : ""
      } transition-all duration-[250ms] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
