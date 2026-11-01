import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Let's plan something memorable.",
  description = "You don't have an active celebration plan yet. Start with our guided onboarding to structure your budget, guest count, and actionable timeline.",
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 lg:p-16 bg-white border border-[#EBE5DC] rounded-2xl shadow-[0_1px_3px_rgba(31,26,23,0.03)] max-w-2xl mx-auto",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#F5F2EB] border border-[#EBE5DC] flex items-center justify-center text-[#C8963E] mb-6 shadow-xs">
        {icon || <Sparkles className="w-7 h-7" strokeWidth={1.75} />}
      </div>
      <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#1F1A17] tracking-tight mb-3">
        {title}
      </h3>
      <p className="font-sans text-sm sm:text-base text-[#6B635B] max-w-md leading-relaxed mb-8">
        {description}
      </p>
      {action && <div className="flex flex-wrap gap-3 justify-center">{action}</div>}
    </div>
  );
}
