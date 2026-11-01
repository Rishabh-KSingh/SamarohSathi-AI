"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Store,
  Plus,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  FileText,
  Scale,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getActiveEvent,
  setActiveEventId,
  getEventById,
  getVendorsForEvent,
  addVendor,
  updateVendor,
  deleteVendor,
  getQuotationsForEvent,
  addQuotation,
  updateQuotation,
  deleteQuotation,
  selectQuotationForCategory,
  saveComparisonResult,
  getComparisonResult,
  getCategoriesForEvent,
  updateCategory,
} from "@/lib/storage";
import {
  EventData,
  Vendor,
  VendorCategory,
  VendorStatus,
  VendorQuotation,
  VendorQuestionItem,
  QuotationComparisonResult,
  BudgetCategory,
} from "@/types/event";
import {
  generateDeterministicVendorQuestions,
  generateDeterministicQuotationComparison,
} from "@/lib/vendor-engine";
import { QuotationComparisonRequest } from "@/lib/ai-schemas";
import { formatCurrency } from "@/lib/utils";

// Subcomponents
import { VendorListTab } from "@/components/vendors/vendor-list-tab";
import { QuotationsTab } from "@/components/vendors/quotations-tab";
import { QuotationComparisonTab } from "@/components/vendors/quotation-comparison-tab";
import { VendorQuestionsTab } from "@/components/vendors/vendor-questions-tab";
import { VendorModal } from "@/components/vendors/vendor-modal";
import { QuotationModal } from "@/components/vendors/quotation-modal";

const VENDOR_CATEGORIES: VendorCategory[] = [
  "Venue",
  "Caterer",
  "Photographer",
  "Decorator",
  "Entertainment",
  "Transportation",
  "Makeup",
  "Lighting",
  "Other",
];

const VENDOR_STATUSES: VendorStatus[] = [
  "Researching",
  "Contacted",
  "Quotation Received",
  "Shortlisted",
  "Selected",
  "Rejected",
];

const STATUS_COLORS: Record<VendorStatus, string> = {
  Researching: "bg-[#F5F2EB] text-[#6B635B] border-[#EBE5DC]",
  Contacted: "bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]",
  "Quotation Received": "bg-[#FFF9F0] text-[#C8963E] border-[#F6E5C8]",
  Shortlisted: "bg-[#FDF2F4] text-[#5B1D2E] border-[#F3D2D9]",
  Selected: "bg-[#F0FFF4] text-[#3F7A56] border-[#C6F6D5]",
  Rejected: "bg-[#FFF5F5] text-[#C05621] border-[#FED7D7]",
};

function VendorsContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("event_id");

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [quotations, setQuotations] = React.useState<VendorQuotation[]>([]);
  const [budgetCategories, setBudgetCategories] = React.useState<BudgetCategory[]>([]);
  const [activeTab, setActiveTab] = React.useState<"vendors" | "quotations" | "compare" | "questions">("vendors");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("All");
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Vendor Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = React.useState(false);
  const [editingVendor, setEditingVendor] = React.useState<Vendor | null>(null);
  const [initialCategoryForVendor, setInitialCategoryForVendor] = React.useState<VendorCategory>("Caterer");

  // Quotation Modal State
  const [isQuotationModalOpen, setIsQuotationModalOpen] = React.useState(false);
  const [editingQuotation, setEditingQuotation] = React.useState<VendorQuotation | null>(null);
  const [initialVendorIdForQuote, setInitialVendorIdForQuote] = React.useState("");
  const [initialCategoryForQuote, setInitialCategoryForQuote] = React.useState<VendorCategory>("Caterer");

  // Question Preparation State
  const [selectedCategoryForQuestions, setSelectedCategoryForQuestions] = React.useState<VendorCategory>("Caterer");
  const [questionRequirements, setQuestionRequirements] = React.useState("");
  const [preparedQuestions, setPreparedQuestions] = React.useState<{ category: string; questions: VendorQuestionItem[]; tips: string[] } | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = React.useState(false);

  // Comparison Matrix State
  const [comparisonCategory, setComparisonCategory] = React.useState<VendorCategory>("Caterer");
  const [selectedQuoteIds, setSelectedQuoteIds] = React.useState<string[]>([]);
  const [isLoadingComparison, setIsLoadingComparison] = React.useState(false);
  const [comparisonResult, setComparisonResult] = React.useState<QuotationComparisonResult | null>(null);
  const [comparisonSource, setComparisonSource] = React.useState<"gemini" | "deterministic-fallback">("gemini");
  const [budgetApplyNotice, setBudgetApplyNotice] = React.useState<string | null>(null);

  // Load Event and Vendor Data
  const loadData = React.useCallback(() => {
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
      const vList = getVendorsForEvent(currentEvent.id);
      setVendors(vList);

      const qList = getQuotationsForEvent(currentEvent.id);
      setQuotations(qList);

      const bCats = getCategoriesForEvent(currentEvent.id);
      setBudgetCategories(bCats);

      // Default selected quotes for comparison
      const initialCatQuotes = qList.filter((q) => q.category === comparisonCategory);
      setSelectedQuoteIds(initialCatQuotes.map((q) => q.id));

      // Load cached comparison
      const cachedComp = getComparisonResult(currentEvent.id, comparisonCategory);
      if (cachedComp) {
        setComparisonResult(cachedComp);
      }
    }
    setIsLoaded(true);
  }, [eventIdParam, comparisonCategory]);

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

  // Vendor Actions
  const handleOpenAddVendor = (category?: VendorCategory) => {
    setEditingVendor(null);
    setInitialCategoryForVendor(category || (categoryFilter !== "All" ? (categoryFilter as VendorCategory) : "Caterer"));
    setIsVendorModalOpen(true);
  };

  const handleOpenEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsVendorModalOpen(true);
  };

  const handleDeleteVendor = (id: string, name: string) => {
    if (confirm(`Remove vendor "${name}" and all associated quotations?`)) {
      deleteVendor(id);
      loadData();
    }
  };

  const handleSaveVendor = (data: {
    name: string;
    category: VendorCategory;
    status: VendorStatus;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    requirements: string;
    notes: string;
  }) => {
    if (!event) return;

    if (editingVendor) {
      updateVendor(editingVendor.id, {
        name: data.name,
        category: data.category,
        status: data.status,
        contactDetails: {
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          address: data.address,
        },
        requirements: data.requirements,
        notes: data.notes,
      });
    } else {
      addVendor(event.id, {
        name: data.name,
        category: data.category,
        status: data.status,
        contactDetails: {
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          address: data.address,
        },
        requirements: data.requirements,
        notes: data.notes,
      });
    }
    setIsVendorModalOpen(false);
    loadData();
  };

  // Quotation Actions
  const handleOpenAddQuotation = (vendorId?: string, category?: VendorCategory) => {
    setEditingQuotation(null);
    setInitialVendorIdForQuote(vendorId || (vendors[0]?.id || ""));
    setInitialCategoryForQuote(category || (vendors[0]?.category || "Caterer"));
    setIsQuotationModalOpen(true);
  };

  const handleOpenEditQuotation = (q: VendorQuotation) => {
    setEditingQuotation(q);
    setIsQuotationModalOpen(true);
  };

  const handleDeleteQuotation = (id: string) => {
    if (confirm("Delete this vendor quotation?")) {
      deleteQuotation(id);
      loadData();
    }
  };

  const handleSaveQuotation = (data: {
    vendorId: string;
    vendorName: string;
    category: VendorCategory;
    budgetCategoryId?: string;
    quotedAmount: number;
    guestCoverage: number;
    includedServices: string[];
    additionalCharges: string[];
    terms: string;
    missingInformation: string[];
    notes: string;
  }) => {
    if (!event) return;

    if (editingQuotation) {
      updateQuotation(editingQuotation.id, data);
    } else {
      addQuotation({
        eventId: event.id,
        ...data,
      });
    }
    setIsQuotationModalOpen(false);
    loadData();
  };

  const handleSelectPrimaryQuotation = (q: VendorQuotation) => {
    selectQuotationForCategory(q.eventId, q.category, q.id);
    loadData();
  };

  const handleApplyQuotationToBudget = (q: VendorQuotation) => {
    if (!q.budgetCategoryId) return;
    const cat = budgetCategories.find((c) => c.id === q.budgetCategoryId);
    if (!cat) return;

    const confirmed = confirm(
      `Apply quoted amount of ${formatCurrency(q.quotedAmount)} from "${q.vendorName}" as actual expense for category "${cat.name}"?\n\n(Current actual: ${formatCurrency(cat.actualAmount || 0)})`
    );
    if (confirmed) {
      updateCategory(cat.id, {
        actualAmount: q.quotedAmount,
        notes: `${cat.notes ? cat.notes + " • " : ""}[Quotation Applied: ${q.vendorName} ${formatCurrency(q.quotedAmount)}]`,
      });
      setBudgetApplyNotice(`Successfully applied ${formatCurrency(q.quotedAmount)} from ${q.vendorName} to "${cat.name}".`);
      setTimeout(() => setBudgetApplyNotice(null), 5000);
      loadData();
    }
  };

  // Interview Questions Preparation
  const handlePrepareQuestions = async (targetCat: VendorCategory, customReq?: string) => {
    if (!event) return;
    setSelectedCategoryForQuestions(targetCat);
    if (customReq) setQuestionRequirements(customReq);

    setActiveTab("questions");
    setIsLoadingQuestions(true);

    try {
      const res = await fetch("/api/vendor-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: event.occasion,
          guestCount: event.guestCount,
          budget: event.totalBudget,
          category: targetCat,
          requirements: customReq || questionRequirements || event.preferences,
          existingPlanSummary: `${event.name} in ${event.location}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setPreparedQuestions(data.result);
      } else {
        const fallback = generateDeterministicVendorQuestions({
          eventType: event.occasion,
          guestCount: event.guestCount,
          budget: event.totalBudget,
          category: targetCat,
          requirements: customReq || questionRequirements,
        });
        setPreparedQuestions(fallback);
      }
    } catch {
      const fallback = generateDeterministicVendorQuestions({
        eventType: event.occasion,
        guestCount: event.guestCount,
        budget: event.totalBudget,
        category: targetCat,
        requirements: customReq || questionRequirements,
      });
      setPreparedQuestions(fallback);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Toggle selection for comparison matrix
  const handleToggleQuoteSelection = (quoteId: string) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(quoteId) ? prev.filter((id) => id !== quoteId) : [...prev, quoteId]
    );
  };

  // Run AI Comparison
  const handleRunComparison = async () => {
    if (!event) return;
    setIsLoadingComparison(true);

    const catQuotes = quotations.filter(
      (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
    );
    const matchingCat = budgetCategories.find(
      (c) => c.name.toLowerCase() === comparisonCategory.toLowerCase()
    );

    try {
      const payload: QuotationComparisonRequest = {
        eventId: event.id,
        category: comparisonCategory,
        guestCount: event.guestCount,
        categoryBudget: matchingCat ? matchingCat.estimatedAmount : undefined,
        quotations: catQuotes.map((q) => ({
          id: q.id,
          vendorName: q.vendorName,
          quotedAmount: q.quotedAmount,
          guestCoverage: q.guestCoverage,
          includedServices: q.includedServices,
          additionalCharges: q.additionalCharges,
          terms: q.terms,
          missingInformation: q.missingInformation,
          notes: q.notes,
        })),
        userPriorities: event.priorities,
        userRequirements: event.preferences,
      };

      const res = await fetch("/api/compare-quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setComparisonResult(data.result);
        setComparisonSource(data.source || "gemini");
        saveComparisonResult(event.id, comparisonCategory, data.result);
      } else {
        const fallback = generateDeterministicQuotationComparison(payload);
        setComparisonResult(fallback);
        setComparisonSource("deterministic-fallback");
        saveComparisonResult(event.id, comparisonCategory, fallback);
      }
    } catch {
      const payload: QuotationComparisonRequest = {
        eventId: event.id,
        category: comparisonCategory,
        guestCount: event.guestCount,
        categoryBudget: matchingCat ? matchingCat.estimatedAmount : undefined,
        quotations: catQuotes.map((q) => ({
          id: q.id,
          vendorName: q.vendorName,
          quotedAmount: q.quotedAmount,
          guestCoverage: q.guestCoverage,
          includedServices: q.includedServices,
          additionalCharges: q.additionalCharges,
          terms: q.terms,
          missingInformation: q.missingInformation,
          notes: q.notes,
        })),
        userPriorities: event.priorities,
        userRequirements: event.preferences,
      };
      const fallback = generateDeterministicQuotationComparison(payload);
      setComparisonResult(fallback);
      setComparisonSource("deterministic-fallback");
      saveComparisonResult(event.id, comparisonCategory, fallback);
    } finally {
      setIsLoadingComparison(false);
    }
  };

  const handleComparisonCategoryChange = (newCat: VendorCategory) => {
    setComparisonCategory(newCat);
    const catQuotes = quotations.filter((q) => q.category === newCat);
    setSelectedQuoteIds(catQuotes.map((q) => q.id));
    if (event) {
      setComparisonResult(getComparisonResult(event.id, newCat));
    }
  };

  if (!isLoaded) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-sm text-[#6B635B]">
          <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin inline-block mr-2" />
          Loading vendor workspace...
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <EmptyState
          title="No Active Event Found"
          description="Create or select a celebration plan first to coordinate vendors, track quotations, and run AI comparisons."
          action={
            <Link href="/onboarding">
              <Button variant="primary" size="md">
                Create Celebration
              </Button>
            </Link>
          }
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Page Header */}
        <PageHeader
          eyebrow={`${event.occasion} Vendor Directory`}
          title="Vendor Coordination & Quotations"
          description="Coordinate service providers, prepare questions before contacting vendors, and compare side-by-side proposals."
          action={
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => handlePrepareQuestions(selectedCategoryForQuestions)}
                className="gap-2"
              >
                <HelpCircle className="w-4 h-4 text-[#C8963E]" />
                Prepare Interview Questions
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenAddVendor()}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Vendor
              </Button>
            </div>
          }
        />

        {/* Global Notice if quotation was applied to budget */}
        {budgetApplyNotice && (
          <div className="p-4 bg-[#F0FFF4] border border-[#C6F6D5] rounded-xl text-sm font-medium text-[#3F7A56] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#3F7A56]" />
              <span>{budgetApplyNotice}</span>
            </div>
            <Link href={`/budget?event_id=${event.id}`}>
              <Button variant="ghost" size="sm" className="text-[#3F7A56] hover:bg-[#C6F6D5]/50">
                View in Budget Planner <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* Primary Sub-Navigation Tabs */}
        <div className="border-b border-[#EBE5DC] flex items-center justify-between overflow-x-auto">
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("vendors")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "vendors"
                  ? "border-[#5B1D2E] text-[#5B1D2E]"
                  : "border-transparent text-[#6B635B] hover:text-[#1F1A17]"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Vendors ({vendors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("quotations")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "quotations"
                  ? "border-[#5B1D2E] text-[#5B1D2E]"
                  : "border-transparent text-[#6B635B] hover:text-[#1F1A17]"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Quotations ({quotations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("compare")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "compare"
                  ? "border-[#5B1D2E] text-[#5B1D2E]"
                  : "border-transparent text-[#6B635B] hover:text-[#1F1A17]"
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Quotation Comparison</span>
            </button>

            <button
              onClick={() => setActiveTab("questions")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "questions"
                  ? "border-[#5B1D2E] text-[#5B1D2E]"
                  : "border-transparent text-[#6B635B] hover:text-[#1F1A17]"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#C8963E]" />
              <span>Interview Questions</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Vendors Directory */}
        {activeTab === "vendors" && (
          <VendorListTab
            vendors={vendors}
            quotations={quotations}
            vendorCategories={VENDOR_CATEGORIES}
            categoryFilter={categoryFilter}
            statusColors={STATUS_COLORS}
            onCategoryFilterChange={setCategoryFilter}
            onOpenAddVendor={handleOpenAddVendor}
            onOpenEditVendor={handleOpenEditVendor}
            onDeleteVendor={handleDeleteVendor}
            onOpenAddQuotation={handleOpenAddQuotation}
            onPrepareQuestions={handlePrepareQuestions}
          />
        )}

        {/* Tab 2: Quotations List */}
        {activeTab === "quotations" && (
          <QuotationsTab
            quotations={
              categoryFilter === "All"
                ? quotations
                : quotations.filter((q) => q.category === categoryFilter)
            }
            budgetCategories={budgetCategories}
            onOpenAddQuotation={() => handleOpenAddQuotation()}
            onOpenEditQuotation={handleOpenEditQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            onSelectPrimaryQuotation={handleSelectPrimaryQuotation}
            onApplyQuotationToBudget={handleApplyQuotationToBudget}
          />
        )}

        {/* Tab 3: Side-by-Side Comparison */}
        {activeTab === "compare" && (
          <QuotationComparisonTab
            comparisonCategory={comparisonCategory}
            onComparisonCategoryChange={handleComparisonCategoryChange}
            vendorCategories={VENDOR_CATEGORIES}
            quotations={quotations}
            selectedQuoteIds={selectedQuoteIds}
            onToggleQuoteSelection={handleToggleQuoteSelection}
            onRunComparison={handleRunComparison}
            isLoadingComparison={isLoadingComparison}
            comparisonResult={comparisonResult}
            comparisonSource={comparisonSource}
            event={event}
            onOpenAddQuotation={handleOpenAddQuotation}
          />
        )}

        {/* Tab 4: Vendor Question Preparation */}
        {activeTab === "questions" && (
          <VendorQuestionsTab
            selectedCategory={selectedCategoryForQuestions}
            onSelectedCategoryChange={setSelectedCategoryForQuestions}
            vendorCategories={VENDOR_CATEGORIES}
            questionRequirements={questionRequirements}
            onQuestionRequirementsChange={setQuestionRequirements}
            onPrepareQuestions={handlePrepareQuestions}
            isLoadingQuestions={isLoadingQuestions}
            preparedQuestions={preparedQuestions}
          />
        )}

        {/* Modal: Add / Edit Vendor */}
        {isVendorModalOpen && (
          <VendorModal
            key={editingVendor ? editingVendor.id : `new_${initialCategoryForVendor}`}
            isOpen={isVendorModalOpen}
            onClose={() => setIsVendorModalOpen(false)}
            editingVendor={editingVendor}
            vendorCategories={VENDOR_CATEGORIES}
            vendorStatuses={VENDOR_STATUSES}
            initialCategory={initialCategoryForVendor}
            onSaveVendor={handleSaveVendor}
          />
        )}

        {/* Modal: Add / Edit Quotation */}
        {isQuotationModalOpen && (
          <QuotationModal
            key={editingQuotation ? editingQuotation.id : `new_${initialVendorIdForQuote}_${initialCategoryForQuote}`}
            isOpen={isQuotationModalOpen}
            onClose={() => setIsQuotationModalOpen(false)}
            editingQuotation={editingQuotation}
            vendors={vendors}
            vendorCategories={VENDOR_CATEGORIES}
            budgetCategories={budgetCategories}
            defaultGuestCount={event.guestCount}
            initialVendorId={initialVendorIdForQuote}
            initialCategory={initialCategoryForQuote}
            onSaveQuotation={handleSaveQuotation}
          />
        )}
      </div>
    </AppLayout>
  );
}

export default function VendorsPage() {
  return (
    <React.Suspense
      fallback={
        <AppLayout>
          <div className="p-12 text-center text-sm text-[#6B635B]">
            Loading vendor directory...
          </div>
        </AppLayout>
      }
    >
      <VendorsContent />
    </React.Suspense>
  );
}
