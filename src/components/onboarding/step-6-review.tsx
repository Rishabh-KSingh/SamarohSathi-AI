"use client";

import * as React from "react";
import { Edit2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CURRENCY_OPTIONS, SPENDING_PRIORITIES, GUEST_AUDIENCE_OPTIONS } from "@/lib/constants";
import { OnboardingFormData, WizardStepId } from "@/types/event";
import { formatNumber } from "@/lib/utils";

interface Step6ReviewProps {
  formData: OnboardingFormData;
  onEditStep: (step: WizardStepId) => void;
}

export function Step6Review({
  formData,
  onEditStep,
}: Step6ReviewProps) {
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

  const audienceLabels = (formData.guestAudience || []).map((id) => {
    const found = GUEST_AUDIENCE_OPTIONS.find((a) => a.id === id);
    return found ? found.label : id;
  });

  return (
    <div className="space-y-6">
      {/* Step Introduction */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="accent">Final Step</Badge>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#3F7A56]">
            Ready to Plan
          </span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1F1A17] tracking-tight">
          Review Your Celebration Blueprint
        </h2>
        <p className="text-sm text-[#6B635B] mt-1">
          Please verify all entered details. You can easily click &quot;Edit&quot; on any section to make adjustments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section 1: Essentials */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C8963E]">
                1. Celebration Essentials
              </span>
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B1D2E] hover:underline cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-[#6B635B]">Event Title</p>
                <p className="font-serif text-lg font-semibold text-[#1F1A17]">
                  {formData.name}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="primary">{formData.occasion === "Other" ? formData.customOccasion : formData.occasion}</Badge>
                <Badge variant="default">{formData.guestCount} Guests</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-[#6B635B]">
                <div>
                  <span className="font-medium text-[#1F1A17] block">Date</span>
                  <span>{formData.eventDate || "Not set"}</span>
                </div>
                <div>
                  <span className="font-medium text-[#1F1A17] block">Location</span>
                  <span>{formData.location || "Not set"}</span>
                </div>
              </div>

              {audienceLabels.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs text-[#6B635B] block mb-1">Audience Profile:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {audienceLabels.map((lbl, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-[#F5F2EB] border border-[#EBE5DC] text-[#1F1A17] px-2 py-0.5 rounded-md"
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Section 2: Financial Framework */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C8963E]">
                2. Financial Framework
              </span>
              <button
                type="button"
                onClick={() => onEditStep(2)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B1D2E] hover:underline cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-[#6B635B]">Total Available Budget</p>
                <p className="font-mono text-2xl font-bold text-[#5B1D2E]">
                  {currencyObj.symbol}
                  {formatNumber(Number(formData.totalBudget))}{" "}
                  <span className="text-xs font-sans text-[#6B635B] font-normal">
                    ({formData.currency})
                  </span>
                </p>
              </div>

              {perGuestCost !== null && (
                <div className="p-2.5 rounded-lg bg-[#F5F2EB] text-xs flex justify-between items-center">
                  <span className="text-[#6B635B]">Per-guest allocation:</span>
                  <span className="font-mono font-semibold text-[#1F1A17]">
                    {currencyObj.symbol}
                    {formatNumber(perGuestCost)} / guest
                  </span>
                </div>
              )}

              <div>
                <p className="text-xs text-[#6B635B] mb-1">Flexibility Policy</p>
                <Badge variant={formData.budgetFlexibility === "fixed" ? "error" : "accent"}>
                  {formData.budgetFlexibility === "fixed"
                    ? "Strict Fixed Ceiling"
                    : formData.budgetFlexibility === "moderate"
                    ? "Moderate Flexibility (10-15%)"
                    : "Flexible & Quality-Led"}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Section 3: Spending Priorities */}
      <Card className="p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C8963E]">
              3. Spending Priorities Hierarchy
            </span>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B1D2E] hover:underline cursor-pointer"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {(formData.priorities || []).map((key, index) => {
              const item = SPENDING_PRIORITIES.find((p) => p.id === key);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F2EB]/60 border border-[#EBE5DC]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#5B1D2E] text-white flex items-center justify-center font-bold text-[10px]">
                      #{index + 1}
                    </span>
                    <span className="font-semibold text-[#1F1A17]">
                      {item?.label || key}
                    </span>
                  </div>
                  {index === 0 && (
                    <span className="text-[10px] text-[#C8963E] font-bold uppercase">
                      Highest
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
