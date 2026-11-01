"use client";

import * as React from "react";
import { ArrowUp, ArrowDown, X } from "lucide-react";
import { SPENDING_PRIORITIES } from "@/lib/constants";
import { OnboardingFormData, SpendingPriorityKey } from "@/types/event";
import { ValidationErrors } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface Step4PrioritiesProps {
  formData: OnboardingFormData;
  errors: ValidationErrors;
  onChange: (fields: Partial<OnboardingFormData>) => void;
}

export function Step4Priorities({
  formData,
  errors,
  onChange,
}: Step4PrioritiesProps) {
  const currentPriorities = formData.priorities || [];

  const togglePriority = (key: SpendingPriorityKey) => {
    if (currentPriorities.includes(key)) {
      onChange({ priorities: currentPriorities.filter((p) => p !== key) });
    } else {
      onChange({ priorities: [...currentPriorities, key] });
    }
  };

  const movePriority = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentPriorities.length) return;

    const reordered = [...currentPriorities];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    onChange({ priorities: reordered });
  };

  const availableList = SPENDING_PRIORITIES.filter(
    (p) => !currentPriorities.includes(p.id)
  );

  return (
    <div className="space-y-6">
      {/* Step Introduction */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1F1A17] tracking-tight">
          Spending Priorities &amp; Ranking
        </h2>
        <p className="text-sm text-[#6B635B] mt-1">
          Select what matters most to your family and rank them in order of importance.
        </p>
      </div>

      {errors.priorities && (
        <div className="p-3 rounded-xl bg-[#C23B38]/10 border border-[#C23B38]/30 text-xs font-semibold text-[#C23B38]">
          {errors.priorities}
        </div>
      )}

      {/* Active Ranked Priorities List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] select-none">
            Your Ranked Priorities ({currentPriorities.length} selected)
          </label>
          <span className="text-[11px] text-[#6B635B]">
            Use arrows to adjust hierarchy
          </span>
        </div>

        {currentPriorities.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-[#EBE5DC] text-center bg-white">
            <p className="text-sm font-medium text-[#1F1A17]">No priorities selected yet</p>
            <p className="text-xs text-[#6B635B] mt-1">
              Select one or more categories below to build your ranked priority hierarchy.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentPriorities.map((key, index) => {
              const item = SPENDING_PRIORITIES.find((p) => p.id === key);
              if (!item) return null;
              const isFirst = index === 0;
              const isLast = index === currentPriorities.length - 1;

              return (
                <div
                  key={key}
                  className={cn(
                    "p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 transition-all duration-150 bg-white shadow-xs",
                    isFirst
                      ? "border-[#5B1D2E] bg-gradient-to-r from-[#5B1D2E]/5 to-transparent"
                      : "border-[#EBE5DC]"
                  )}
                >
                  {/* Left: Rank Badge & Info */}
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                        isFirst
                          ? "bg-[#5B1D2E] text-white"
                          : "bg-[#F5F2EB] text-[#1F1A17] border border-[#EBE5DC]"
                      )}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1F1A17]">
                          {item.label}
                        </span>
                        {isFirst && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C8963E]/20 text-[#855e1c] px-2 py-0.5 rounded-full">
                            Top Priority
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B635B] line-clamp-1 hidden sm:block">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Reordering Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => movePriority(index, "up")}
                      title="Move Priority Up"
                      className="p-1.5 rounded-lg border border-[#EBE5DC] text-[#6B635B] hover:text-[#1F1A17] hover:bg-[#F5F2EB] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => movePriority(index, "down")}
                      title="Move Priority Down"
                      className="p-1.5 rounded-lg border border-[#EBE5DC] text-[#6B635B] hover:text-[#1F1A17] hover:bg-[#F5F2EB] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePriority(key)}
                      title="Remove from Priorities"
                      className="p-1.5 rounded-lg border border-[#EBE5DC] text-[#C23B38] hover:bg-[#C23B38]/10 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Priorities to Add */}
      {availableList.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#EBE5DC]">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] select-none block">
            Add Additional Priorities
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availableList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => togglePriority(item.id)}
                className="p-3 rounded-xl border border-[#EBE5DC] bg-white hover:bg-[#F5F2EB] hover:border-[#6B635B]/30 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs sm:text-sm font-medium text-[#1F1A17]">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-[#6B635B] line-clamp-1">
                    {item.description}
                  </p>
                </div>
                <span className="w-6 h-6 rounded-lg bg-[#F5F2EB] border border-[#EBE5DC] flex items-center justify-center text-[#5B1D2E] shrink-0 font-bold text-xs">
                  +
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
