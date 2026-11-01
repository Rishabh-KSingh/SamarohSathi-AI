import * as React from "react";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { BudgetCategory } from "@/types/event";

const HUES = [
  "#5B1D2E",
  "#C8963E",
  "#3F7A56",
  "#2B6CB0",
  "#805AD5",
  "#D69E2E",
  "#E53E3E",
  "#319795",
  "#718096",
  "#4A5568",
];

export interface BudgetAllocationBarProps {
  categories: BudgetCategory[];
  totalEstimated: number;
  currencySymbol: string;
}

export function BudgetAllocationBar({
  categories,
  totalEstimated,
  currencySymbol,
}: BudgetAllocationBarProps) {
  return (
    <Card className="p-5 border-[#EBE5DC]">
      <div className="flex items-center justify-between pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#6B635B]">
          Category Allocation Breakdown
        </span>
        <span className="text-xs text-[#6B635B]">
          {categories.length} Active Categories
        </span>
      </div>

      {/* Allocation Bar */}
      <div className="w-full h-3.5 bg-[#EBE5DC] rounded-full overflow-hidden flex">
        {categories.map((c, i) => {
          const pct = totalEstimated > 0 ? (c.estimatedAmount / totalEstimated) * 100 : 0;
          if (pct <= 0) return null;
          const color = HUES[i % HUES.length];
          return (
            <div
              key={c.id}
              style={{ width: `${pct}%`, backgroundColor: color }}
              className="h-full transition-all duration-300"
              title={`${c.name}: ${currencySymbol}${formatNumber(c.estimatedAmount)} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* Mini Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs text-[#6B635B]">
        {categories.slice(0, 6).map((c, i) => {
          const pct = totalEstimated > 0 ? Math.round((c.estimatedAmount / totalEstimated) * 100) : 0;
          const color = HUES[i % HUES.length];
          return (
            <div key={c.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[#1F1A17] font-medium">{c.name}:</span>
              <span>{pct}%</span>
            </div>
          );
        })}
        {categories.length > 6 && (
          <span className="text-xs text-[#6B635B] italic">+{categories.length - 6} more</span>
        )}
      </div>
    </Card>
  );
}
