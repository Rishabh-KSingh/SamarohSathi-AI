import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B1D2E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF9F5] disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[#5B1D2E] text-white hover:bg-[#4a1725] active:bg-[#3d131f] shadow-sm",
      secondary:
        "bg-[#F5F2EB] text-[#1F1A17] border border-[#EBE5DC] hover:bg-[#EBE5DC]/70 active:bg-[#E2DBD1]",
      outline:
        "bg-transparent text-[#1F1A17] border border-[#EBE5DC] hover:bg-[#F5F2EB] active:bg-[#EBE5DC]/50",
      ghost:
        "bg-transparent text-[#6B635B] hover:text-[#1F1A17] hover:bg-[#F5F2EB]",
      accent:
        "bg-[#C8963E] text-[#1F1A17] font-semibold hover:bg-[#ba8733] active:bg-[#ad7a2b] shadow-sm",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
