import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#EBE5DC]",
        className
      )}
    >
      <div className="space-y-1.5">
        {eyebrow && (
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#A66E1E] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-[#1F1A17] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="font-sans text-sm sm:text-base text-[#544E47] max-w-2xl pt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
