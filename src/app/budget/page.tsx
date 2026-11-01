"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Info,
  ChevronDown,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { generateDeterministicBudgetCategories } from "@/lib/planner-engine";
import { formatNumber } from "@/lib/utils";
import {
  EventData,
  BudgetCategory,
  BudgetTradeoffSuggestion,
  BudgetTradeoffItem,
  VendorQuotation,
} from "@/types/event";
import { BudgetMetrics } from "@/components/budget/budget-metrics";
import { BudgetAllocationBar } from "@/components/budget/budget-allocation-bar";
import { BudgetCategoryTable } from "@/components/budget/budget-category-table";
import {
  BudgetCategoryModal,
  BudgetCategoryFormData,
} from "@/components/budget/budget-category-modal";
import { BudgetTradeoffsModal } from "@/components/budget/budget-tradeoffs-modal";

function BudgetPlannerContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("event_id");

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [allEvents, setAllEvents] = React.useState<EventData[]>([]);
  const [categories, setCategories] = React.useState<BudgetCategory[]>([]);
  const [quotations, setQuotations] = React.useState<VendorQuotation[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<BudgetCategory | null>(null);
  const [isTradeoffsModalOpen, setIsTradeoffsModalOpen] = React.useState(false);
  const [tradeoffSuggestions, setTradeoffSuggestions] = React.useState<BudgetTradeoffSuggestion | null>(null);
  const [isLoadingTradeoffs, setIsLoadingTradeoffs] = React.useState(false);
  const [appliedTradeoffs, setAppliedTradeoffs] = React.useState<string[]>([]);

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
      setQuotations(getQuotationsForEvent(id));
    }
  };

  // Add Category Handler
  const handleAddCategory = (formData: BudgetCategoryFormData) => {
    if (!event) return;

    const added = addCategory(event.id, {
      name: formData.name,
      estimatedAmount: formData.estimatedAmount,
      actualAmount: formData.actualAmount,
      priority: formData.priority,
      notes: formData.notes,
      isAiGenerated: false,
    });

    setCategories((prev) => [...prev, added]);
    setIsAddModalOpen(false);
  };

  // Edit Category Handler
  const handleSaveEdit = (formData: BudgetCategoryFormData) => {
    if (!editingCategory) return;

    const updated = updateCategory(editingCategory.id, {
      name: formData.name,
      estimatedAmount: formData.estimatedAmount,
      actualAmount: formData.actualAmount,
      priority: formData.priority,
      notes: formData.notes,
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

  // Apply quotation to actual amount
  const handleApplyQuotation = (category: BudgetCategory, quote: VendorQuotation) => {
    const act = Number(category.actualAmount) || 0;
    if (
      window.confirm(
        `Apply quoted amount of ₹${formatNumber(quote.quotedAmount)} from ${quote.vendorName} to actual expense for ${category.name}?\n\n(Current actual: ₹${formatNumber(act)})`
      )
    ) {
      updateCategory(category.id, {
        actualAmount: quote.quotedAmount,
        notes: `${category.notes ? category.notes + " • " : ""}[Quotation Applied: ${quote.vendorName} ₹${formatNumber(quote.quotedAmount)}]`,
      });
      loadData();
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
              Celebration budget for &ldquo;{event.name}&rdquo; • Total Budget: {currencySymbol}
              {formatNumber(event.totalBudget)}
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
                      {ev.name} ({currencySymbol}{formatNumber(ev.totalBudget)})
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
                    Budget Overrun Warning: {currencySymbol}{formatNumber(overrunAmount)} Exceeded
                  </h3>
                  <p className="text-xs text-[#6B635B] mt-0.5 leading-relaxed">
                    Total estimated allocations ({currencySymbol}{formatNumber(totalEstimated)}) exceed your available budget envelope of {currencySymbol}{formatNumber(totalBudget)} by {estimatedUtilizationPct - 100}%.
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
                        {c.name}: {currencySymbol}{formatNumber(c.estimatedAmount)}
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

        {/* Financial Metric Cards */}
        <BudgetMetrics
          totalBudget={totalBudget}
          totalEstimated={totalEstimated}
          totalActual={totalActual}
          remainingFromEstimated={remainingFromEstimated}
          remainingFromActual={remainingFromActual}
          estimatedUtilizationPct={estimatedUtilizationPct}
          actualUtilizationPct={actualUtilizationPct}
          isOverBudget={isOverBudget}
          overrunAmount={overrunAmount}
          currencySymbol={currencySymbol}
          guestCount={event.guestCount}
          budgetFlexibility={event.budgetFlexibility}
        />

        {/* Visual Allocation Stack Bar */}
        <BudgetAllocationBar
          categories={categories}
          totalEstimated={totalEstimated}
          currencySymbol={currencySymbol}
        />

        {/* Disclaimer per PRD Section 3.4 */}
        <div className="flex items-center gap-2 p-3.5 bg-[#FFF9F0] border border-[#C8963E]/30 rounded-xl text-xs text-[#6B635B]">
          <Info className="w-4 h-4 text-[#C8963E] shrink-0" />
          <span>
            <strong>Planning Notice:</strong> All initial figures are labeled &quot;Estimated — based on planning assumptions. Confirm with the vendor before booking.&quot; Never commit advance tokens without signed contracts.
          </span>
        </div>

        {/* Categories Table / List */}
        <BudgetCategoryTable
          categories={categories}
          quotations={quotations}
          currencySymbol={currencySymbol}
          totalEstimated={totalEstimated}
          totalActual={totalActual}
          eventId={event.id}
          onEdit={(cat) => setEditingCategory(cat)}
          onDelete={handleDeleteCategory}
          onApplyQuotation={handleApplyQuotation}
        />

        {/* Modal: Add Category */}
        {isAddModalOpen && (
          <BudgetCategoryModal
            key="add-category"
            isOpen={isAddModalOpen}
            currencySymbol={currencySymbol}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAddCategory}
          />
        )}

        {/* Modal: Edit Category */}
        {editingCategory && (
          <BudgetCategoryModal
            key={`edit-category-${editingCategory.id}`}
            isOpen={Boolean(editingCategory)}
            category={editingCategory}
            currencySymbol={currencySymbol}
            onClose={() => setEditingCategory(null)}
            onSave={handleSaveEdit}
          />
        )}

        {/* Modal: AI Trade-Off Suggestions */}
        <BudgetTradeoffsModal
          isOpen={isTradeoffsModalOpen}
          isLoading={isLoadingTradeoffs}
          tradeoffs={tradeoffSuggestions}
          appliedTradeoffs={appliedTradeoffs}
          currencySymbol={currencySymbol}
          priorities={event.priorities || ["food", "venue", "decor"]}
          onApplyTradeoff={handleApplyTradeoff}
          onApplyAllTradeoffs={handleApplyAllTradeoffs}
          onClose={() => setIsTradeoffsModalOpen(false)}
        />
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
