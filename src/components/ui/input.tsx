import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "w-full px-4 py-2.5 bg-white text-[#1F1A17] text-sm rounded-xl border border-[#EBE5DC] placeholder:text-[#6B635B]/50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#5B1D2E] focus:border-transparent disabled:opacity-50 disabled:bg-[#F5F2EB] disabled:cursor-not-allowed",
            error && "border-[#C23B38] focus:ring-[#C23B38]",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#C23B38] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#6B635B]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
