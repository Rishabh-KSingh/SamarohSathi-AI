import * as React from "react";
import {
  X,
  Check,
  AlertTriangle,
  Users,
  PieChart,
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { PlanRevisionProposal } from "@/types/event";

export interface RevisionProposalReviewProps {
  proposal: PlanRevisionProposal;
  proposalSource: string;
  currencySymbol: string;
  onAccept: () => void;
  onReject: () => void;
}

export function RevisionProposalReview({
  proposal,
  proposalSource,
  currencySymbol,
  onAccept,
  onReject,
}: RevisionProposalReviewProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header / Review Banner */}
      <div className="p-5 rounded-2xl bg-[#5B1D2E] text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/15 text-white">
              Step 5 of 7: Review Proposal
            </span>
            <span className="text-[10px] text-white/80 font-mono">
              Engine: {proposalSource === "gemini" ? "Gemini 2.5 Flash" : "Celebration Engine"}
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight">
            Proposed Plan Revision Review
          </h2>
          <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
            Requested: &ldquo;{proposal.requestedChange}&rdquo; • Your original plan is safely preserved until you decide.
          </p>
        </div>

        {/* Action Decision Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onReject}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex-1 sm:flex-none"
          >
            <X className="w-4 h-4" />
            Reject Changes
          </Button>
          <Button
            type="button"
            onClick={onAccept}
            className="bg-[#C8963E] hover:bg-[#b08031] text-white font-bold flex-1 sm:flex-none shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Accept Changes
          </Button>
        </div>
      </div>

      {proposalSource === "deterministic-fallback" && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Note:</strong> Proposal generated using the rule-based celebration planning engine (Gemini API offline or unconfigured). All mathematical constraints and budget trade-offs are calculated deterministically.
          </span>
        </div>
      )}

      {/* Explanation & Planning Assumptions */}
      <Card className="p-5 border-[#EBE5DC] bg-white">
        <div className="space-y-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C8963E] block mb-1">
              AI Revision Rationale
            </span>
            <p className="text-sm text-[#1F1A17] font-medium leading-relaxed">
              {proposal.explanation}
            </p>
          </div>

          {proposal.assumptions.length > 0 && (
            <div className="pt-2 border-t border-[#EBE5DC]">
              <span className="text-[11px] font-semibold text-[#6B635B] uppercase tracking-wider block mb-1">
                Planning Assumptions:
              </span>
              <ul className="space-y-1 text-xs text-[#6B635B]">
                {proposal.assumptions.map((assump, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#5B1D2E] font-bold">•</span>
                    <span>{assump}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Event Level Changes (Guest Count, Budget, Date) */}
      {proposal.eventChanges && (
        <Card className="p-5 border-[#EBE5DC] bg-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] block mb-3">
            Event Parameters Diff (Before &amp; After)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {proposal.eventChanges.guestCount && (
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DC]">
                <span className="text-xs text-[#6B635B] block flex items-center gap-1 mb-1">
                  <Users className="w-3.5 h-3.5 text-[#5B1D2E]" /> Guest Count
                </span>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-[#6B635B] line-through">
                    {proposal.eventChanges.guestCount.previous} guests
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C8963E]" />
                  <span className="text-[#1F1A17] font-bold text-base">
                    {proposal.eventChanges.guestCount.proposed} guests
                  </span>
                </div>
              </div>
            )}

            {proposal.eventChanges.totalBudget && (
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DC]">
                <span className="text-xs text-[#6B635B] block flex items-center gap-1 mb-1">
                  <PieChart className="w-3.5 h-3.5 text-[#5B1D2E]" /> Total Budget Envelope
                </span>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-[#6B635B] line-through font-mono">
                    {currencySymbol}{formatNumber(proposal.eventChanges.totalBudget.previous)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C8963E]" />
                  <span className="text-[#5B1D2E] font-mono font-bold text-base">
                    {currencySymbol}{formatNumber(proposal.eventChanges.totalBudget.proposed)}
                  </span>
                </div>
              </div>
            )}

            {proposal.eventChanges.eventDate && (
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DC]">
                <span className="text-xs text-[#6B635B] block flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#5B1D2E]" /> Celebration Date
                </span>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-[#6B635B] line-through font-mono">
                    {proposal.eventChanges.eventDate.previous}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C8963E]" />
                  <span className="text-[#1F1A17] font-mono font-bold text-base">
                    {proposal.eventChanges.eventDate.proposed}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Budget Category Impact (Before & After Table) */}
      {proposal.categoryDiffs.length > 0 && (
        <Card className="border-[#EBE5DC] overflow-hidden bg-white">
          <div className="p-4 border-b border-[#EBE5DC] bg-[#FAF8F5] flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
                Budget Allocation Changes ({proposal.categoryDiffs.length})
              </h3>
              <p className="text-xs text-[#6B635B]">
                Deterministic calculations of proposed adjustments
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#6B635B] block">Budget Delta:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  proposal.budgetImpact.difference > 0
                    ? "text-[#C05621]"
                    : proposal.budgetImpact.difference < 0
                    ? "text-[#3F7A56]"
                    : "text-[#1F1A17]"
                }`}
              >
                {proposal.budgetImpact.difference > 0 ? "+" : ""}
                {currencySymbol}{formatNumber(proposal.budgetImpact.difference)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EBE5DC] bg-white text-[#6B635B] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-3 text-right">Previous Estimate</th>
                  <th className="py-3 px-3 text-right">Proposed Estimate</th>
                  <th className="py-3 px-3 text-right">Difference</th>
                  <th className="py-3 px-4">Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE5DC]">
                {proposal.categoryDiffs.map((diff, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#1F1A17]">
                      {diff.categoryName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#6B635B]">
                      {currencySymbol}{formatNumber(diff.previousEstimated)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1F1A17]">
                      {currencySymbol}{formatNumber(diff.proposedEstimated)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {diff.difference > 0 ? (
                        <span className="text-[#C05621] flex items-center justify-end gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +{currencySymbol}{formatNumber(diff.difference)}
                        </span>
                      ) : diff.difference < 0 ? (
                        <span className="text-[#3F7A56] flex items-center justify-end gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          -{currencySymbol}{formatNumber(Math.abs(diff.difference))}
                        </span>
                      ) : (
                        <span className="text-[#6B635B]">₹0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#6B635B] max-w-xs leading-relaxed">
                      {diff.reasoning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Timeline & Task Rescheduling Impact */}
      {proposal.taskDiffs.length > 0 && (
        <Card className="border-[#EBE5DC] overflow-hidden bg-white">
          <div className="p-4 border-b border-[#EBE5DC] bg-[#FAF8F5]">
            <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
              Timeline &amp; Task Adjustments ({proposal.taskDiffs.length})
            </h3>
            <p className="text-xs text-[#6B635B]">
              Rescheduled milestone deadlines and new follow-up tasks
            </p>
          </div>

          <div className="p-4 space-y-2.5">
            {proposal.taskDiffs.map((tDiff, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#1F1A17]">
                      {tDiff.title}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white text-[#C8963E] border border-[#C8963E]/30">
                      {tDiff.action}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B635B] mt-0.5">{tDiff.reasoning}</p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                  {tDiff.previousDueDate && (
                    <span className="text-[#6B635B] line-through">
                      {tDiff.previousDueDate}
                    </span>
                  )}
                  {tDiff.previousDueDate && <ArrowRight className="w-3 h-3 text-[#C8963E]" />}
                  <span className="font-bold text-[#1F1A17] bg-white px-2 py-1 rounded border border-[#EBE5DC]">
                    Due: {tDiff.proposedDueDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Unchanged Information Guarantee */}
      <div className="p-4 rounded-xl bg-[#F0F7F3] border border-[#3F7A56]/30 flex items-center justify-between gap-3 text-xs text-[#3F7A56]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#3F7A56]" />
          <span className="font-medium">
            <strong>Data Integrity Guarantee:</strong> {proposal.affectedUnchangedSummary.summary} Unrelated contracts and preferences remain untouched.
          </span>
        </div>
        <Badge variant="accent">Zero Unrelated Overwrite</Badge>
      </div>

      {/* Warnings if any */}
      {proposal.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-[#FFF5F0] border border-[#C05621]/40 space-y-1.5 text-xs text-[#C05621]">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Important Planning Advisories</span>
          </div>
          <ul className="space-y-1 list-disc list-inside">
            {proposal.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons Footer */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE5DC]">
        <Button type="button" variant="ghost" size="md" onClick={onReject}>
          <X className="w-4 h-4" /> Discard &amp; Keep Original Plan
        </Button>
        <Button type="button" variant="primary" size="md" onClick={onAccept}>
          <Check className="w-4 h-4 stroke-[3]" /> Confirm &amp; Apply Changes
        </Button>
      </div>
    </div>
  );
}
