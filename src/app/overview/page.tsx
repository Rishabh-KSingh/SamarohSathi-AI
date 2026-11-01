"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  Plus,
  Sparkles,
  PieChart,
  CalendarCheck,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  ArrowRight,
  Info,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getActiveEvent,
  getEventById,
  getAllEvents,
  setActiveEventId,
  getAIPlanForEvent,
  saveAIPlanForEvent,
  getCategoriesForEvent,
  getTasksForEvent,
} from "@/lib/storage";
import { generateDeterministicPlan } from "@/lib/planner-engine";
import { CURRENCY_OPTIONS, ATMOSPHERE_OPTIONS, SPENDING_PRIORITIES } from "@/lib/constants";
import { EventData, AIEventPlan, BudgetCategory, EventTask } from "@/types/event";

function EventOverviewContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("event_id");

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [allEvents, setAllEvents] = React.useState<EventData[]>([]);
  const [aiPlan, setAiPlan] = React.useState<AIEventPlan | null>(null);
  const [categories, setCategories] = React.useState<BudgetCategory[]>([]);
  const [tasks, setTasks] = React.useState<EventTask[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const loadData = React.useCallback(() => {
    const events = getAllEvents();
    setAllEvents(events);

    let foundEvent: EventData | null = null;
    if (eventIdParam) {
      foundEvent = getEventById(eventIdParam);
      if (foundEvent) setActiveEventId(foundEvent.id);
    }
    if (!foundEvent) {
      foundEvent = getActiveEvent();
    }

    setEvent(foundEvent);

    if (foundEvent) {
      let plan = getAIPlanForEvent(foundEvent.id);
      if (!plan) {
        plan = generateDeterministicPlan(foundEvent);
        saveAIPlanForEvent(foundEvent.id, plan);
      }
      setAiPlan(plan);
      setCategories(getCategoriesForEvent(foundEvent.id));
      setTasks(getTasksForEvent(foundEvent.id));
    } else {
      setAiPlan(null);
      setCategories([]);
      setTasks([]);
    }
    setIsLoaded(true);
  }, [eventIdParam]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    const handleStorageChange = () => loadData();
    window.addEventListener("samaroh_storage_change", handleStorageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("samaroh_storage_change", handleStorageChange);
    };
  }, [loadData]);

  const handleSelectEvent = (id: string) => {
    setActiveEventId(id);
    const selected = getEventById(id);
    if (selected) {
      setEvent(selected);
      let plan = getAIPlanForEvent(id);
      if (!plan) {
        plan = generateDeterministicPlan(selected);
        saveAIPlanForEvent(id, plan);
      }
      setAiPlan(plan);
      setCategories(getCategoriesForEvent(id));
      setTasks(getTasksForEvent(id));
    }
  };

  const handleRegeneratePlan = async () => {
    if (!event) return;
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.plan) {
          const newPlan: AIEventPlan = {
            ...data.plan,
            eventId: event.id,
            source: data.source || "deterministic-fallback",
          };
          saveAIPlanForEvent(event.id, newPlan);
          setAiPlan(newPlan);
        }
      }
    } catch (err) {
      console.error("Failed to regenerate plan:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!isLoaded) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-sm text-[#6B635B]">
            <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin" />
            Loading celebration overview...
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <PageHeader
            eyebrow="Celebration Overview"
            title="Event Details"
            description="View and verify the parameters of your planned celebration."
          />

          <EmptyState
            title="No celebration plan found."
            description="You have not created an event yet. Complete our guided onboarding to structure your event blueprint."
            action={
              <Link href="/onboarding">
                <Button variant="primary" size="md">
                  <Plus className="w-4 h-4" />
                  Start Smart Onboarding
                </Button>
              </Link>
            }
          />
        </div>
      </AppLayout>
    );
  }

  // Calculate days remaining deterministically
  const calculateDaysRemaining = (dateStr: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining(event.eventDate);
  const currencyObj =
    CURRENCY_OPTIONS.find((c) => c.code === event.currency) || CURRENCY_OPTIONS[0];
  const atmosphereObj =
    ATMOSPHERE_OPTIONS.find((a) => a.id === event.atmosphere);
  const perGuestCost =
    event.guestCount > 0 ? Math.round(event.totalBudget / event.guestCount) : 0;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        {/* Page Header */}
        <PageHeader
          eyebrow="Celebration Overview"
          title={event.name}
          description={`Planned celebration in ${event.location} with ${event.guestCount} estimated guests.`}
          action={
            <div className="flex items-center gap-3">
              <Link href="/onboarding">
                <Button variant="outline" size="sm">
                  <Plus className="w-3.5 h-3.5" />
                  New Celebration
                </Button>
              </Link>
              {allEvents.length > 1 && (
                <select
                  value={event.id}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="px-3 py-1.5 bg-white text-[#1F1A17] text-xs font-medium rounded-xl border border-[#EBE5DC] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E] cursor-pointer"
                >
                  {allEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.occasion})
                    </option>
                  ))}
                </select>
              )}
            </div>
          }
        />

        {/* Success Banner if newly created */}
        {!event.isSampleData && (
          <div className="p-4 rounded-xl bg-[#3F7A56]/10 border border-[#3F7A56]/30 flex items-center gap-2.5 text-sm text-[#3F7A56]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">
              Event parameters successfully captured.
            </span>
          </div>
        )}

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
              {event.guestCount.toLocaleString()}{" "}
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
              {currencyObj.symbol}
              {event.totalBudget.toLocaleString()}
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
              {currencyObj.symbol}
              {perGuestCost.toLocaleString()}
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
                      {categories.length} Categories
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
                {currencyObj.symbol}{event.totalBudget.toLocaleString()}
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
                      {tasks.length} Milestones
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

        {/* Phase 3: AI Event Plan Blueprint */}
        {aiPlan && (
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
                      {aiPlan.source === "gemini" ? "Gemini 2.5 Flash" : "Celebration Intelligence Engine"}
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
                onClick={handleRegeneratePlan}
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
                  {aiPlan.eventSummary}
                </p>
              </div>

              {/* Assumptions & Disclaimers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-[#EBE5DC]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B] flex items-center gap-1.5 mb-2">
                    <Info className="w-3.5 h-3.5 text-[#5B1D2E]" /> Planning Assumptions
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#6B635B]">
                    {aiPlan.assumptions.map((assump, i) => (
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
                    {aiPlan.warnings.map((warn, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#C05621] font-bold">!</span>
                        <span>{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Follow-up Questions */}
              {aiPlan.followUpQuestions && aiPlan.followUpQuestions.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-[#EBE5DC]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3F7A56] flex items-center gap-1.5 mb-2">
                    <HelpCircle className="w-3.5 h-3.5 text-[#3F7A56]" /> Recommended Next Clarifications
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#6B635B]">
                    {aiPlan.followUpQuestions.map((q, i) => (
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
        )}

        {/* Detailed Blueprint Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 & 2: Atmosphere, Priorities & Vision */}
          <div className="md:col-span-2 space-y-6">
            {/* Atmosphere & Vision */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#C8963E]">
                  Atmosphere &amp; Theme
                </span>
                <CardTitle className="text-xl">
                  {atmosphereObj?.label || event.atmosphere}
                </CardTitle>
                {atmosphereObj?.tagline && (
                  <p className="text-xs font-medium text-[#6B635B]">
                    {atmosphereObj.tagline}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {atmosphereObj?.description && (
                  <p className="text-sm text-[#1F1A17] leading-relaxed">
                    {atmosphereObj.description}
                  </p>
                )}

                {event.preferences ? (
                  <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#EBE5DC]">
                    <p className="text-xs font-semibold text-[#6B635B] uppercase tracking-wider mb-1">
                      User Personal Vision
                    </p>
                    <p className="text-sm text-[#1F1A17] italic leading-relaxed">
                      &ldquo;{event.preferences}&rdquo;
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Ranked Spending Priorities */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#C8963E]">
                  Spending Priorities
                </span>
                <CardTitle className="text-xl">
                  Hierarchy of Importance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2.5">
                {(event.priorities || []).map((priorityKey, idx) => {
                  const item = SPENDING_PRIORITIES.find((p) => p.id === priorityKey);
                  return (
                    <div
                      key={priorityKey}
                      className="p-3 rounded-xl bg-[#F5F2EB]/50 border border-[#EBE5DC] flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-[#5B1D2E] text-white flex items-center justify-center font-bold text-xs">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-[#1F1A17]">
                            {item?.label || priorityKey}
                          </p>
                          <p className="text-xs text-[#6B635B] line-clamp-1">
                            {item?.description}
                          </p>
                        </div>
                      </div>
                      {idx === 0 && (
                        <Badge variant="accent">Top Priority</Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Must-Haves, Demographics & Boundaries */}
          <div className="space-y-6">
            {/* Must Haves Card */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#C8963E]">
                  Non-Negotiables
                </span>
                <CardTitle className="text-lg">Must-Have Essentials</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(event.mustHaves || []).length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {event.mustHaves.map((mh, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 p-2 rounded-lg bg-[#FBF9F5] border border-[#EBE5DC]"
                      >
                        <span className="text-[#3F7A56] font-bold">✓</span>
                        <span className="text-[#1F1A17] font-medium">{mh}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#6B635B] italic">
                    No specific must-haves entered.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Constraints & Accommodations */}
            <Card className="p-6 space-y-4">
              <CardHeader className="p-0 pb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#C8963E]">
                  Care &amp; Limitations
                </span>
                <CardTitle className="text-lg">Special Considerations</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-[#1F1A17] block mb-1">
                    Guest Demographic
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {event.constraints?.hasChildren && (
                      <Badge variant="default">Children Present</Badge>
                    )}
                    {event.constraints?.hasElderly && (
                      <Badge variant="default">Seniors / Elderly</Badge>
                    )}
                    {!event.constraints?.hasChildren &&
                      !event.constraints?.hasElderly && (
                        <span className="text-[#6B635B]">
                          Standard attendee demographic.
                        </span>
                      )}
                  </div>
                </div>

                {event.constraints?.thingsToAvoid && (
                  <div>
                    <span className="font-semibold text-[#1F1A17] block">
                      Things to Avoid:
                    </span>
                    <p className="text-[#6B635B] mt-0.5">
                      {event.constraints.thingsToAvoid}
                    </p>
                  </div>
                )}

                {event.constraints?.accessibilityRequirements && (
                  <div>
                    <span className="font-semibold text-[#1F1A17] block">
                      Accessibility Needs:
                    </span>
                    <p className="text-[#6B635B] mt-0.5">
                      {event.constraints.accessibilityRequirements}
                    </p>
                  </div>
                )}

                {event.constraints?.venueLimitations && (
                  <div>
                    <span className="font-semibold text-[#1F1A17] block">
                      Venue Limitations:
                    </span>
                    <p className="text-[#6B635B] mt-0.5">
                      {event.constraints.venueLimitations}
                    </p>
                  </div>
                )}

                {event.constraints?.culturalPreferences && (
                  <div>
                    <span className="font-semibold text-[#1F1A17] block">
                      Cultural Traditions:
                    </span>
                    <p className="text-[#6B635B] mt-0.5">
                      {event.constraints.culturalPreferences}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function EventOverviewPage() {
  return (
    <React.Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3 text-sm text-[#6B635B]">
              <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin" />
              Loading celebration overview...
            </div>
          </div>
        </AppLayout>
      }
    >
      <EventOverviewContent />
    </React.Suspense>
  );
}
