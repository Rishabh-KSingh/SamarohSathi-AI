import * as React from "react";
import { Sparkles, RefreshCw, Info, AlertTriangle, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIEventPlan } from "@/types/event";

export interface AIBlueprintCardProps {
  plan: AIEventPlan;
  isRegenerating: boolean;
  onRegenerate: () => void;
}

export function AIBlueprintCard({
  plan,
  isRegenerating,
  onRegenerate,
}: AIBlueprintCardProps) {
  return (
    <Card className="p-6 border-[#EBE5DC] bg-[#FAF8F5]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE5DC] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#5B1D2E] text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-[#1F1A17]">
                Personalized AI Event Plan
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FFF9F0] text-[#C8963E] border border-[#C8963E]/30">
                {plan.source === "gemini" ? "Gemini 2.5 Flash" : "Celebration Intelligence Engine"}
              </span>
            </div>
            <p className="text-xs text-[#6B635B] mt-0.5">
              Generated from your actual onboarding preferences, guest count, and ranked priorities
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
          {isRegenerating ? "Generating Plan..." : "Regenerate Plan"}
        </Button>
      </div>

      <div className="space-y-4 pt-4">
        {/* Event Summary */}
        <div className="p-4 bg-white rounded-xl border border-[#EBE5DC]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C8963E] block mb-1">
            Executive Celebration Blueprint
          </span>
          <p className="text-sm font-medium text-[#1F1A17] leading-relaxed">
            {plan.eventSummary}
          </p>
        </div>

        {/* Assumptions & Disclaimers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-[#EBE5DC]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B] flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-[#5B1D2E]" /> Planning Assumptions
            </span>
            <ul className="space-y-1.5 text-xs text-[#6B635B]">
              {plan.assumptions.map((assump, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#5B1D2E] font-bold">•</span>
                  <span>{assump}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#EBE5DC]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C05621] flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#C05621]" /> Critical Planning Warnings
            </span>
            <ul className="space-y-1.5 text-xs text-[#6B635B]">
              {plan.warnings.map((warn, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#C05621] font-bold">!</span>
                  <span>{warn}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Follow-up Questions */}
        {plan.followUpQuestions && plan.followUpQuestions.length > 0 && (
          <div className="p-4 bg-white rounded-xl border border-[#EBE5DC]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3F7A56] flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-[#3F7A56]" /> Recommended Next Clarifications
            </span>
            <ul className="space-y-1.5 text-xs text-[#6B635B]">
              {plan.followUpQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#3F7A56] font-bold">?</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
