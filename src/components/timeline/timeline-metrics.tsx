import * as React from "react";
import { Card } from "@/components/ui/card";

export interface TimelineMetricsProps {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  highPriorityPendingCount: number;
}

export function TimelineMetrics({
  totalTasks,
  completedTasks,
  inProgressTasks,
  overdueTasks,
  completionPercentage,
  highPriorityPendingCount,
}: TimelineMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Overall Completion */}
      <Card className="p-5 border-[#EBE5DC]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
            Task Completion
          </span>
          <span className="text-[11px] font-semibold text-[#3F7A56] bg-[#F0F7F3] px-2 py-0.5 rounded-full">
            {completionPercentage}% Done
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-serif text-2xl font-bold text-[#1F1A17]">
            {completedTasks}
          </span>
          <span className="text-sm text-[#6B635B]">/ {totalTasks} Tasks</span>
        </div>
        <div className="w-full h-2 bg-[#EBE5DC] rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-[#3F7A56] transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </Card>

      {/* Card 2: In Progress */}
      <Card className="p-5 border-[#EBE5DC]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
          In Progress
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-serif text-2xl font-bold text-[#C8963E]">
            {inProgressTasks}
          </span>
          <span className="text-sm text-[#6B635B]">Active milestones</span>
        </div>
        <p className="text-[11px] text-[#6B635B] mt-1">
          Tasks currently being coordinated with vendors
        </p>
      </Card>

      {/* Card 3: Overdue Tasks */}
      <Card className="p-5 border-[#EBE5DC]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
            Overdue Deadlines
          </span>
          {overdueTasks > 0 && (
            <span className="text-[11px] font-semibold text-[#C05621] bg-[#FFF5F0] px-2 py-0.5 rounded-full animate-pulse">
              Attention Needed
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span
            className={`font-serif text-2xl font-bold ${
              overdueTasks > 0 ? "text-[#C05621]" : "text-[#1F1A17]"
            }`}
          >
            {overdueTasks}
          </span>
          <span className="text-sm text-[#6B635B]">Tasks past due</span>
        </div>
        <p className="text-[11px] text-[#6B635B] mt-1">
          {overdueTasks > 0 ? "Requires date revision or vendor push" : "All deadlines currently on track"}
        </p>
      </Card>

      {/* Card 4: High Priority Pending */}
      <Card className="p-5 border-[#EBE5DC]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
          Critical High Priority
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-serif text-2xl font-bold text-[#5B1D2E]">
            {highPriorityPendingCount}
          </span>
          <span className="text-sm text-[#6B635B]">Pending high-stakes</span>
        </div>
        <p className="text-[11px] text-[#6B635B] mt-1">
          Essential for core celebration execution
        </p>
      </Card>
    </div>
  );
}
