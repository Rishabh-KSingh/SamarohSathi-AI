"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Info,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getActiveEvent,
  getEventById,
  getAllEvents,
  setActiveEventId,
  getCategoriesForEvent,
  saveCategoriesForEvent,
  addCategory,
  updateCategory,
  deleteCategory,
  getQuotationsForEvent,
} from "@/lib/storage";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { generateDeterministicBudgetCategories } from "@/lib/planner-engine";
import { EventData, BudgetCategory, CategoryPriority, BudgetTradeoffSuggestion, BudgetTradeoffItem, VendorQuotation } from "@/types/event";

function BudgetPlannerContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("event_id");

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [allEvents, setAllEvents] = React.useState<EventData[]>([]);
  const [categories, setCategories] = React.useState<BudgetCategory[]>([]);
  const [quotations, setQuotations] = React.useState<VendorQuotation[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Modals & form state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<BudgetCategory | null>(null);
  const [isTradeoffsModalOpen, setIsTradeoffsModalOpen] = React.useState(false);
  const [tradeoffSuggestions, setTradeoffSuggestions] = React.useState<BudgetTradeoffSuggestion | null>(null);
  const [isLoadingTradeoffs, setIsLoadingTradeoffs] = React.useState(false);
  const [appliedTradeoffs, setAppliedTradeoffs] = React.useState<string[]>([]);

  // Accessible modal focus management & Escape dismissal
  const addCategoryModalRef = useModalA11y(isAddModalOpen, () => setIsAddModalOpen(false));
  const editCategoryModalRef = useModalA11y(Boolean(editingCategory), () => setEditingCategory(null));
  const tradeoffsModalRef = useModalA11y(isTradeoffsModalOpen, () => setIsTradeoffsModalOpen(false));

  // Form inputs for Add
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatEstimated, setNewCatEstimated] = React.useState<number | "">("");
  const [newCatActual, setNewCatActual] = React.useState<number | "">("");
  const [newCatPriority, setNewCatPriority] = React.useState<CategoryPriority>("Medium");
  const [newCatNotes, setNewCatNotes] = React.useState("");

  // Load active event & categories
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
      const cats = getCategoriesForEvent(currentEvent.id);
      setCategories(cats);
      const quotes = getQuotationsForEvent(currentEvent.id);
      setQuotations(quotes);
    } else {
      setCategories([]);
      setQuotations([]);
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

  // Calculations performed entirely by deterministic application logic
  const totalBudget = event?.totalBudget || 0;
  const totalEstimated = React.useMemo(() => {
    return categories.reduce((sum, c) => sum + (Number(c.estimatedAmount) || 0), 0);
  }, [categories]);

  const totalActual = React.useMemo(() => {
    return categories.reduce((sum, c) => sum + (Number(c.actualAmount) || 0), 0);
  }, [categories]);

  const remainingFromEstimated = totalBudget - totalEstimated;
  const remainingFromActual = totalBudget - totalActual;
  const estimatedUtilizationPct = totalBudget > 0 ? Math.round((totalEstimated / totalBudget) * 100) : 0;
  const actualUtilizationPct = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  const isOverBudget = totalEstimated > totalBudget;
  const overrunAmount = Math.max(0, totalEstimated - totalBudget);

  // Identify categories contributing to overrun (sorted by estimated descending)
  const contributingCategories = React.useMemo(() => {
    return [...categories]
      .filter((c) => c.estimatedAmount > 0)
      .sort((a, b) => b.estimatedAmount - a.estimatedAmount);
  }, [categories]);

  // Handle Event switch
  const handleSelectEvent = (id: string) => {
    setActiveEventId(id);
    const selected = getEventById(id);
    if (selected) {
      setEvent(selected);
      setCategories(getCategoriesForEvent(id));
    }
  };

  // Add Category Handler
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !newCatName.trim()) return;

    const added = addCategory(event.id, {
      name: newCatName.trim(),
      estimatedAmount: Number(newCatEstimated) || 0,
      actualAmount: Number(newCatActual) || 0,
      priority: newCatPriority,
      notes: newCatNotes.trim(),
      isAiGenerated: false,
    });

    setCategories((prev) => [...prev, added]);
    setIsAddModalOpen(false);
    setNewCatName("");
    setNewCatEstimated("");
    setNewCatActual("");
    setNewCatPriority("Medium");
    setNewCatNotes("");
  };

  // Edit Category Handler
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const updated = updateCategory(editingCategory.id, {
      name: editingCategory.name.trim(),
      estimatedAmount: Number(editingCategory.estimatedAmount) || 0,
      actualAmount: Number(editingCategory.actualAmount) || 0,
      priority: editingCategory.priority,
      notes: editingCategory.notes || "",
    });

    if (updated) {
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
    setEditingCategory(null);
  };

  // Delete Category Handler
  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from your budget?`)) {
      deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Reset to AI baseline categories
  const handleResetToBaseline = () => {
    if (!event) return;
    if (
      window.confirm(
        "Reset budget to the initial AI recommended category allocation? Your current custom edits will be replaced."
      )
    ) {
      const regenerated = generateDeterministicBudgetCategories(event);
      saveCategoriesForEvent(event.id, regenerated);
      setCategories(regenerated);
    }
  };

  // Request AI Trade-offs
  const handleRequestTradeoffs = async () => {
    if (!event) return;
    setIsLoadingTradeoffs(true);
    setIsTradeoffsModalOpen(true);
    setAppliedTradeoffs([]);

    try {
      const res = await fetch("/api/budget-tradeoffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          totalBudget: event.totalBudget,
          currentExpenses: categories,
          overrunAmount,
          priorities: event.priorities || ["food", "venue", "decor"],
          occasion: event.occasion,
          guestCount: event.guestCount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.tradeoffs) {
          setTradeoffSuggestions(data.tradeoffs);
        }
      }
    } catch (err) {
      console.error("Failed to fetch trade-offs:", err);
    } finally {
      setIsLoadingTradeoffs(false);
    }
  };

  // Apply single tradeoff
  const handleApplyTradeoff = (tradeoff: BudgetTradeoffItem) => {
    const matched = categories.find((c) => c.name === tradeoff.categoryName);
    if (!matched) return;

    const updated = updateCategory(matched.id, {
      estimatedAmount: tradeoff.suggestedEstimate,
      notes: `${matched.notes ? matched.notes + " • " : ""}Trade-off applied: ${tradeoff.reasoning}`,
    });

    if (updated) {
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setAppliedTradeoffs((prev) => [...prev, tradeoff.categoryName]);
    }
  };

  // Apply all trade-offs
  const handleApplyAllTradeoffs = () => {
    if (!tradeoffSuggestions) return;

    tradeoffSuggestions.tradeoffs.forEach((t) => {
      handleApplyTradeoff(t);
    });
  };

  if (!isLoaded) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-sm text-[#6B635B]">
            <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin" />
            Loading Budget Planner...
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
            eyebrow="Financial Command"
            title="Intelligent Budget Planner"
            description="Manage allocation, actual expenses, and trade-offs for your celebration."
          />
          <EmptyState
            title="No Celebration Selected"
            description="You need to create or select an active celebration to plan your budget."
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

  const currencySymbol = event.currency === "USD" ? "$" : event.currency === "EUR" ? "€" : event.currency === "GBP" ? "£" : "₹";

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Top Header & Event Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EBE5DC]">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="accent">Financial Control</Badge>
              <span className="text-xs font-semibold text-[#544E47] uppercase tracking-wider">
                {event.occasion}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1A17] tracking-tight mt-1">
              Budget Planner & Allocations
            </h1>
            <p className="text-sm sm:text-base text-[#544E47] mt-0.5">
              Celebration budget for &ldquo;{event.name}&rdquo; • Total Budget: {currencySymbol}{event.totalBudget.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToBaseline}
              title="Reset to recommended AI category allocation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Baselines
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Overrun Warning Banner (If Estimated > Budget) */}
        {isOverBudget && (
          <div className="bg-[#FFF5F0] border-2 border-[#C05621] rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#C05621]/15 text-[#C05621] shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
                    Budget Overrun Warning: {currencySymbol}{overrunAmount.toLocaleString("en-IN")} Exceeded
                  </h3>
                  <p className="text-xs text-[#6B635B] mt-0.5 leading-relaxed">
                    Total estimated allocations ({currencySymbol}{totalEstimated.toLocaleString("en-IN")}) exceed your available budget envelope of {currencySymbol}{totalBudget.toLocaleString("en-IN")} by {estimatedUtilizationPct - 100}%.
                    Your top spending priorities ({event.priorities?.join(", ") || "food & venue"}) are protected by default.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] font-semibold text-[#6B635B] uppercase tracking-wider">
                      Main contributors:
                    </span>
                    {contributingCategories.slice(0, 3).map((c) => (
                      <span
                        key={c.id}
                        className="text-xs font-medium px-2 py-0.5 bg-white border border-[#EBE5DC] rounded-lg text-[#1F1A17]"
                      >
                        {c.name}: {currencySymbol}{c.estimatedAmount.toLocaleString("en-IN")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                variant="accent"
                size="md"
                onClick={handleRequestTradeoffs}
                className="shrink-0 w-full sm:w-auto"
              >
                <Sparkles className="w-4 h-4" />
                Request AI Trade-Off Suggestions
              </Button>
            </div>
          </div>
        )}

        {/* Deterministic Financial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Available Budget */}
          <Card className="p-5 border-[#EBE5DC]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
              Total Available Budget
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-[#6B635B]">{currencySymbol}</span>
              <span className="font-serif text-2xl font-bold text-[#1F1A17]">
                {totalBudget.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[11px] text-[#6B635B] mt-1">
              Flexibility: <span className="font-medium capitalize text-[#1F1A17]">{event.budgetFlexibility}</span>
            </p>
          </Card>

          {/* Card 2: Estimated Expenses */}
          <Card className="p-5 border-[#EBE5DC]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
                Total Estimated
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isOverBudget ? "bg-[#FFF5F0] text-[#C05621]" : "bg-[#F0F7F3] text-[#3F7A56]"
                }`}
              >
                {estimatedUtilizationPct}% Allocated
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-[#6B635B]">{currencySymbol}</span>
              <span
                className={`font-serif text-2xl font-bold ${
                  isOverBudget ? "text-[#C05621]" : "text-[#1F1A17]"
                }`}
              >
                {totalEstimated.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[11px] text-[#6B635B] mt-1">
              {isOverBudget
                ? `+${currencySymbol}${overrunAmount.toLocaleString("en-IN")} over envelope`
                : `${currencySymbol}${remainingFromEstimated.toLocaleString("en-IN")} unallocated`}
            </p>
          </Card>

          {/* Card 3: Actual Booked Expenses */}
          <Card className="p-5 border-[#EBE5DC]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
                Actual Paid / Committed
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F2EB] text-[#1F1A17]">
                {actualUtilizationPct}% Spent
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-[#6B635B]">{currencySymbol}</span>
              <span className="font-serif text-2xl font-bold text-[#1F1A17]">
                {totalActual.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[11px] text-[#6B635B] mt-1">
              Remaining actual cash: <span className="font-semibold text-[#3F7A56]">{currencySymbol}{remainingFromActual.toLocaleString("en-IN")}</span>
            </p>
          </Card>

          {/* Card 4: Per Guest Cost */}
          <Card className="p-5 border-[#EBE5DC]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
              Per Guest Estimated Cost
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-[#6B635B]">{currencySymbol}</span>
              <span className="font-serif text-2xl font-bold text-[#1F1A17]">
                {event.guestCount > 0 ? Math.round(totalEstimated / event.guestCount).toLocaleString("en-IN") : 0}
              </span>
            </div>
            <p className="text-[11px] text-[#6B635B] mt-1">
              Based on <span className="font-medium text-[#1F1A17]">{event.guestCount} invited guests</span>
            </p>
          </Card>
        </div>

        {/* Visual Allocation Stack Bar */}
        <Card className="p-5 border-[#EBE5DC]">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B635B]">
              Category Allocation Breakdown
            </span>
            <span className="text-xs text-[#6B635B]">
              {categories.length} Active Categories
            </span>
          </div>

          {/* Allocation Bar */}
          <div className="w-full h-3.5 bg-[#EBE5DC] rounded-full overflow-hidden flex">
            {categories.map((c, i) => {
              const pct = totalEstimated > 0 ? (c.estimatedAmount / totalEstimated) * 100 : 0;
              if (pct <= 0) return null;
              const hues = [
                "#5B1D2E",
                "#C8963E",
                "#3F7A56",
                "#2B6CB0",
                "#805AD5",
                "#D69E2E",
                "#E53E3E",
                "#319795",
                "#718096",
                "#4A5568",
              ];
              const color = hues[i % hues.length];
              return (
                <div
                  key={c.id}
                  style={{ width: `${pct}%`, backgroundColor: color }}
                  className="h-full transition-all duration-300"
                  title={`${c.name}: ${currencySymbol}${c.estimatedAmount.toLocaleString()} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>

          {/* Mini Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs text-[#6B635B]">
            {categories.slice(0, 6).map((c, i) => {
              const pct = totalEstimated > 0 ? Math.round((c.estimatedAmount / totalEstimated) * 100) : 0;
              const hues = [
                "#5B1D2E",
                "#C8963E",
                "#3F7A56",
                "#2B6CB0",
                "#805AD5",
                "#D69E2E",
                "#E53E3E",
                "#319795",
                "#718096",
                "#4A5568",
              ];
              const color = hues[i % hues.length];
              return (
                <div key={c.id} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[#1F1A17] font-medium">{c.name}:</span>
                  <span>{pct}%</span>
                </div>
              );
            })}
            {categories.length > 6 && (
              <span className="text-xs text-[#6B635B] italic">+{categories.length - 6} more</span>
            )}
          </div>
        </Card>

        {/* Disclaimer per PRD Section 3.4 */}
        <div className="flex items-center gap-2 p-3.5 bg-[#FFF9F0] border border-[#C8963E]/30 rounded-xl text-xs text-[#6B635B]">
          <Info className="w-4 h-4 text-[#C8963E] shrink-0" />
          <span>
            <strong>Planning Notice:</strong> All initial figures are labeled &quot;Estimated — based on planning assumptions. Confirm with the vendor before booking.&quot; Never commit advance tokens without signed contracts.
          </span>
        </div>

        {/* Categories Table / List */}
        <Card className="border-[#EBE5DC] overflow-hidden">
          <div className="p-5 border-b border-[#EBE5DC] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1F1A17]">
                Budget Categories & Expenses
              </h2>
              <p className="text-xs text-[#6B635B] mt-0.5">
                Add, edit, or adjust categories. Enter confirmed vendor bills in the &quot;Actual&quot; column.
              </p>
            </div>
            <Badge variant="default">{categories.length} categories</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#EBE5DC] bg-[#FAF8F5] text-xs font-semibold text-[#6B635B] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Category & Notes</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4 text-right">Estimated</th>
                  <th className="py-3.5 px-4 text-right">Actual Paid</th>
                  <th className="py-3.5 px-4 text-right">Variance</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE5DC]">
                {categories.map((c) => {
                  const est = Number(c.estimatedAmount) || 0;
                  const act = Number(c.actualAmount) || 0;
                  const variance = act > 0 ? act - est : 0;
                  const linkedQuote = quotations.find(
                    (q) => q.budgetCategoryId === c.id || (q.isSelected && q.category.toLowerCase() === c.name.toLowerCase())
                  );
                  const quoteOverBudget = linkedQuote && linkedQuote.quotedAmount > est;

                  return (
                    <tr key={c.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-4 px-5 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1F1A17]">{c.name}</span>
                          {c.isAiGenerated && (
                            <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 bg-[#FFF9F0] text-[#C8963E] border border-[#C8963E]/30 rounded">
                              AI Estimate
                            </span>
                          )}
                        </div>
                        {c.notes && (
                          <p className="text-xs text-[#6B635B] mt-1 max-w-md leading-relaxed">
                            {c.notes}
                          </p>
                        )}
                        {linkedQuote && (
                          <div className="mt-2 p-2 bg-[#FAF8F5] rounded-lg border border-[#EBE5DC] text-[11px] flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#1F1A17]">
                                Quoted: ₹{linkedQuote.quotedAmount.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[#6B635B]">({linkedQuote.vendorName})</span>
                              {quoteOverBudget ? (
                                <span className="text-[#C05621] font-semibold flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" />
                                  +₹{(linkedQuote.quotedAmount - est).toLocaleString("en-IN")} over estimate
                                </span>
                              ) : (
                                <span className="text-[#3F7A56] font-semibold">
                                  ✓ Within estimate
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Apply quoted amount of ₹${linkedQuote.quotedAmount.toLocaleString(
                                        "en-IN"
                                      )} from ${linkedQuote.vendorName} to actual expense for ${c.name}?\n\n(Current actual: ₹${act.toLocaleString(
                                        "en-IN"
                                      )})`
                                    )
                                  ) {
                                    updateCategory(c.id, {
                                      actualAmount: linkedQuote.quotedAmount,
                                      notes: `${c.notes ? c.notes + " • " : ""}[Quotation Applied: ${linkedQuote.vendorName} ₹${linkedQuote.quotedAmount.toLocaleString("en-IN")}]`,
                                    });
                                    loadData();
                                  }
                                }}
                                className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-[#EBE5DC] rounded text-[#5B1D2E] hover:bg-[#FDF2F4] transition-colors"
                                title="Apply quotation to actual expense"
                              >
                                Apply to Actual
                              </button>
                              <Link
                                href={`/vendors?event_id=${event?.id || ""}`}
                                className="text-[10px] text-[#6B635B] hover:text-[#1F1A17] underline ml-1"
                              >
                                View Vendor
                              </Link>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            c.priority === "High"
                              ? "bg-[#FDF2F4] text-[#5B1D2E] border border-[#F3D2D9]"
                              : c.priority === "Medium"
                              ? "bg-[#FFF9F0] text-[#C8963E] border border-[#F6E5C8]"
                              : "bg-[#F5F2EB] text-[#6B635B] border border-[#EBE5DC]"
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-top text-right">
                        <span className="font-mono font-semibold text-[#1F1A17]">
                          {currencySymbol}{est.toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-top text-right">
                        <span className="font-mono font-medium text-[#1F1A17]">
                          {act > 0 ? `${currencySymbol}${act.toLocaleString("en-IN")}` : "—"}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-top text-right font-mono text-xs">
                        {act === 0 ? (
                          <span className="text-[#6B635B]">Pending</span>
                        ) : variance > 0 ? (
                          <span className="text-[#C05621] font-semibold">
                            +{currencySymbol}{variance.toLocaleString("en-IN")}
                          </span>
                        ) : variance < 0 ? (
                          <span className="text-[#3F7A56] font-semibold">
                            -{currencySymbol}{Math.abs(variance).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-[#6B635B]">On Budget</span>
                        )}
                      </td>

                      <td className="py-4 px-5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingCategory(c)}
                            className="p-1.5 rounded-lg text-[#6B635B] hover:text-[#5B1D2E] hover:bg-[#F5F2EB] transition-colors"
                            title="Edit Category & Amounts"
                            aria-label={`Edit category ${c.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.id, c.name)}
                            className="p-1.5 rounded-lg text-[#6B635B] hover:text-[#C05621] hover:bg-[#F5F2EB] transition-colors"
                            title="Delete Category"
                            aria-label={`Delete category ${c.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#FAF8F5] border-t-2 border-[#EBE5DC] font-semibold text-[#1F1A17]">
                  <td className="py-4 px-5">Total Calculated</td>
                  <td className="py-4 px-4" />
                  <td className="py-4 px-4 text-right font-mono font-bold text-base">
                    {currencySymbol}{totalEstimated.toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-base">
                    {currencySymbol}{totalActual.toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-xs">
                    {totalActual > 0
                      ? `${totalActual > totalEstimated ? "+" : ""}${currencySymbol}${(
                          totalActual - totalEstimated
                        ).toLocaleString("en-IN")}`
                      : "—"}
                  </td>
                  <td className="py-4 px-5" />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Modal: Add Category */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div
              ref={addCategoryModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-category-modal-title"
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#EBE5DC] space-y-5 animate-in fade-in-50 zoom-in-95"
            >
              <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
                <h3 id="add-category-modal-title" className="font-serif text-xl font-bold text-[#1F1A17]">
                  Add Expense Category
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  aria-label="Close dialog"
                  className="p-1 text-[#6B635B] hover:text-[#1F1A17] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Category Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Traditional Mehendi Artist, Baraat Brass Band"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Estimated Amount ({currencySymbol}) *
                    </label>
                    <Input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 25000"
                      value={newCatEstimated}
                      onChange={(e) =>
                        setNewCatEstimated(e.target.value === "" ? "" : Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Actual Paid ({currencySymbol})
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0 if not paid yet"
                      value={newCatActual}
                      onChange={(e) =>
                        setNewCatActual(e.target.value === "" ? "" : Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Category Priority
                  </label>
                  <select
                    value={newCatPriority}
                    onChange={(e) => setNewCatPriority(e.target.value as CategoryPriority)}
                    className="w-full bg-white border border-[#EBE5DC] rounded-xl px-3 py-2 text-sm text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                  >
                    <option value="High">High Priority (Essential)</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority (Flexible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Notes / Vendor Assumptions
                  </label>
                  <Textarea
                    placeholder="Enter notes, vendor contact or package inclusions..."
                    value={newCatNotes}
                    onChange={(e) => setNewCatNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE5DC]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Save Category
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Category */}
        {editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div
              ref={editCategoryModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-category-modal-title"
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#EBE5DC] space-y-5 animate-in fade-in-50 zoom-in-95"
            >
              <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
                <h3 id="edit-category-modal-title" className="font-serif text-xl font-bold text-[#1F1A17]">
                  Edit Expense Category
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  aria-label="Close dialog"
                  className="p-1 text-[#6B635B] hover:text-[#1F1A17] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Category Name *
                  </label>
                  <Input
                    type="text"
                    required
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Estimated Amount ({currencySymbol}) *
                    </label>
                    <Input
                      type="number"
                      required
                      min="0"
                      value={editingCategory.estimatedAmount}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          estimatedAmount: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Actual Paid ({currencySymbol})
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={editingCategory.actualAmount}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          actualAmount: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Category Priority
                  </label>
                  <select
                    value={editingCategory.priority}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        priority: e.target.value as CategoryPriority,
                      })
                    }
                    className="w-full bg-white border border-[#EBE5DC] rounded-xl px-3 py-2 text-sm text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                  >
                    <option value="High">High Priority (Essential)</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority (Flexible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Notes & Disclaimer
                  </label>
                  <Textarea
                    value={editingCategory.notes}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE5DC]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingCategory(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Update Category
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: AI Trade-Off Suggestions */}
        {isTradeoffsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div
              ref={tradeoffsModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tradeoffs-modal-title"
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#EBE5DC] space-y-5 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#C8963E]/15 text-[#C8963E]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="tradeoffs-modal-title" className="font-serif text-xl font-bold text-[#1F1A17]">
                      AI Budget Trade-Off Recommendations
                    </h3>
                    <p className="text-xs text-[#6B635B]">
                      Preserves your top priorities: &quot;{event.priorities?.join(", ")}&quot;
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTradeoffsModalOpen(false)}
                  aria-label="Close dialog"
                  className="p-1 text-[#6B635B] hover:text-[#1F1A17] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingTradeoffs ? (
                <div className="py-12 text-center text-sm text-[#6B635B] space-y-2">
                  <span className="w-6 h-6 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin inline-block" />
                  <p>Analyzing category allocations and preserving your key priorities...</p>
                </div>
              ) : tradeoffSuggestions ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F5F2EB] rounded-xl text-xs text-[#1F1A17] leading-relaxed">
                    <p className="font-semibold text-sm mb-1">{tradeoffSuggestions.summary}</p>
                    <p className="text-[#6B635B]">{tradeoffSuggestions.advice}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#6B635B]">
                        Suggested Adjustments ({tradeoffSuggestions.tradeoffs.length})
                      </span>
                      {appliedTradeoffs.length < tradeoffSuggestions.tradeoffs.length && (
                        <button
                          type="button"
                          onClick={handleApplyAllTradeoffs}
                          className="text-xs font-bold text-[#5B1D2E] hover:underline"
                        >
                          Accept All Recommendations
                        </button>
                      )}
                    </div>

                    {tradeoffSuggestions.tradeoffs.map((item, idx) => {
                      const isApplied = appliedTradeoffs.includes(item.categoryName);
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all ${
                            isApplied
                              ? "bg-[#F0F7F3] border-[#3F7A56]/30"
                              : "bg-white border-[#EBE5DC] hover:border-[#C8963E]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-[#1F1A17]">
                                  {item.categoryName}
                                </span>
                                {item.preservesPriority && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#FDF2F4] text-[#5B1D2E] rounded-full">
                                    Priority Protected
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6B635B] mt-1">{item.reasoning}</p>

                              <div className="flex items-center gap-4 mt-2 font-mono text-xs">
                                <span className="text-[#6B635B]">
                                  Current: {currencySymbol}{item.currentEstimate.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[#1F1A17] font-semibold">
                                  Proposed: {currencySymbol}{item.suggestedEstimate.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[#3F7A56] font-bold">
                                  Save {currencySymbol}{item.savings.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant={isApplied ? "outline" : "primary"}
                              disabled={isApplied}
                              onClick={() => handleApplyTradeoff(item)}
                            >
                              {isApplied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#3F7A56]" /> Applied
                                </>
                              ) : (
                                "Apply Change"
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-[#EBE5DC] flex items-center justify-between text-xs">
                    <span className="text-[#6B635B]">
                      Projected Total: <strong className="text-[#1F1A17]">{currencySymbol}{tradeoffSuggestions.projectedTotal.toLocaleString("en-IN")}</strong>
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setIsTradeoffsModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function BudgetPlannerPage() {
  return (
    <React.Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3 text-sm text-[#6B635B]">
              <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin" />
              Loading Budget Planner...
            </div>
          </div>
        </AppLayout>
      }
    >
      <BudgetPlannerContent />
    </React.Suspense>
  );
}
