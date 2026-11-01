import * as React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { EventData } from "@/types/event";
import { getSuggestedQuestionGroups } from "@/lib/assistant-suggestions";

export interface SuggestedPromptsGridProps {
  event: EventData;
  onSelectQuestion: (question: string) => void;
}

export function SuggestedPromptsGrid({
  event,
  onSelectQuestion,
}: SuggestedPromptsGridProps) {
  const groups = getSuggestedQuestionGroups(event);

  return (
    <div className="pt-4 border-t border-[#EBE5DC] space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C8963E]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F1A17]">
            Try These Requests
          </h4>
        </div>
        <span className="text-[11px] text-[#6B635B]">
          Click any request to populate and edit before proposing
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <div
              key={group.category}
              className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] space-y-2.5"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C8963E]">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{group.category}</span>
              </div>

              <div className="space-y-1.5">
                {group.questions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectQuestion(q)}
                    className="w-full text-left text-xs font-medium p-2.5 rounded-lg bg-white hover:bg-[#F5F2EB] text-[#1F1A17] border border-[#EBE5DC] hover:border-[#C8963E]/60 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                    title="Click to populate in message input"
                  >
                    <span className="line-clamp-2 leading-relaxed">&ldquo;{q}&rdquo;</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#6B635B] group-hover:text-[#5B1D2E] shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
