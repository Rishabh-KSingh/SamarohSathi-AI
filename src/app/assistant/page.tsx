"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Send,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Calendar,
  Users,
  PieChart,
  ShieldCheck,
  ChevronDown,
  Check,
  X,
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
import {
  EventData,
  BudgetCategory,
  EventTask,
  PlanRevisionProposal,
  PlanChangeRecord,
} from "@/types/event";
import { getSuggestedQuestionGroups } from "@/lib/assistant-suggestions";

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
            Loading AI Assistant & Adaptive Revision Engine...
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
                      {ev.name} ({currencySymbol}{ev.totalBudget.toLocaleString()})
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
                {currencySymbol}{event.totalBudget.toLocaleString("en-IN")}
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
                {getSuggestedQuestionGroups(event).map((group) => {
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
                            onClick={() => handleSelectSuggestedQuestion(q)}
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
          <div className="space-y-6 animate-in fade-in-50">
            {/* Header / Review Banner */}
            <div className="p-5 rounded-2xl bg-[#5B1D2E] text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/15 text-white">
                    Step 5 of 7: Review Proposal
                  </span>
                  <span className="text-[10px] text-white/80 font-mono">
                    Engine: {proposalSource === "gemini" ? "Gemini 2.5 Flash" : "Celebration Engine"}
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-bold tracking-tight">
                  Proposed Plan Revision Review
                </h2>
                <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
                  Requested: &ldquo;{activeProposal.requestedChange}&rdquo; • Your original plan is safely preserved until you decide.
                </p>
              </div>

              {/* Action Decision Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRejectProposal}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex-1 sm:flex-none"
                >
                  <X className="w-4 h-4" />
                  Reject Changes
                </Button>
                <Button
                  type="button"
                  onClick={handleAcceptProposal}
                  className="bg-[#C8963E] hover:bg-[#b08031] text-white font-bold flex-1 sm:flex-none shadow-sm"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Accept Changes
                </Button>
              </div>
            </div>

            {proposalSource === "deterministic-fallback" && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Note:</strong> Proposal generated using the rule-based celebration planning engine (Gemini API offline or unconfigured). All mathematical constraints and budget trade-offs are calculated deterministically.
                </span>
              </div>
            )}

            {/* Explanation & Planning Assumptions */}
            <Card className="p-5 border-[#EBE5DC] bg-white">
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C8963E] block mb-1">
                    AI Revision Rationale
                  </span>
                  <p className="text-sm text-[#1F1A17] font-medium leading-relaxed">
                    {activeProposal.explanation}
                  </p>
                </div>

                {activeProposal.assumptions.length > 0 && (
                  <div className="pt-2 border-t border-[#EBE5DC]">
                    <span className="text-[11px] font-semibold text-[#6B635B] uppercase tracking-wider block mb-1">
                      Planning Assumptions:
                    </span>
                    <ul className="space-y-1 text-xs text-[#6B635B]">
                      {activeProposal.assumptions.map((assump, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#5B1D2E] font-bold">•</span>
                          <span>{assump}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Event Level Changes (Guest Count, Budget, Date) */}
            {activeProposal.eventChanges && (
              <Card className="p-5 border-[#EBE5DC] bg-white">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] block mb-3">
                  Event Parameters Diff (Before &amp; After)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {activeProposal.eventChanges.guestCount && (
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DC]">
                      <span className="text-xs text-[#6B635B] block flex items-center gap-1 mb-1">
                        <Users className="w-3.5 h-3.5 text-[#5B1D2E]" /> Guest Count
                      </span>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="text-[#6B635B] line-through">
                          {activeProposal.eventChanges.guestCount.previous} guests
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C8963E]" />
                        <span className="text-[#1F1A17] font-bold text-base">
                          {activeProposal.eventChanges.guestCount.proposed} guests
                        </span>
                      </div>
                    </div>
                  )}

                  {activeProposal.eventChanges.totalBudget && (
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DC]">
                      <span className="text-xs text-[#6B635B] block flex items-center gap-1 mb-1">
                        <PieChart className="w-3.5 h-3.5 text-[#5B1D2E]" /> Total Budget Envelope
                      </span>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="text-[#6B635B] line-through font-mono">
                          {currencySymbol}{activeProposal.eventChanges.totalBudget.previous.toLocaleString("en-IN")}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C8963E]" />
                        <span className="text-[#5B1D2E] font-mono font-bold text-base">
                          {currencySymbol}{activeProposal.eventChanges.totalBudget.proposed.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeProposal.eventChanges.eventDate && (
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DC]">
                      <span className="text-xs text-[#6B635B] block flex items-center gap-1 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-[#5B1D2E]" /> Celebration Date
                      </span>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="text-[#6B635B] line-through font-mono">
                          {activeProposal.eventChanges.eventDate.previous}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C8963E]" />
                        <span className="text-[#1F1A17] font-mono font-bold text-base">
                          {activeProposal.eventChanges.eventDate.proposed}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Budget Category Impact (Before & After Table) */}
            {activeProposal.categoryDiffs.length > 0 && (
              <Card className="border-[#EBE5DC] overflow-hidden bg-white">
                <div className="p-4 border-b border-[#EBE5DC] bg-[#FAF8F5] flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
                      Budget Allocation Changes ({activeProposal.categoryDiffs.length})
                    </h3>
                    <p className="text-xs text-[#6B635B]">
                      Deterministic calculations of proposed adjustments
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#6B635B] block">Budget Delta:</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        activeProposal.budgetImpact.difference > 0
                          ? "text-[#C05621]"
                          : activeProposal.budgetImpact.difference < 0
                          ? "text-[#3F7A56]"
                          : "text-[#1F1A17]"
                      }`}
                    >
                      {activeProposal.budgetImpact.difference > 0 ? "+" : ""}
                      {currencySymbol}{activeProposal.budgetImpact.difference.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#EBE5DC] bg-white text-[#6B635B] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-3 text-right">Previous Estimate</th>
                        <th className="py-3 px-3 text-right">Proposed Estimate</th>
                        <th className="py-3 px-3 text-right">Difference</th>
                        <th className="py-3 px-4">Reasoning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBE5DC]">
                      {activeProposal.categoryDiffs.map((diff, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#1F1A17]">
                            {diff.categoryName}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[#6B635B]">
                            {currencySymbol}{diff.previousEstimated.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#1F1A17]">
                            {currencySymbol}{diff.proposedEstimated.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {diff.difference > 0 ? (
                              <span className="text-[#C05621] flex items-center justify-end gap-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                +{currencySymbol}{diff.difference.toLocaleString("en-IN")}
                              </span>
                            ) : diff.difference < 0 ? (
                              <span className="text-[#3F7A56] flex items-center justify-end gap-1">
                                <TrendingDown className="w-3.5 h-3.5" />
                                -{currencySymbol}{Math.abs(diff.difference).toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-[#6B635B]">₹0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#6B635B] max-w-xs leading-relaxed">
                            {diff.reasoning}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Timeline & Task Rescheduling Impact */}
            {activeProposal.taskDiffs.length > 0 && (
              <Card className="border-[#EBE5DC] overflow-hidden bg-white">
                <div className="p-4 border-b border-[#EBE5DC] bg-[#FAF8F5]">
                  <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
                    Timeline &amp; Task Adjustments ({activeProposal.taskDiffs.length})
                  </h3>
                  <p className="text-xs text-[#6B635B]">
                    Rescheduled milestone deadlines and new follow-up tasks
                  </p>
                </div>

                <div className="p-4 space-y-2.5">
                  {activeProposal.taskDiffs.map((tDiff, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#1F1A17]">
                            {tDiff.title}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white text-[#C8963E] border border-[#C8963E]/30">
                            {tDiff.action}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B635B] mt-0.5">{tDiff.reasoning}</p>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                        {tDiff.previousDueDate && (
                          <span className="text-[#6B635B] line-through">
                            {tDiff.previousDueDate}
                          </span>
                        )}
                        {tDiff.previousDueDate && <ArrowRight className="w-3 h-3 text-[#C8963E]" />}
                        <span className="font-bold text-[#1F1A17] bg-white px-2 py-1 rounded border border-[#EBE5DC]">
                          Due: {tDiff.proposedDueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Unchanged Information Guarantee */}
            <div className="p-4 rounded-xl bg-[#F0F7F3] border border-[#3F7A56]/30 flex items-center justify-between gap-3 text-xs text-[#3F7A56]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#3F7A56]" />
                <span className="font-medium">
                  <strong>Data Integrity Guarantee:</strong> {activeProposal.affectedUnchangedSummary.summary} Unrelated contracts and preferences remain untouched.
                </span>
              </div>
              <Badge variant="accent">Zero Unrelated Overwrite</Badge>
            </div>

            {/* Warnings if any */}
            {activeProposal.warnings.length > 0 && (
              <div className="p-4 rounded-xl bg-[#FFF5F0] border border-[#C05621]/40 space-y-1.5 text-xs text-[#C05621]">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Important Planning Advisories</span>
                </div>
                <ul className="space-y-1 list-disc list-inside">
                  {activeProposal.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE5DC]">
              <Button type="button" variant="ghost" size="md" onClick={handleRejectProposal}>
                <X className="w-4 h-4" /> Discard &amp; Keep Original Plan
              </Button>
              <Button type="button" variant="primary" size="md" onClick={handleAcceptProposal}>
                <Check className="w-4 h-4 stroke-[3]" /> Confirm &amp; Apply Changes
              </Button>
            </div>
          </div>
        )}

        {/* Change History Section */}
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
              <p>No plan revisions have been accepted yet for &ldquo;{event.name}&rdquo;.</p>
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
