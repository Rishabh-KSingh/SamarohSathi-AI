"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { CURRENCY_OPTIONS } from "@/lib/constants";
import { OnboardingFormData, BudgetFlexibility } from "@/types/event";
import { ValidationErrors } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface Step2BudgetProps {
  formData: OnboardingFormData;
  errors: ValidationErrors;
  onChange: (fields: Partial<OnboardingFormData>) => void;
}

export function Step2Budget({ formData, errors, onChange }: Step2BudgetProps) {
  const currencyObj =
    CURRENCY_OPTIONS.find((c) => c.code === formData.currency) || CURRENCY_OPTIONS[0];

  const perGuestCost = React.useMemo(() => {
    const budgetNum = Number(formData.totalBudget);
    const guestNum = Number(formData.guestCount);
    if (budgetNum > 0 && guestNum > 0) {
      return Math.round(budgetNum / guestNum);
    }
    return null;
  }, [formData.totalBudget, formData.guestCount]);

  const flexibilityOptions: {
    id: BudgetFlexibility;
    title: string;
    description: string;
    badge: string;
  }[] = [
    {
      id: "fixed",
      title: "Strict & Fixed Ceiling",
      description: "Hard stop budget limit. Cannot exceed under any circumstances.",
      badge: "Non-negotiable",
    },
    {
      id: "moderate",
      title: "Moderate Flexibility",
      description: "Allow a small 10-15% buffer if high-impact value or dream vendors justify it.",
      badge: "Standard",
    },
    {
      id: "flexible",
      title: "Flexible & Quality-Led",
      description: "Guest comfort and premium execution take priority over strict numerical caps.",
      badge: "Adaptable",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Step Introduction */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1F1A17] tracking-tight">
          Budget &amp; Boundaries
        </h2>
        <p className="text-sm text-[#6B635B] mt-1">
          Define your financial framework so planning remains realistic and stress-free.
        </p>
      </div>

      {/* Budget and Currency Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Currency Selector */}
        <div>
          <label
            htmlFor="budget-currency"
            className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] select-none block mb-1.5"
          >
            Currency *
          </label>
          <select
            id="budget-currency"
            value={formData.currency}
            onChange={(e) => onChange({ currency: e.target.value })}
            className="w-full px-4 py-2.5 bg-white text-[#1F1A17] text-sm rounded-xl border border-[#EBE5DC] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#5B1D2E] focus:border-transparent cursor-pointer"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.name}
              </option>
            ))}
          </select>
          {errors.currency && (
            <p className="text-xs text-[#C23B38] font-medium mt-1">{errors.currency}</p>
          )}
        </div>

        {/* Total Budget Input */}
        <div className="sm:col-span-2">
          <Input
            id="total-budget"
            type="number"
            min={100}
            step={1000}
            label={`Total Available Budget (${currencyObj.symbol}) *`}
            placeholder="e.g., 500000"
            value={formData.totalBudget}
            error={errors.totalBudget}
            helperText="Overall planned expense ceiling for this entire celebration."
            onChange={(e) => {
              const val = e.target.value;
              onChange({ totalBudget: val === "" ? "" : Number(val) });
            }}
          />
        </div>
      </div>

      {/* Instant Dynamic Per-Guest Insight Card */}
      {perGuestCost !== null && (
        <div className="p-4 rounded-xl bg-[#F5F2EB] border border-[#EBE5DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-white border border-[#EBE5DC] flex items-center justify-center text-[#5B1D2E] font-bold">
              {currencyObj.symbol}
            </span>
            <div>
              <p className="font-semibold text-[#1F1A17]">
                Calculated Per-Guest Allocation
              </p>
              <p className="text-[#6B635B]">
                Based on {formData.guestCount} guests and {currencyObj.symbol}
                {Number(formData.totalBudget).toLocaleString()} total budget.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white border border-[#EBE5DC] font-mono text-sm font-semibold text-[#5B1D2E]">
            {currencyObj.symbol}
            {perGuestCost.toLocaleString()} / guest
          </div>
        </div>
      )}

      {/* Budget Flexibility Selection */}
      <div className="space-y-3 pt-2 border-t border-[#EBE5DC]">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] select-none block">
            Budget Flexibility Policy *
          </label>
          <p className="text-xs text-[#6B635B] mt-0.5">
            How should we approach vendor selections and unexpected adjustments?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {flexibilityOptions.map((opt) => {
            const isSelected = formData.budgetFlexibility === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ budgetFlexibility: opt.id })}
                className={cn(
                  "p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all duration-150 cursor-pointer select-none",
                  isSelected
                    ? "bg-[#5B1D2E]/5 border-[#5B1D2E] ring-2 ring-[#5B1D2E]/20 shadow-xs"
                    : "bg-white border-[#EBE5DC] hover:bg-[#F5F2EB]/50 hover:border-[#6B635B]/30"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-medium text-sm",
                        isSelected ? "text-[#5B1D2E] font-bold" : "text-[#1F1A17]"
                      )}
                    >
                      {opt.title}
                    </span>
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center text-[10px]",
                        isSelected
                          ? "bg-[#5B1D2E] text-white border-[#5B1D2E]"
                          : "border-[#6B635B]/30 bg-white"
                      )}
                    >
                      {isSelected && "✓"}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B635B] leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block w-fit",
                    isSelected
                      ? "bg-[#5B1D2E] text-white"
                      : "bg-[#F5F2EB] text-[#6B635B]"
                  )}
                >
                  {opt.badge}
                </span>
              </button>
            );
          })}
        </div>
        {errors.budgetFlexibility && (
          <p className="text-xs text-[#C23B38] font-medium mt-1">
            {errors.budgetFlexibility}
          </p>
        )}
      </div>
    </div>
  );
}
