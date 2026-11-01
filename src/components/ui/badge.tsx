import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "accent" | "success" | "warning" | "error" | "outline";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#F5F2EB] text-[#1F1A17] border border-[#EBE5DC]",
    primary: "bg-[#5B1D2E] text-white border border-[#4a1725]",
    accent: "bg-[#FAF3E6] text-[#7E5718] border border-[#E5CE9F]",
    success: "bg-[#EAF3ED] text-[#2D5D40] border border-[#BFDFCB]",
    warning: "bg-[#FDF3E6] text-[#9A5916] border border-[#F3CD9A]",
    error: "bg-[#FBEBEB] text-[#8C2421] border border-[#F0BDBD]",
    outline: "bg-transparent text-[#6B635B] border border-[#EBE5DC]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
