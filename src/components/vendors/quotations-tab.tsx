"use client";

import * as React from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { VendorQuotation, BudgetCategory } from "@/types/event";
import { formatCurrency } from "@/lib/utils";

interface QuotationsTabProps {
  quotations: VendorQuotation[];
  budgetCategories: BudgetCategory[];
  onOpenAddQuotation: () => void;
  onOpenEditQuotation: (quotation: VendorQuotation) => void;
  onDeleteQuotation: (id: string) => void;
  onSelectPrimaryQuotation: (quotation: VendorQuotation) => void;
  onApplyQuotationToBudget: (quotation: VendorQuotation) => void;
}

export function QuotationsTab({
  quotations,
  budgetCategories,
  onOpenAddQuotation,
  onOpenEditQuotation,
  onDeleteQuotation,
  onSelectPrimaryQuotation,
  onApplyQuotationToBudget,
}: QuotationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
            Celebration Quotations
          </h3>
          <p className="text-xs text-[#6B635B]">
            Record detailed vendor proposals, verify per-guest coverage, inspect hidden surcharges, and connect to budget categories.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onOpenAddQuotation}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Quotation
        </Button>
      </div>

      {quotations.length === 0 ? (
        <EmptyState
          title="No Quotations Added Yet"
          description="Add formal or informal quotes from venues, caterers, decorators, or photographers to analyze their breakdown."
          action={
            <Button variant="primary" size="md" onClick={onOpenAddQuotation}>
              <Plus className="w-4 h-4 mr-1.5" /> Add First Quotation
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quotations.map((q) => {
            const linkedCat = budgetCategories.find((c) => c.id === q.budgetCategoryId);
            const perGuest = q.guestCoverage > 0 ? Math.round(q.quotedAmount / q.guestCoverage) : 0;
            const isOverBudget = linkedCat && q.quotedAmount > linkedCat.estimatedAmount;
            const variance = linkedCat ? q.quotedAmount - linkedCat.estimatedAmount : 0;

            return (
              <Card
                key={q.id}
                className={`p-6 space-y-4 relative transition-all ${
                  q.isSelected
                    ? "border-2 border-[#3F7A56] bg-white shadow-sm"
                    : "border border-[#EBE5DC] bg-white hover:border-[#C8963E]/60"
                }`}
              >
                {/* Top Bar: Category & Selection Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8963E]">
                        {q.category}
                      </span>
                      {q.isSelected && (
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-[#F0FFF4] text-[#3F7A56] border border-[#C6F6D5] rounded-full flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5" /> Primary Selected Quote
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif text-xl font-bold text-[#1F1A17] mt-0.5">
                      {q.vendorName}
                    </h4>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-2xl font-bold text-[#1F1A17]">
                      {formatCurrency(q.quotedAmount)}
                    </div>
                    {q.guestCoverage > 0 && (
                      <span className="text-xs text-[#6B635B] block">
                        ~{formatCurrency(perGuest)}/pax ({q.guestCoverage} guests)
                      </span>
                    )}
                  </div>
                </div>

                {/* Budget Connection Banner */}
                {linkedCat ? (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      isOverBudget
                        ? "bg-[#FFF9F0] border-[#F6E5C8] text-[#C05621]"
                        : "bg-[#FAF8F5] border-[#EBE5DC] text-[#3F7A56]"
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-[#1F1A17] block">
                        Linked Category: {linkedCat.name}
                      </span>
                      <span className="text-[#6B635B]">
                        Estimated Budget: {formatCurrency(linkedCat.estimatedAmount)} •{" "}
                        {isOverBudget ? (
                          <strong className="text-[#C05621]">
                            +{formatCurrency(variance)} over estimate
                          </strong>
                        ) : (
                          <strong className="text-[#3F7A56]">
                            {formatCurrency(Math.abs(variance))} under estimate
                          </strong>
                        )}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApplyQuotationToBudget(q)}
                      className="text-xs py-1 px-2.5 h-auto text-[#1F1A17]"
                      title="Apply to Budget Category Actuals"
                    >
                      Apply to Actuals
                    </Button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#FAF8F5] border border-dashed border-[#EBE5DC] rounded-xl text-xs text-[#6B635B] flex items-center justify-between">
                    <span>Not linked to a budget category.</span>
                    <button
                      type="button"
                      onClick={() => onOpenEditQuotation(q)}
                      className="text-xs font-semibold text-[#5B1D2E] hover:underline cursor-pointer"
                    >
                      Link Category
                    </button>
                  </div>
                )}

                {/* Included Services List */}
                <div>
                  <span className="text-xs font-semibold text-[#1F1A17] block mb-1.5 uppercase tracking-wider">
                    Included Deliverables ({q.includedServices.length}):
                  </span>
                  <ul className="space-y-1">
                    {q.includedServices.map((s, i) => (
                      <li key={i} className="text-xs text-[#4A4540] flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#3F7A56] mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Additional Charges / Hidden Cost Risk */}
                {q.additionalCharges.length > 0 && (
                  <div className="p-3 bg-[#FFF5F5] border border-[#FED7D7] rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-[#C05621] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Additional / Unbundled Charges:
                    </span>
                    <ul className="list-disc list-inside text-[#822727] space-y-0.5 pl-1">
                      {q.additionalCharges.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Information Indicators */}
                {q.missingInformation.length > 0 && (
                  <div className="p-3 bg-[#FFF9F0] border border-[#F6E5C8] rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-[#C8963E] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Missing Information to Clarify:
                    </span>
                    <ul className="list-disc list-inside text-[#744210] space-y-0.5 pl-1">
                      {q.missingInformation.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Terms */}
                {q.terms && (
                  <div className="text-xs text-[#6B635B] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EBE5DC]">
                    <strong className="text-[#1F1A17] block mb-0.5">Commercial Terms:</strong>
                    <p>{q.terms}</p>
                  </div>
                )}

                {/* Card Actions */}
                <div className="pt-3 border-t border-[#EBE5DC] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!q.isSelected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectPrimaryQuotation(q)}
                        className="text-xs py-1 px-2.5 h-auto"
                      >
                        Set as Primary
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenEditQuotation(q)}
                      className="p-1.5 text-[#6B635B] hover:text-[#5B1D2E] hover:bg-[#FAF8F5] rounded-md transition-colors"
                      title="Edit Quotation"
                      aria-label={`Edit quotation from ${q.vendorName}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteQuotation(q.id)}
                      className="p-1.5 text-[#6B635B] hover:text-[#C05621] hover:bg-[#FFF5F5] rounded-md transition-colors"
                      title="Delete Quotation"
                      aria-label={`Delete quotation from ${q.vendorName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
