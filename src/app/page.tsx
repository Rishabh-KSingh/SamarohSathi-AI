"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createSampleEvent } from "@/lib/storage";
import { useActiveEvent, useIsClient, useAllEvents } from "@/lib/use-store";
import { CURRENCY_OPTIONS, ATMOSPHERE_OPTIONS, SPENDING_PRIORITIES } from "@/lib/constants";

export default function DashboardPage() {
  const isClient = useIsClient();
  const activeEvent = useActiveEvent();
  const allEvents = useAllEvents();

  const handleLoadSample = () => {
    createSampleEvent();
  };

  // Calculate days remaining deterministically
  const calculateDaysRemaining = (dateStr: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = activeEvent
    ? calculateDaysRemaining(activeEvent.eventDate)
    : null;

  const currencyObj = activeEvent
    ? CURRENCY_OPTIONS.find((c) => c.code === activeEvent.currency) || CURRENCY_OPTIONS[0]
    : CURRENCY_OPTIONS[0];

  const atmosphereObj = activeEvent
    ? ATMOSPHERE_OPTIONS.find((a) => a.id === activeEvent.atmosphere)
    : null;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Page Header */}
        <PageHeader
          eyebrow="Celebration Overview"
          title="Celebration Dashboard"
          description="Your adaptive command center for organizing personal celebrations within budget, preferences, and timeline."
          action={
            <Link href="/onboarding">
              <Button variant="primary" size="md">
                <Plus className="w-4 h-4" />
                Create New Event
              </Button>
            </Link>
          }
        />

        {/* Dynamic State: Empty State vs Active Event Overview */}
        {!isClient ? (
          <div className="p-12 text-center text-base text-[#544E47] bg-white rounded-2xl border border-[#EBE5DC]">
            <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin inline-block mr-2" />
            Loading celebration dashboard...
          </div>
        ) : !activeEvent ? (
          <EmptyState
            title="Let's plan something memorable."
            description="You don't have an active celebration plan yet. Start with our guided onboarding to structure your budget, guest count, and actionable timeline."
            action={
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link href="/onboarding">
                  <Button variant="primary" size="md" className="w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    Create New Event
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleLoadSample}
                  className="w-full sm:w-auto"
                >
                  Explore Rohan &amp; Priya Wedding
                </Button>
              </div>
            }
          />
        ) : (
          /* Active Event Overview */
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold tracking-wide text-[#A66E1E]">
                  Active Celebration Plan
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/events">
                  <Button variant="ghost" size="sm" className="text-sm">
                    All Events ({allEvents.length})
                  </Button>
                </Link>
                <Link href={`/overview?event_id=${activeEvent.id}`}>
                  <Button variant="outline" size="sm" className="text-sm">
                    View Blueprint Overview <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="p-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold tracking-wide uppercase text-[#544E47]">
                    Celebration
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#1F1A17] truncate">
                    {activeEvent.name}
                  </h3>
                  <div className="pt-1">
                    <Badge variant="primary">{activeEvent.occasion}</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold tracking-wide uppercase text-[#544E47]">
                    Date &amp; Countdown
                  </span>
                  <p className="font-serif text-2xl font-bold text-[#1F1A17]">
                    {activeEvent.eventDate || "Date TBD"}
                  </p>
                  <p className="text-sm text-[#A66E1E] font-medium flex items-center gap-1.5 pt-0.5">
                    <Clock className="w-4 h-4" />
                    {daysRemaining !== null
                      ? daysRemaining >= 0
                        ? `${daysRemaining} days remaining`
                        : `${Math.abs(daysRemaining)} days passed`
                      : "Upcoming celebration"}
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold tracking-wide uppercase text-[#544E47]">
                    Expected Guests
                  </span>
                  <p className="font-serif text-2xl font-bold text-[#1F1A17]">
                    {activeEvent.guestCount.toLocaleString()}
                  </p>
                  <p className="text-sm text-[#544E47] truncate pt-0.5">
                    {activeEvent.location}
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold tracking-wide uppercase text-[#544E47]">
                    Total Allocated Budget
                  </span>
                  <p className="font-mono text-2xl font-bold text-[#5B1D2E]">
                    {currencyObj.symbol}
                    {activeEvent.totalBudget.toLocaleString("en-IN")}
                  </p>
                  <div className="pt-0.5">
                    <Badge variant={activeEvent.budgetFlexibility === "fixed" ? "error" : "accent"}>
                      {activeEvent.budgetFlexibility === "fixed"
                        ? "Fixed Budget"
                        : activeEvent.budgetFlexibility === "moderate"
                        ? "Moderate (+10-15%)"
                        : "Flexible"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Celebration Preferences & Guidance Summary */}
            <Card className="p-6 bg-white border-[#EBE5DC]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-1.5">
                  <span className="font-semibold text-xs tracking-wide uppercase text-[#544E47] block">
                    Atmosphere &amp; Theme
                  </span>
                  <p className="font-serif text-base font-bold text-[#5B1D2E]">
                    {atmosphereObj?.label || activeEvent.atmosphere}
                  </p>
                  {activeEvent.preferences && (
                    <p className="text-sm text-[#544E47] italic leading-relaxed pt-1 line-clamp-3">
                      &ldquo;{activeEvent.preferences}&rdquo;
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-xs tracking-wide uppercase text-[#544E47] block">
                    Spending Priorities
                  </span>
                  <div className="space-y-2 pt-1">
                    {(activeEvent.priorities || []).slice(0, 3).map((pKey, i) => {
                      const item = SPENDING_PRIORITIES.find((p) => p.id === pKey);
                      return (
                        <div key={pKey} className="flex items-center gap-2 text-sm text-[#1F1A17]">
                          <span className="w-5 h-5 rounded-full bg-[#5B1D2E] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-medium">{item?.label || pKey}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-xs tracking-wide uppercase text-[#544E47] block">
                    Must-Haves &amp; Guest Considerations
                  </span>
                  {(activeEvent.mustHaves || []).length > 0 ? (
                    <p className="text-sm text-[#1F1A17] leading-relaxed pt-1 line-clamp-3">
                      {activeEvent.mustHaves.join(", ")}
                    </p>
                  ) : (
                    <p className="text-sm text-[#544E47] italic pt-1">No special constraints specified.</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {activeEvent.constraints?.hasChildren && (
                      <Badge variant="default">Child-Friendly</Badge>
                    )}
                    {activeEvent.constraints?.hasElderly && (
                      <Badge variant="default">Senior Care</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Action Workspaces */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-[#1F1A17]">
                Celebration Planning Workspaces
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card className="p-5 border-[#EBE5DC] bg-white hover:border-[#5B1D2E] transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold tracking-wide uppercase text-[#5B1D2E]">
                      Finance
                    </span>
                    <h4 className="font-serif text-lg font-bold text-[#1F1A17]">
                      Budget Planner
                    </h4>
                    <p className="text-sm text-[#544E47] leading-relaxed">
                      Track category expenses, monitor variances, log actual payments, and optimize allocations.
                    </p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-[#EBE5DC] flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#5B1D2E]">
                      {currencyObj.symbol}{activeEvent.totalBudget.toLocaleString("en-IN")}
                    </span>
                    <Link href={`/budget?event_id=${activeEvent.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Open Planner <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>

                <Card className="p-5 border-[#EBE5DC] bg-white hover:border-[#5B1D2E] transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold tracking-wide uppercase text-[#A66E1E]">
                      Schedule
                    </span>
                    <h4 className="font-serif text-lg font-bold text-[#1F1A17]">
                      Timeline &amp; Tasks
                    </h4>
                    <p className="text-sm text-[#544E47] leading-relaxed">
                      Sequential celebration milestones with dependency tracking, reminders, and deadline alerts.
                    </p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-[#EBE5DC] flex items-center justify-between">
                    <span className="text-xs text-[#544E47]">
                      {activeEvent.eventDate || "TBD"}
                    </span>
                    <Link href={`/timeline?event_id=${activeEvent.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Open Tasks <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>

                <Card className="p-5 border-[#EBE5DC] bg-white hover:border-[#5B1D2E] transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold tracking-wide uppercase text-[#3F7A56]">
                      Procurement
                    </span>
                    <h4 className="font-serif text-lg font-bold text-[#1F1A17]">
                      Vendors &amp; Quotes
                    </h4>
                    <p className="text-sm text-[#544E47] leading-relaxed">
                      Coordinate catering, decor, and photography quotes with AI side-by-side value comparisons.
                    </p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-[#EBE5DC] flex items-center justify-between">
                    <span className="text-xs text-[#544E47]">
                      7 Categories
                    </span>
                    <Link href={`/vendors?event_id=${activeEvent.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Open Vendors <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>

                <Card className="p-5 border-2 border-[#5B1D2E]/20 bg-[#FAF8F5] hover:border-[#5B1D2E] transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold tracking-wide uppercase text-[#5B1D2E]">
                      AI Advisor
                    </span>
                    <h4 className="font-serif text-lg font-bold text-[#1F1A17]">
                      Plan Revision Engine
                    </h4>
                    <p className="text-sm text-[#544E47] leading-relaxed">
                      Request changes in natural language (guests, budget, dates) with structured before/after approval.
                    </p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-[#EBE5DC] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5B1D2E]">
                      Natural Language
                    </span>
                    <Link href={`/assistant?event_id=${activeEvent.id}`}>
                      <Button variant="primary" size="sm" className="text-xs">
                        Open AI <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
