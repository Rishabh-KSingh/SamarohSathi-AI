import * as React from "react";
import { Sparkles, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { formatNumber } from "@/lib/utils";
import { BudgetTradeoffSuggestion, BudgetTradeoffItem } from "@/types/event";

export interface BudgetTradeoffsModalProps {
  isOpen: boolean;
  isLoading: boolean;
  tradeoffs: BudgetTradeoffSuggestion | null;
  appliedTradeoffs: string[];
  currencySymbol: string;
  priorities: string[];
  onApplyTradeoff: (item: BudgetTradeoffItem) => void;
  onApplyAllTradeoffs: () => void;
  onClose: () => void;
}

export function BudgetTradeoffsModal({
  isOpen,
  isLoading,
  tradeoffs,
  appliedTradeoffs,
  currencySymbol,
  priorities,
  onApplyTradeoff,
  onApplyAllTradeoffs,
  onClose,
}: BudgetTradeoffsModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tradeoffs-modal-title"
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#EBE5DC] space-y-5 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#C8963E]/15 text-[#C8963E]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="tradeoffs-modal-title" className="font-serif text-xl font-bold text-[#1F1A17]">
                AI Budget Trade-Off Recommendations
              </h3>
              <p className="text-xs text-[#6B635B]">
                Preserves your top priorities: &quot;{priorities.join(", ")}&quot;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-[#6B635B] hover:text-[#1F1A17] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-[#6B635B] space-y-2">
            <span className="w-6 h-6 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin inline-block" />
            <p>Analyzing category allocations and preserving your key priorities...</p>
          </div>
        ) : tradeoffs ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#F5F2EB] rounded-xl text-xs text-[#1F1A17] leading-relaxed">
              <p className="font-semibold text-sm mb-1">{tradeoffs.summary}</p>
              <p className="text-[#6B635B]">{tradeoffs.advice}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B635B]">
                  Suggested Adjustments ({tradeoffs.tradeoffs.length})
                </span>
                {appliedTradeoffs.length < tradeoffs.tradeoffs.length && (
                  <button
                    type="button"
                    onClick={onApplyAllTradeoffs}
                    className="text-xs font-bold text-[#5B1D2E] hover:underline"
                  >
                    Accept All Recommendations
                  </button>
                )}
              </div>

              {tradeoffs.tradeoffs.map((item, idx) => {
                const isApplied = appliedTradeoffs.includes(item.categoryName);
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isApplied
                        ? "bg-[#F0F7F3] border-[#3F7A56]/30"
                        : "bg-white border-[#EBE5DC] hover:border-[#C8963E]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#1F1A17]">
                            {item.categoryName}
                          </span>
                          {item.preservesPriority && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#FDF2F4] text-[#5B1D2E] rounded-full">
                              Priority Protected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B635B] mt-1">{item.reasoning}</p>

                        <div className="flex items-center gap-4 mt-2 font-mono text-xs">
                          <span className="text-[#6B635B]">
                            Current: {currencySymbol}{formatNumber(item.currentEstimate)}
                          </span>
                          <span className="text-[#1F1A17] font-semibold">
                            Proposed: {currencySymbol}{formatNumber(item.suggestedEstimate)}
                          </span>
                          <span className="text-[#3F7A56] font-bold">
                            Save {currencySymbol}{formatNumber(item.savings)}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant={isApplied ? "outline" : "primary"}
                        disabled={isApplied}
                        onClick={() => onApplyTradeoff(item)}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#3F7A56]" /> Applied
                          </>
                        ) : (
                          "Apply Change"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#EBE5DC] flex items-center justify-between text-xs">
              <span className="text-[#6B635B]">
                Projected Total:{" "}
                <strong className="text-[#1F1A17]">
                  {currencySymbol}{formatNumber(tradeoffs.projectedTotal)}
                </strong>
              </span>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
