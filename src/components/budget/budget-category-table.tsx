import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Edit2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { BudgetCategory, VendorQuotation } from "@/types/event";

export interface BudgetCategoryTableProps {
  categories: BudgetCategory[];
  quotations: VendorQuotation[];
  currencySymbol: string;
  totalEstimated: number;
  totalActual: number;
  eventId: string;
  onEdit: (category: BudgetCategory) => void;
  onDelete: (id: string, name: string) => void;
  onApplyQuotation: (category: BudgetCategory, quotation: VendorQuotation) => void;
}

export function BudgetCategoryTable({
  categories,
  quotations,
  currencySymbol,
  totalEstimated,
  totalActual,
  eventId,
  onEdit,
  onDelete,
  onApplyQuotation,
}: BudgetCategoryTableProps) {
  return (
    <Card className="border-[#EBE5DC] overflow-hidden">
      <div className="p-5 border-b border-[#EBE5DC] flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#1F1A17]">
            Budget Categories & Expenses
          </h2>
          <p className="text-xs text-[#6B635B] mt-0.5">
            Add, edit, or adjust categories. Enter confirmed vendor bills in the &quot;Actual&quot; column.
          </p>
        </div>
        <Badge variant="default">{categories.length} categories</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#EBE5DC] bg-[#FAF8F5] text-xs font-semibold text-[#6B635B] uppercase tracking-wider">
              <th className="py-3.5 px-5">Category & Notes</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4 text-right">Estimated</th>
              <th className="py-3.5 px-4 text-right">Actual Paid</th>
              <th className="py-3.5 px-4 text-right">Variance</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBE5DC]">
            {categories.map((c) => {
              const est = Number(c.estimatedAmount) || 0;
              const act = Number(c.actualAmount) || 0;
              const variance = act > 0 ? act - est : 0;
              const linkedQuote = quotations.find(
                (q) =>
                  q.budgetCategoryId === c.id ||
                  (q.isSelected && q.category.toLowerCase() === c.name.toLowerCase())
              );
              const quoteOverBudget = linkedQuote && linkedQuote.quotedAmount > est;

              return (
                <tr key={c.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                  <td className="py-4 px-5 align-top">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1F1A17]">{c.name}</span>
                      {c.isAiGenerated && (
                        <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 bg-[#FFF9F0] text-[#C8963E] border border-[#C8963E]/30 rounded">
                          AI Estimate
                        </span>
                      )}
                    </div>
                    {c.notes && (
                      <p className="text-xs text-[#6B635B] mt-1 max-w-md leading-relaxed">
                        {c.notes}
                      </p>
                    )}
                    {linkedQuote && (
                      <div className="mt-2 p-2 bg-[#FAF8F5] rounded-lg border border-[#EBE5DC] text-[11px] flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#1F1A17]">
                            Quoted: ₹{formatNumber(linkedQuote.quotedAmount)}
                          </span>
                          <span className="text-[#6B635B]">({linkedQuote.vendorName})</span>
                          {quoteOverBudget ? (
                            <span className="text-[#C05621] font-semibold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              +₹{formatNumber(linkedQuote.quotedAmount - est)} over estimate
                            </span>
                          ) : (
                            <span className="text-[#3F7A56] font-semibold">
                              ✓ Within estimate
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onApplyQuotation(c, linkedQuote)}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-[#EBE5DC] rounded text-[#5B1D2E] hover:bg-[#FDF2F4] transition-colors"
                            title="Apply quotation to actual expense"
                          >
                            Apply to Actual
                          </button>
                          <Link
                            href={`/vendors?event_id=${eventId}`}
                            className="text-[10px] text-[#6B635B] hover:text-[#1F1A17] underline ml-1"
                          >
                            View Vendor
                          </Link>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-4 align-top">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        c.priority === "High"
                          ? "bg-[#FDF2F4] text-[#5B1D2E] border border-[#F3D2D9]"
                          : c.priority === "Medium"
                          ? "bg-[#FFF9F0] text-[#C8963E] border border-[#F6E5C8]"
                          : "bg-[#F5F2EB] text-[#6B635B] border border-[#EBE5DC]"
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>

                  <td className="py-4 px-4 align-top text-right">
                    <span className="font-mono font-semibold text-[#1F1A17]">
                      {currencySymbol}{formatNumber(est)}
                    </span>
                  </td>

                  <td className="py-4 px-4 align-top text-right">
                    <span className="font-mono font-medium text-[#1F1A17]">
                      {act > 0 ? `${currencySymbol}${formatNumber(act)}` : "—"}
                    </span>
                  </td>

                  <td className="py-4 px-4 align-top text-right font-mono text-xs">
                    {act === 0 ? (
                      <span className="text-[#6B635B]">Pending</span>
                    ) : variance > 0 ? (
                      <span className="text-[#C05621] font-semibold">
                        +{currencySymbol}{formatNumber(variance)}
                      </span>
                    ) : variance < 0 ? (
                      <span className="text-[#3F7A56] font-semibold">
                        -{currencySymbol}{formatNumber(Math.abs(variance))}
                      </span>
                    ) : (
                      <span className="text-[#6B635B]">On Budget</span>
                    )}
                  </td>

                  <td className="py-4 px-5 align-top text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="p-1.5 rounded-lg text-[#6B635B] hover:text-[#5B1D2E] hover:bg-[#F5F2EB] transition-colors"
                        title="Edit Category & Amounts"
                        aria-label={`Edit category ${c.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c.id, c.name)}
                        className="p-1.5 rounded-lg text-[#6B635B] hover:text-[#C05621] hover:bg-[#F5F2EB] transition-colors"
                        title="Delete Category"
                        aria-label={`Delete category ${c.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#FAF8F5] border-t-2 border-[#EBE5DC] font-semibold text-[#1F1A17]">
              <td className="py-4 px-5">Total Calculated</td>
              <td className="py-4 px-4" />
              <td className="py-4 px-4 text-right font-mono font-bold text-base">
                {currencySymbol}{formatNumber(totalEstimated)}
              </td>
              <td className="py-4 px-4 text-right font-mono font-bold text-base">
                {currencySymbol}{formatNumber(totalActual)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-xs">
                {totalActual > 0
                  ? `${totalActual > totalEstimated ? "+" : ""}${currencySymbol}${formatNumber(
                      totalActual - totalEstimated
                    )}`
                  : "—"}
              </td>
              <td className="py-4 px-5" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
