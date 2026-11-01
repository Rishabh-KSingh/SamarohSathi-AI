import * as React from "react";
import Link from "next/link";
import {
  Clock,
  PieChart,
  CalendarCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { EventData } from "@/types/event";

export interface EventMetricsStripProps {
  event: EventData;
  daysRemaining: number | null;
  currencySymbol: string;
  perGuestCost: number;
  categoriesCount: number;
  tasksCount: number;
}

export function EventMetricsStrip({
  event,
  daysRemaining,
  currencySymbol,
  perGuestCost,
  categoriesCount,
  tasksCount,
}: EventMetricsStripProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Strip (Deterministic Genuine Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] block mb-1">
            Celebration Date
          </span>
          <p className="font-serif text-lg sm:text-xl font-bold text-[#1F1A17] truncate">
            {event.eventDate || "Date TBD"}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#6B635B]">
            <Clock className="w-3.5 h-3.5 text-[#C8963E]" />
            <span>
              {daysRemaining !== null
                ? daysRemaining >= 0
                  ? `${daysRemaining} days remaining`
                  : `${Math.abs(daysRemaining)} days ago`
                : "Upcoming"}
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] block mb-1">
            Guest Count
          </span>
          <p className="font-serif text-lg sm:text-xl font-bold text-[#1F1A17]">
            {formatNumber(event.guestCount)}{" "}
            <span className="text-xs font-sans text-[#6B635B] font-normal">
              attendees
            </span>
          </p>
          <div className="mt-2 text-xs text-[#6B635B] truncate">
            {event.location}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] block mb-1">
            Total Budget
          </span>
          <p className="font-mono text-lg sm:text-xl font-bold text-[#5B1D2E]">
            {currencySymbol}
            {formatNumber(event.totalBudget)}
          </p>
          <div className="mt-2">
            <Badge variant={event.budgetFlexibility === "fixed" ? "error" : "accent"}>
              {event.budgetFlexibility === "fixed"
                ? "Fixed Ceiling"
                : event.budgetFlexibility === "moderate"
                ? "Moderate (+10-15%)"
                : "Flexible"}
            </Badge>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] block mb-1">
            Cost Per Guest
          </span>
          <p className="font-mono text-lg sm:text-xl font-bold text-[#1F1A17]">
            {currencySymbol}
            {formatNumber(perGuestCost)}
          </p>
          <div className="mt-2 text-xs text-[#6B635B]">
            Deterministic allocation
          </div>
        </Card>
      </div>

      {/* Phase 3 & 4: Actionable Workspaces (Budget, Timeline, AI Revision) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Budget Quick Card */}
        <Card className="p-5 border-[#EBE5DC] bg-white hover:border-[#C8963E] transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#5B1D2E]/10 text-[#5B1D2E]">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1F1A17]">
                    Budget Planner
                  </h3>
                  <p className="text-[11px] text-[#6B635B]">
                    {categoriesCount} Categories
                  </p>
                </div>
              </div>
              <Badge variant="accent">Budget</Badge>
            </div>
            <p className="text-xs text-[#6B635B] leading-relaxed pt-1">
              Estimates, actual vendor receipts, overrun limits, and priority-preserving trade-offs.
            </p>
          </div>
          <div className="pt-3 mt-2 border-t border-[#EBE5DC] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#6B635B]">
              {currencySymbol}{formatNumber(event.totalBudget)}
            </span>
            <Link href={`/budget?event_id=${event.id}`}>
              <Button variant="outline" size="sm">
                Open <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Timeline Quick Card */}
        <Card className="p-5 border-[#EBE5DC] bg-white hover:border-[#C8963E] transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#C8963E]/15 text-[#C8963E]">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1F1A17]">
                    Timeline &amp; Tasks
                  </h3>
                  <p className="text-[11px] text-[#6B635B]">
                    {tasksCount} Milestones
                  </p>
                </div>
              </div>
              <Badge variant="accent">Timeline</Badge>
            </div>
            <p className="text-xs text-[#6B635B] leading-relaxed pt-1">
              Sequenced scheduling, cycle prevention, deadline tracking, and task status management.
            </p>
          </div>
          <div className="pt-3 mt-2 border-t border-[#EBE5DC] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#6B635B]">
              {event.eventDate || "Date TBD"}
            </span>
            <Link href={`/timeline?event_id=${event.id}`}>
              <Button variant="outline" size="sm">
                Open <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Phase 4: Adaptive Revision Engine Quick Card */}
        <Card className="p-5 border-2 border-[#5B1D2E]/20 bg-[#FAF8F5] hover:border-[#5B1D2E] transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#5B1D2E] text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1F1A17]">
                    Adaptive AI Revision
                  </h3>
                  <p className="text-[11px] text-[#5B1D2E] font-medium">
                    Natural Language Assistant
                  </p>
                </div>
              </div>
              <Badge variant="primary">AI Assistant</Badge>
            </div>
            <p className="text-sm text-[#544E47] leading-relaxed pt-1">
              Change guests, budgets, dates, or priorities in natural language with side-by-side review diffs.
            </p>
          </div>
          <div className="pt-3 mt-2 border-t border-[#EBE5DC] flex items-center justify-between">
            <span className="text-xs text-[#5B1D2E] font-semibold">
              Review Before Applying
            </span>
            <Link href={`/assistant?event_id=${event.id}`}>
              <Button variant="primary" size="sm">
                Adapt Plan <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
