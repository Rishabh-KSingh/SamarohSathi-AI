"use client";

import * as React from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VendorCategory, VendorQuestionItem } from "@/types/event";

interface VendorQuestionsTabProps {
  selectedCategory: VendorCategory;
  onSelectedCategoryChange: (category: VendorCategory) => void;
  vendorCategories: VendorCategory[];
  questionRequirements: string;
  onQuestionRequirementsChange: (req: string) => void;
  onPrepareQuestions: (category: VendorCategory, requirements?: string) => void;
  isLoadingQuestions: boolean;
  preparedQuestions: {
    category: string;
    questions: VendorQuestionItem[];
    tips: string[];
  } | null;
}

export function VendorQuestionsTab({
  selectedCategory,
  onSelectedCategoryChange,
  vendorCategories,
  questionRequirements,
  onQuestionRequirementsChange,
  onPrepareQuestions,
  isLoadingQuestions,
  preparedQuestions,
}: VendorQuestionsTabProps) {
  const [copiedQuestionIdx, setCopiedQuestionIdx] = React.useState<number | null>(null);
  const [copiedAllQuestions, setCopiedAllQuestions] = React.useState(false);

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIdx(idx);
    setTimeout(() => setCopiedQuestionIdx(null), 2000);
  };

  const handleCopyAllQuestions = () => {
    if (!preparedQuestions) return;
    const compiled = `Vendor Interview Questions: ${preparedQuestions.category}
==========================================
${preparedQuestions.questions
  .map((q, i) => `${i + 1}. ${q.question}\n   Purpose: ${q.purpose}`)
  .join("\n\n")}

Negotiation & Coordination Tips:
${preparedQuestions.tips.map((t) => `• ${t}`).join("\n")}`;

    navigator.clipboard.writeText(compiled);
    setCopiedAllQuestions(true);
    setTimeout(() => setCopiedAllQuestions(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white border border-[#EBE5DC] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1F1A17] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C8963E]" />
              AI Vendor Interview Preparation
            </h3>
            <p className="text-xs text-[#6B635B] mt-0.5">
              Generate insightful, domain-specific questions to ask vendors before signing contracts or transferring advances.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                const newCat = e.target.value as VendorCategory;
                onSelectedCategoryChange(newCat);
                onPrepareQuestions(newCat);
              }}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl text-xs font-semibold text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
            >
              {vendorCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              size="md"
              onClick={() => onPrepareQuestions(selectedCategory)}
              disabled={isLoadingQuestions}
              className="gap-2"
            >
              {isLoadingQuestions ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C8963E]" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Custom Requirements Input */}
        <div className="pt-3 border-t border-[#EBE5DC]">
          <label className="text-xs font-semibold text-[#1F1A17] block mb-1">
            Specific Celebration Requirements or Preferences (Optional):
          </label>
          <div className="flex gap-2">
            <Input
              value={questionRequirements}
              onChange={(e) => onQuestionRequirementsChange(e.target.value)}
              placeholder="e.g. Traditional floral mandap with marigolds, outside caterer allowed, wheelchair access..."
              className="text-xs"
            />
            <Button
              variant="outline"
              size="md"
              onClick={() => onPrepareQuestions(selectedCategory, questionRequirements)}
              className="text-xs flex-shrink-0"
            >
              Apply Requirements
            </Button>
          </div>
        </div>
      </Card>

      {/* Questions List */}
      {isLoadingQuestions ? (
        <div className="p-16 text-center text-sm text-[#6B635B] bg-white rounded-2xl border border-[#EBE5DC]">
          <span className="w-6 h-6 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin inline-block mr-2" />
          Preparing domain-specific questions for {selectedCategory}...
        </div>
      ) : preparedQuestions ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B635B] uppercase tracking-wider">
              {preparedQuestions.questions.length} Questions for {preparedQuestions.category}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAllQuestions}
              className="text-xs gap-1.5"
            >
              {copiedAllQuestions ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#3F7A56]" /> Copied All Questions!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#5B1D2E]" /> Copy All Questions
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preparedQuestions.questions.map((q, idx) => (
              <Card
                key={idx}
                className="p-5 bg-white border border-[#EBE5DC] flex flex-col justify-between hover:border-[#C8963E]/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8963E] px-2 py-0.5 bg-[#FFF9F0] border border-[#F6E5C8] rounded">
                      {q.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyQuestion(q.question, idx)}
                      className="text-[#6B635B] hover:text-[#5B1D2E] p-1 rounded cursor-pointer"
                      title="Copy single question"
                      aria-label={`Copy question ${idx + 1}`}
                    >
                      {copiedQuestionIdx === idx ? (
                        <Check className="w-3.5 h-3.5 text-[#3F7A56]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <h4 className="font-semibold text-sm text-[#1F1A17] leading-snug">
                    {q.question}
                  </h4>

                  <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#EBE5DC] text-xs text-[#6B635B]">
                    <strong className="text-[#1F1A17] block mb-0.5">Why Ask This:</strong>
                    <p className="leading-relaxed">{q.purpose}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Practical Tips */}
          {preparedQuestions.tips && preparedQuestions.tips.length > 0 && (
            <Card className="p-5 bg-[#FAF8F5] border border-[#EBE5DC] rounded-2xl space-y-2">
              <span className="font-semibold text-xs text-[#5B1D2E] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C8963E]" />
                Negotiation & Coordination Tips
              </span>
              <ul className="space-y-1 text-xs text-[#4A4540]">
                {preparedQuestions.tips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8963E] mt-1.5 flex-shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
