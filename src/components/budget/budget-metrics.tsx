import * as React from "react";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export interface BudgetMetricsProps {
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  remainingFromEstimated: number;
  remainingFromActual: number;
  estimatedUtilizationPct: number;
  actualUtilizationPct: number;
  isOverBudget: boolean;
  overrunAmount: number;
  currencySymbol: string;
  guestCount: number;
  budgetFlexibility: string;
}

export function BudgetMetrics({
  totalBudget,
  totalEstimated,
  totalActual,
  remainingFromEstimated,
  remainingFromActual,
  estimatedUtilizationPct,
  actualUtilizationPct,
  isOverBudget,
  overrunAmount,
  currencySymbol,
  guestCount,
  budgetFlexibility,
}: BudgetMetricsProps) {
  const perGuestCost = guestCount > 0 ? Math.round(totalEstimated / guestCount) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Available Budget */}
      <Card className="p-5 border-[#EBE5DC]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
          Total Available Budget
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xs text-[#6B635B]">{currencySymbol}</span>
          <span className="font-serif text-2xl font-bold text-[#1F1A17]">
            {formatNumber(totalBudget)}
          </span>
        </div>
        <p className="text-[11px] text-[#6B635B] mt-1">
          Flexibility: <span className="font-medium capitalize text-[#1F1A17]">{budgetFlexibility}</span>
        </p>
      </Card>

      {/* Card 2: Estimated Expenses */}
      <Card className="p-5 border-[#EBE5DC]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
            Total Estimated
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isOverBudget ? "bg-[#FFF5F0] text-[#C05621]" : "bg-[#F0F7F3] text-[#3F7A56]"
            }`}
          >
            {estimatedUtilizationPct}% Allocated
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xs text-[#6B635B]">{currencySymbol}</span>
          <span
            className={`font-serif text-2xl font-bold ${
              isOverBudget ? "text-[#C05621]" : "text-[#1F1A17]"
            }`}
          >
            {formatNumber(totalEstimated)}
          </span>
        </div>
        <p className="text-[11px] text-[#6B635B] mt-1">
          {isOverBudget
            ? `+${currencySymbol}${formatNumber(overrunAmount)} over envelope`
            : `${currencySymbol}${formatNumber(remainingFromEstimated)} unallocated`}
        </p>
      </Card>

      {/* Card 3: Actual Booked Expenses */}
      <Card className="p-5 border-[#EBE5DC]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
            Actual Paid / Committed
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F2EB] text-[#1F1A17]">
            {actualUtilizationPct}% Spent
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xs text-[#6B635B]">{currencySymbol}</span>
          <span className="font-serif text-2xl font-bold text-[#1F1A17]">
            {formatNumber(totalActual)}
          </span>
        </div>
        <p className="text-[11px] text-[#6B635B] mt-1">
          Remaining actual cash:{" "}
          <span className="font-semibold text-[#3F7A56]">
            {currencySymbol}{formatNumber(remainingFromActual)}
          </span>
        </p>
      </Card>

      {/* Card 4: Per Guest Cost */}
      <Card className="p-5 border-[#EBE5DC]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
          Per Guest Estimated Cost
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xs text-[#6B635B]">{currencySymbol}</span>
          <span className="font-serif text-2xl font-bold text-[#1F1A17]">
            {formatNumber(perGuestCost)}
          </span>
        </div>
        <p className="text-[11px] text-[#6B635B] mt-1">
          Based on <span className="font-medium text-[#1F1A17]">{guestCount} invited guests</span>
        </p>
      </Card>
    </div>
  );
}
