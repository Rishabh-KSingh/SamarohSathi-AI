"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
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
import { CURRENCY_OPTIONS } from "@/lib/constants";
import { EventData, AIEventPlan, BudgetCategory, EventTask } from "@/types/event";
import { EventMetricsStrip } from "@/components/overview/event-metrics-strip";
import { AIBlueprintCard } from "@/components/overview/ai-blueprint-card";
import { EventDetailsGrid } from "@/components/overview/event-details-grid";

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

        {/* Key Metrics Strip & Workspace Cards */}
        <EventMetricsStrip
          event={event}
          daysRemaining={daysRemaining}
          currencySymbol={currencyObj.symbol}
          perGuestCost={perGuestCost}
          categoriesCount={categories.length}
          tasksCount={tasks.length}
        />

        {/* Phase 3: AI Event Plan Blueprint */}
        {aiPlan && (
          <AIBlueprintCard
            plan={aiPlan}
            isRegenerating={isRegenerating}
            onRegenerate={handleRegeneratePlan}
          />
        )}

        {/* Detailed Blueprint Grid */}
        <EventDetailsGrid event={event} />
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
