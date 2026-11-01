import * as React from "react";
import { History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanChangeRecord } from "@/types/event";

export interface ChangeHistoryListProps {
  changeHistory: PlanChangeRecord[];
  eventName: string;
}

export function ChangeHistoryList({
  changeHistory,
  eventName,
}: ChangeHistoryListProps) {
  return (
    <section className="space-y-4 pt-6 border-t border-[#EBE5DC]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#5B1D2E]" />
          <h2 className="font-serif text-xl font-bold text-[#1F1A17]">
            Plan Evolution &amp; Change History
          </h2>
        </div>
        <Badge variant="default">{changeHistory.length} Accepted Revisions</Badge>
      </div>

      {changeHistory.length === 0 ? (
        <Card className="p-6 text-center text-xs text-[#6B635B] bg-white border-[#EBE5DC]">
          <p>No plan revisions have been accepted yet for &ldquo;{eventName}&rdquo;.</p>
          <p className="mt-1 text-[11px]">
            Submit a change request above to adapt your plan. When you accept proposals, a full audit trail will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {changeHistory.map((rec) => (
            <Card key={rec.id} className="p-4 bg-white border-[#EBE5DC] text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE5DC] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF9F0] text-[#C8963E] border border-[#C8963E]/30">
                    {rec.changeType}
                  </span>
                  <strong className="text-sm font-semibold text-[#1F1A17]">
                    &ldquo;{rec.requestedChange}&rdquo;
                  </strong>
                </div>
                <span className="text-[#6B635B] font-mono text-[11px]">
                  {new Date(rec.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              <p className="text-[#1F1A17] leading-relaxed">{rec.explanation}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-[#6B635B]">
                <div>
                  <span className="font-medium text-[#1F1A17]">Previous Value: </span>
                  <span>{rec.previousValue}</span>
                </div>
                <div>
                  <span className="font-medium text-[#1F1A17]">New Value: </span>
                  <span className="font-semibold text-[#3F7A56]">{rec.newValue}</span>
                </div>
                <div>
                  <span className="font-medium text-[#1F1A17]">Affected: </span>
                  <span>
                    {rec.affectedCategories.length} categories, {rec.affectedTasks.length} tasks
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
