"use client";

import * as React from "react";
import {
  Plus,
  Sparkles,
  AlertTriangle,
  Scale,
  Users,
  Check,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  VendorCategory,
  VendorQuotation,
  QuotationComparisonResult,
  EventData,
} from "@/types/event";
import { formatCurrency } from "@/lib/utils";

interface QuotationComparisonTabProps {
  comparisonCategory: VendorCategory;
  onComparisonCategoryChange: (category: VendorCategory) => void;
  vendorCategories: VendorCategory[];
  quotations: VendorQuotation[];
  selectedQuoteIds: string[];
  onToggleQuoteSelection: (quoteId: string) => void;
  onRunComparison: () => void;
  isLoadingComparison: boolean;
  comparisonResult: QuotationComparisonResult | null;
  comparisonSource: "gemini" | "deterministic-fallback";
  event: EventData;
  onOpenAddQuotation: (vendorId?: string, category?: VendorCategory) => void;
}

export function QuotationComparisonTab({
  comparisonCategory,
  onComparisonCategoryChange,
  vendorCategories,
  quotations,
  selectedQuoteIds,
  onToggleQuoteSelection,
  onRunComparison,
  isLoadingComparison,
  comparisonResult,
  comparisonSource,
  event,
  onOpenAddQuotation,
}: QuotationComparisonTabProps) {
  const categoryQuotes = quotations.filter((q) => q.category === comparisonCategory);
  const activeComparisonQuotes = categoryQuotes.filter((q) => selectedQuoteIds.includes(q.id));

  return (
    <div className="space-y-6">
      {/* Category Selector & Controls */}
      <Card className="p-5 bg-white border border-[#EBE5DC]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
              Quotation Comparison Matrix
            </h3>
            <p className="text-xs text-[#6B635B]">
              Select a category and tick at least 2 quotes to evaluate value-for-money, guest coverage, and hidden surcharges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6B635B]">Category:</span>
              <select
                value={comparisonCategory}
                onChange={(e) => onComparisonCategoryChange(e.target.value as VendorCategory)}
                className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EBE5DC] rounded-lg text-xs font-semibold text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
              >
                {vendorCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({quotations.filter((q) => q.category === cat).length} quotes)
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={onRunComparison}
              disabled={isLoadingComparison || activeComparisonQuotes.length < 2}
              className="gap-2"
            >
              {isLoadingComparison ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing True Value...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C8963E]" />
                  Run AI Value Comparison
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quotations selection checkboxes */}
        <div className="mt-4 pt-4 border-t border-[#EBE5DC]">
          <span className="text-xs font-semibold text-[#1F1A17] block mb-2">
            Select Quotes to Compare in {comparisonCategory}:
          </span>
          <div className="flex flex-wrap gap-3">
            {categoryQuotes.map((q) => {
              const isChecked = selectedQuoteIds.includes(q.id);
              return (
                <label
                  key={q.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isChecked
                      ? "bg-[#FDF2F4] border-[#5B1D2E] text-[#5B1D2E] font-semibold"
                      : "bg-[#FAF8F5] border-[#EBE5DC] text-[#6B635B]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleQuoteSelection(q.id)}
                    className="rounded text-[#5B1D2E] focus:ring-[#5B1D2E]"
                  />
                  <span>
                    {q.vendorName} ({formatCurrency(q.quotedAmount)})
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Check if less than 2 quotes */}
      {categoryQuotes.length < 2 ? (
        <EmptyState
          title={`Need At Least 2 Quotes for ${comparisonCategory}`}
          description="Add another quotation in this category to run a side-by-side comparison matrix and AI value trade-off analysis."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => onOpenAddQuotation(undefined, comparisonCategory)}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Second Quote in {comparisonCategory}
            </Button>
          }
        />
      ) : (
        <>
          {/* Side-by-Side Comparison Matrix */}
          <div className="space-y-4">
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#EBE5DC] bg-white shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EBE5DC] text-xs uppercase tracking-wider text-[#6B635B]">
                    <th className="py-4 px-5 font-bold w-1/4">Evaluation Attribute</th>
                    {activeComparisonQuotes.map((q) => (
                      <th key={q.id} className="py-4 px-5 font-bold text-[#1F1A17]">
                        <div className="text-base font-serif">{q.vendorName}</div>
                        <div className="font-mono text-xs text-[#5B1D2E] font-bold">
                          {formatCurrency(q.quotedAmount)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE5DC] text-xs">
                  {/* Guest Coverage */}
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40">
                      Guest Coverage
                    </td>
                    {activeComparisonQuotes.map((q) => {
                      const coversAll = q.guestCoverage >= event.guestCount;
                      return (
                        <td key={q.id} className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 font-medium">
                            {q.guestCoverage > 0 ? (
                              <>
                                <Users className="w-3.5 h-3.5 text-[#C8963E]" />
                                <span>
                                  {q.guestCoverage} pax{" "}
                                  {coversAll ? (
                                    <span className="text-[#3F7A56] font-semibold">
                                      (Full {event.guestCount} event capacity covered)
                                    </span>
                                  ) : (
                                    <span className="text-[#C05621] font-semibold">
                                      (Shortfall of {event.guestCount - q.guestCoverage} guests!)
                                    </span>
                                  )}
                                </span>
                              </>
                            ) : (
                              <span className="text-[#6B635B]">Flat lump-sum scope</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Effective Cost Per Guest */}
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40">
                      Cost per Attendee
                    </td>
                    {activeComparisonQuotes.map((q) => {
                      const perGuest = q.guestCoverage > 0 ? Math.round(q.quotedAmount / q.guestCoverage) : 0;
                      return (
                        <td key={q.id} className="py-3.5 px-5 font-mono">
                          {perGuest > 0 ? `~${formatCurrency(perGuest)}/pax` : "N/A"}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Included Deliverables Count */}
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40">
                      Included Services
                    </td>
                    {activeComparisonQuotes.map((q) => (
                      <td key={q.id} className="py-3.5 px-5 align-top">
                        <span className="font-semibold text-[#3F7A56] block mb-1">
                          {q.includedServices.length} Inclusions:
                        </span>
                        <ul className="space-y-1">
                          {q.includedServices.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-[#4A4540]">
                              <Check className="w-3 h-3 text-[#3F7A56] mt-0.5 flex-shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* Extra & Hidden Surcharges */}
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40">
                      Extra / Unbundled Fees
                    </td>
                    {activeComparisonQuotes.map((q) => (
                      <td key={q.id} className="py-3.5 px-5 align-top">
                        {q.additionalCharges.length > 0 ? (
                          <div className="p-2.5 rounded-lg bg-[#FFF5F5] border border-[#FED7D7] space-y-1">
                            <span className="font-bold text-[#C05621] flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {q.additionalCharges.length} Extra Surcharge{q.additionalCharges.length === 1 ? "" : "s"}
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-[#822727]">
                              {q.additionalCharges.map((c, idx) => (
                                <li key={idx}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <span className="text-[#3F7A56] font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> All-inclusive quoted scope
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Commercial Terms */}
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40">
                      Commercial Terms
                    </td>
                    {activeComparisonQuotes.map((q) => (
                      <td key={q.id} className="py-3.5 px-5 text-[#6B635B] align-top">
                        {q.terms ? (
                          <div className="flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#C8963E] mt-0.5 flex-shrink-0" />
                            <span>{q.terms}</span>
                          </div>
                        ) : (
                          <span className="italic text-[#9E978E]">Not stated</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Missing Info Warning */}
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40">
                      Clarification Needed
                    </td>
                    {activeComparisonQuotes.map((q) => (
                      <td key={q.id} className="py-3.5 px-5 align-top">
                        {q.missingInformation.length > 0 ? (
                          <div className="p-2.5 rounded-lg bg-[#FFF9F0] border border-[#F6E5C8] space-y-1 text-[#744210]">
                            <span className="font-bold text-[#C8963E] flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Missing Specifics
                            </span>
                            <ul className="list-disc list-inside space-y-0.5">
                              {q.missingInformation.map((m, idx) => (
                                <li key={idx}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <span className="text-[#3F7A56]">Complete specifications provided</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Comparative View */}
            <div className="block md:hidden space-y-4">
              {activeComparisonQuotes.map((q) => (
                <Card key={q.id} className="p-4 space-y-3 bg-white border border-[#EBE5DC]">
                  <div className="flex items-start justify-between border-b border-[#EBE5DC] pb-2">
                    <div>
                      <h4 className="font-serif text-lg font-bold text-[#1F1A17]">{q.vendorName}</h4>
                      <span className="text-[11px] text-[#C8963E] font-bold uppercase">{q.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xl font-bold text-[#5B1D2E]">
                        {formatCurrency(q.quotedAmount)}
                      </div>
                      {q.guestCoverage > 0 && (
                        <span className="text-[11px] text-[#6B635B]">
                          ~{formatCurrency(Math.round(q.quotedAmount / q.guestCoverage))}/pax
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-2">
                    <div>
                      <span className="font-semibold text-[#1F1A17] block">Coverage:</span>
                      <span>{q.guestCoverage > 0 ? `${q.guestCoverage} guests` : "Flat lump-sum"}</span>
                    </div>

                    <div>
                      <span className="font-semibold text-[#1F1A17] block">Inclusions ({q.includedServices.length}):</span>
                      <ul className="space-y-0.5 mt-1">
                        {q.includedServices.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[#4A4540]">
                            <Check className="w-3 h-3 text-[#3F7A56] mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {q.additionalCharges.length > 0 && (
                      <div className="p-2 bg-[#FFF5F5] rounded border border-[#FED7D7]">
                        <span className="font-bold text-[#C05621] block mb-0.5">Extra Charges:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[#822727]">
                          {q.additionalCharges.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* AI / Deterministic Recommendation Section */}
          {comparisonResult && (
            <div className="space-y-5 pt-4">
              {/* Recommendation Banner */}
              <Card className="p-6 bg-gradient-to-br from-[#FFF9F0] via-white to-[#FDF2F4] border-2 border-[#C8963E] shadow-sm">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE5DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#5B1D2E] text-white">
                        <Scale className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8963E]">
                            Best Overall Value Recommendation
                          </span>
                          <Badge variant="accent">
                            {comparisonSource === "gemini" ? "AI Evaluated" : "Rule Engine"}
                          </Badge>
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-[#1F1A17] mt-0.5">
                          {comparisonResult.recommendation.vendorName}
                        </h3>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-[#6B635B] block">Evaluated Price Point</span>
                      <span className="font-mono text-2xl font-bold text-[#5B1D2E]">
                        {(() => {
                          const recommendedQuote = quotations.find(
                            (q) => q.id === comparisonResult.recommendation.quotationId
                          );
                          return recommendedQuote
                            ? formatCurrency(recommendedQuote.quotedAmount)
                            : "Top Value";
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Summary & Value Assessment */}
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold text-[#1F1A17] block mb-1">
                        Executive Comparison Summary:
                      </span>
                      <p className="text-[#4A4540] leading-relaxed">
                        {comparisonResult.comparisonSummary}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-[#EBE5DC] space-y-2">
                      <span className="font-semibold text-[#5B1D2E] block text-xs uppercase tracking-wider">
                        Decision Rationale:
                      </span>
                      <p className="text-xs text-[#1F1A17] font-medium leading-relaxed">
                        {comparisonResult.recommendation.rationale}
                      </p>
                      <p className="text-xs text-[#3F7A56] font-semibold">
                        • {comparisonResult.recommendation.valueAssessment}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Unbundled / Hidden Charges Warning */}
              {comparisonResult.additionalChargesAnalysis &&
                comparisonResult.additionalChargesAnalysis.length > 0 && (
                  <Card className="p-5 border border-[#FED7D7] bg-[#FFF5F5]">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#C05621] text-white shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <h4 className="font-bold text-[#C05621] text-sm">
                          Hidden &amp; Unbundled Surcharge Advisory
                        </h4>
                        <ul className="space-y-1 list-disc list-inside text-[#822727] leading-relaxed">
                          {comparisonResult.additionalChargesAnalysis.map((charge, idx) => (
                            <li key={idx}>{charge}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}

              {/* Missing Information Checklist */}
              {comparisonResult.missingInformationAlerts &&
                comparisonResult.missingInformationAlerts.length > 0 && (
                  <Card className="p-5 border border-[#F6E5C8] bg-[#FFF9F0]">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-5 h-5 text-[#C8963E]" />
                      <h4 className="font-serif text-base font-bold text-[#1F1A17]">
                        Points to Clarify with Vendors Before Advance Booking
                      </h4>
                    </div>
                    <ul className="space-y-2 text-xs">
                      {comparisonResult.missingInformationAlerts.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[#744210]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C8963E] mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

              {/* Disclaimers & Assumptions */}
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE5DC] text-[11px] text-[#6B635B] space-y-1">
                <div className="font-semibold text-[#1F1A17] uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#C8963E]" />
                  Advisory Notice & Planning Rules
                </div>
                <p>
                  • SamarohSathi AI is a celebration planning coordination advisor, not a booking platform or commercial escrow.
                </p>
                <p>
                  • Quotations are user-entered estimates. Always inspect physical contracts and verify 18% GST and overtime rates prior to transferring monetary advances.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
