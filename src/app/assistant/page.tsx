"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  HelpCircle,
  ChevronDown,
  Plus,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getActiveEvent,
  getEventById,
  getAllEvents,
  setActiveEventId,
  getCategoriesForEvent,
  getTasksForEvent,
  getChangeHistoryForEvent,
  applyPlanRevision,
} from "@/lib/storage";
import { formatNumber } from "@/lib/utils";
import {
  EventData,
  BudgetCategory,
  EventTask,
  PlanRevisionProposal,
  PlanChangeRecord,
} from "@/types/event";
import { SuggestedPromptsGrid } from "@/components/assistant/suggested-prompts-grid";
import { RevisionProposalReview } from "@/components/assistant/revision-proposal-review";
import { ChangeHistoryList } from "@/components/assistant/change-history-list";

function AIAssistantContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("event_id");

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [allEvents, setAllEvents] = React.useState<EventData[]>([]);
  const [categories, setCategories] = React.useState<BudgetCategory[]>([]);
  const [tasks, setTasks] = React.useState<EventTask[]>([]);
  const [changeHistory, setChangeHistory] = React.useState<PlanChangeRecord[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Assistant Input State
  const [userQuery, setUserQuery] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSelectSuggestedQuestion = (question: string) => {
    setUserQuery(question);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Active Proposal / Review State
  const [activeProposal, setActiveProposal] = React.useState<PlanRevisionProposal | null>(null);
  const [proposalSource, setProposalSource] = React.useState<string>("gemini");
  const [acceptedNotification, setAcceptedNotification] = React.useState<string | null>(null);
  const [rejectedNotification, setRejectedNotification] = React.useState<string | null>(null);

  // Clarification state
  const [clarificationResponse, setClarificationResponse] = React.useState("");

  // AI Connection Status State
  const [aiStatus, setAiStatus] = React.useState<{
    status: "connected" | "missing_key" | "invalid_key" | "error" | "checking";
    model: string;
    message: string;
  }>({
    status: "checking",
    model: "gemini-2.5-flash",
    message: "Checking Gemini connection status...",
  });

  React.useEffect(() => {
    fetch("/api/ai-status")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status) {
          setAiStatus(data);
        }
      })
      .catch((err) => {
        setAiStatus({
          status: "error",
          model: "gemini-2.5-flash",
          message: err instanceof Error ? err.message : "Failed to ping AI diagnostics endpoint",
        });
      });
  }, []);

  const loadData = React.useCallback(() => {
    const events = getAllEvents();
    setAllEvents(events);

    let currentEvent: EventData | null = null;
    if (eventIdParam) {
      currentEvent = getEventById(eventIdParam);
      if (currentEvent) setActiveEventId(currentEvent.id);
    }
    if (!currentEvent) {
      currentEvent = getActiveEvent();
    }

    setEvent(currentEvent);

    if (currentEvent) {
      setCategories(getCategoriesForEvent(currentEvent.id));
      setTasks(getTasksForEvent(currentEvent.id));
      setChangeHistory(getChangeHistoryForEvent(currentEvent.id));
    } else {
      setCategories([]);
      setTasks([]);
      setChangeHistory([]);
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
      setCategories(getCategoriesForEvent(id));
      setTasks(getTasksForEvent(id));
      setChangeHistory(getChangeHistoryForEvent(id));
      setActiveProposal(null);
      setAcceptedNotification(null);
      setRejectedNotification(null);
    }
  };

  // Submit Natural Language Change Request
  const handleRequestRevision = async (queryText?: string) => {
    const textToSend = (queryText || userQuery).trim();
    if (!event || !textToSend) return;

    setIsAnalyzing(true);
    setApiError(null);
    setAcceptedNotification(null);
    setRejectedNotification(null);

    try {
      const payload = {
        eventId: event.id,
        userRequest: textToSend,
        currentEvent: {
          id: event.id,
          name: event.name,
          occasion: event.occasion,
          eventDate: event.eventDate,
          location: event.location,
          guestCount: event.guestCount,
          totalBudget: event.totalBudget,
          currency: event.currency || "INR",
          budgetFlexibility: event.budgetFlexibility,
          atmosphere: event.atmosphere,
          preferences: event.preferences,
          priorities: event.priorities,
          mustHaves: event.mustHaves,
        },
        currentCategories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          estimatedAmount: c.estimatedAmount,
          actualAmount: c.actualAmount || 0,
          priority: c.priority,
          notes: c.notes || "",
        })),
        currentTasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || "",
          dueDate: t.dueDate,
          priority: t.priority,
          status: t.status,
          dependencyIds: t.dependencyIds || [],
        })),
      };

      const res = await fetch("/api/propose-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze change request");
      }

      setActiveProposal(data.proposal);
      setProposalSource(data.source || "gemini");
      setUserQuery("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error analyzing request";
      setApiError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Answer to AI Clarification Question
  const handleClarificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationResponse.trim() || !activeProposal) return;
    const combined = `${activeProposal.requestedChange}. Clarification: ${clarificationResponse.trim()}`;
    setClarificationResponse("");
    handleRequestRevision(combined);
  };

  // Accept Proposal — Commit changes to LocalStorage
  const handleAcceptProposal = () => {
    if (!activeProposal) return;

    try {
      const result = applyPlanRevision(activeProposal);
      setAcceptedNotification(
        `Changes successfully applied! Updated celebration parameters, ${result.updatedCategories} budget categories, and ${result.updatedTasks} tasks.`
      );
      setActiveProposal(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply plan changes";
      setApiError(msg);
    }
  };

  // Reject Proposal — Leave original plan untouched
  const handleRejectProposal = () => {
    setActiveProposal(null);
    setRejectedNotification(
      "Proposed changes rejected. Your original celebration plan, budget, and task deadlines remain 100% unchanged."
    );
  };

  if (!isLoaded) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-sm text-[#6B635B]">
            <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin" />
            Loading AI Assistant &amp; Adaptive Revision Engine...
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
            eyebrow="Adaptive Intelligence"
            title="AI Celebration Assistant"
            description="Adapt your celebration plan in natural language as requirements evolve."
          />
          <EmptyState
            title="No Celebration Selected"
            description="Create or select an active celebration to propose plan revisions."
            action={
              <Link href="/onboarding">
                <Button variant="primary" size="md">
                  <Plus className="w-4 h-4" />
                  Create Celebration
                </Button>
              </Link>
            }
          />
        </div>
      </AppLayout>
    );
  }

  const currencySymbol =
    event.currency === "USD"
      ? "$"
      : event.currency === "EUR"
      ? "€"
      : event.currency === "GBP"
      ? "£"
      : "₹";

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Top Header & Event Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EBE5DC]">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="accent">Intelligent Plan Revision</Badge>
              <span className="text-xs font-semibold text-[#544E47] uppercase tracking-wider">
                {event.occasion}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1A17] tracking-tight mt-1">
              Adaptive Plan Revision
            </h1>
            <p className="text-sm sm:text-base text-[#544E47] mt-0.5">
              Refine your celebration plan in natural language. Review side-by-side impact diffs before applying.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* AI Status Diagnostic Pill */}
            {aiStatus.status === "connected" ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
                title={aiStatus.message}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{aiStatus.model} • Connected</span>
              </div>
            ) : aiStatus.status === "missing_key" ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-xs"
                title="Set GEMINI_API_KEY in .env.local to enable live AI"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Gemini API Key Missing</span>
              </div>
            ) : aiStatus.status === "checking" ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F9F6F0] text-[#6B635B] border border-[#EBE5DC] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#6B635B] animate-ping" />
                <span>Checking AI Connection...</span>
              </div>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 shadow-xs"
                title={aiStatus.message}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Gemini Connection Failed</span>
              </div>
            )}

            {allEvents.length > 1 && (
              <div className="relative">
                <select
                  value={event.id}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="appearance-none bg-white text-xs font-medium text-[#1F1A17] border border-[#EBE5DC] rounded-xl px-3 py-2 pr-8 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                >
                  {allEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({currencySymbol}{formatNumber(ev.totalBudget)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B635B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Current Event Baseline Snapshot Card */}
        <Card className="p-4 bg-white border-[#EBE5DC]">
          <div className="flex items-center justify-between pb-2 border-b border-[#EBE5DC]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C8963E]">
              Current Active Blueprint Baseline
            </span>
            <div className="flex items-center gap-3 text-xs text-[#6B635B]">
              <Link href={`/budget?event_id=${event.id}`} className="hover:text-[#5B1D2E] underline">
                View Budget ({categories.length} categories)
              </Link>
              <span>•</span>
              <Link href={`/timeline?event_id=${event.id}`} className="hover:text-[#5B1D2E] underline">
                View Timeline ({tasks.length} tasks)
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div>
              <span className="text-[#6B635B] block">Event Title:</span>
              <strong className="text-[#1F1A17] font-serif text-sm truncate block">
                {event.name}
              </strong>
            </div>
            <div>
              <span className="text-[#6B635B] block">Guests:</span>
              <strong className="text-[#1F1A17] text-sm">
                {event.guestCount} attendees
              </strong>
            </div>
            <div>
              <span className="text-[#6B635B] block">Total Budget:</span>
              <strong className="text-[#5B1D2E] text-sm font-mono font-bold">
                {currencySymbol}{formatNumber(event.totalBudget)}
              </strong>
            </div>
            <div>
              <span className="text-[#6B635B] block">Celebration Date:</span>
              <strong className="text-[#1F1A17] text-sm font-mono">
                {event.eventDate || "Date TBD"}
              </strong>
            </div>
          </div>
        </Card>

        {/* Notifications (Accepted / Rejected / Error) */}
        {acceptedNotification && (
          <div className="p-4 rounded-xl bg-[#F0F7F3] border border-[#3F7A56]/30 flex items-start gap-3 text-xs text-[#3F7A56] animate-in fade-in-50">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#3F7A56]" />
            <div>
              <h4 className="font-bold text-sm">Revision Accepted &amp; Saved</h4>
              <p className="mt-0.5 leading-relaxed">{acceptedNotification}</p>
            </div>
          </div>
        )}

        {rejectedNotification && (
          <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#C8963E]/40 flex items-start gap-3 text-xs text-[#6B635B] animate-in fade-in-50">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#C8963E]" />
            <div>
              <h4 className="font-bold text-sm text-[#1F1A17]">Proposal Discarded</h4>
              <p className="mt-0.5 leading-relaxed">{rejectedNotification}</p>
            </div>
          </div>
        )}

        {apiError && (
          <div className="p-4 rounded-xl bg-[#FFF5F0] border border-[#C05621] flex items-start gap-3 text-xs text-[#C05621] animate-in fade-in-50">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Revision Analysis Error</h4>
              <p className="mt-0.5 leading-relaxed">{apiError}</p>
            </div>
          </div>
        )}

        {/* Natural Language Command Bar */}
        <Card className="p-6 border-[#EBE5DC] bg-white shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#5B1D2E] text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
                  What would you like to change?
                </h3>
                <p className="text-xs text-[#6B635B]">
                  Describe modifications to guests, budget, timeline, catering, or priorities. The AI interprets context without overwriting.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRequestRevision();
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder='e.g. "Increase guest count from 250 to 300" or "Reduce budget by ₹1,00,000, don&apos;t touch food"'
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                disabled={isAnalyzing}
                className="flex-1 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl px-4 py-3 text-sm text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isAnalyzing || !userQuery.trim()}
                className="shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Propose Change
                  </>
                )}
              </Button>
            </form>

            {/* Try These Requests Section */}
            <SuggestedPromptsGrid
              event={event}
              onSelectQuestion={handleSelectSuggestedQuestion}
            />
          </div>
        </Card>

        {/* Interactive Clarification Card (If AI detected ambiguity) */}
        {activeProposal && activeProposal.requiresClarification && (
          <Card className="p-6 border-2 border-[#C8963E] bg-[#FFF9F0] shadow-sm animate-in fade-in-50">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#C8963E]/20 text-[#C8963E] shrink-0 mt-0.5">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <Badge variant="accent">Clarification Required</Badge>
                  <h3 className="font-serif text-lg font-bold text-[#1F1A17] mt-1">
                    {activeProposal.clarificationQuestion}
                  </h3>
                  <p className="text-xs text-[#6B635B] mt-1">
                    Your request was: &ldquo;{activeProposal.requestedChange}&rdquo;. Please clarify so we don&apos;t guess your celebration numbers.
                  </p>
                </div>
              </div>

              <form onSubmit={handleClarificationSubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type your clarification here..."
                  value={clarificationResponse}
                  onChange={(e) => setClarificationResponse(e.target.value)}
                  className="flex-1 bg-white border border-[#EBE5DC] rounded-xl px-3.5 py-2 text-sm text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                />
                <Button type="submit" variant="primary" size="sm">
                  Submit Clarification
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveProposal(null)}
                >
                  Cancel
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Structured Before-and-After Revision Proposal Review Screen */}
        {activeProposal && !activeProposal.requiresClarification && (
          <RevisionProposalReview
            proposal={activeProposal}
            proposalSource={proposalSource}
            currencySymbol={currencySymbol}
            onAccept={handleAcceptProposal}
            onReject={handleRejectProposal}
          />
        )}

        {/* Change History Section */}
        <ChangeHistoryList
          changeHistory={changeHistory}
          eventName={event.name}
        />
      </div>
    </AppLayout>
  );
}

export default function AIAssistantPage() {
  return (
    <React.Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3 text-sm text-[#6B635B]">
              <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin" />
              Loading AI Assistant...
            </div>
          </div>
        </AppLayout>
      }
    >
      <AIAssistantContent />
    </React.Suspense>
  );
}
