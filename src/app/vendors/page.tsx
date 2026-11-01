"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
  Users,
  ShieldAlert,
  FileText,
  BadgeCheck,
  Scale,
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
import { useModalA11y } from "@/lib/use-modal-a11y";
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
import { generateDeterministicVendorQuestions, generateDeterministicQuotationComparison } from "@/lib/vendor-engine";
import { QuotationComparisonRequest } from "@/lib/ai-schemas";

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
  const [vName, setVName] = React.useState("");
  const [vCategory, setVCategory] = React.useState<VendorCategory>("Caterer");
  const [vPhone, setVPhone] = React.useState("");
  const [vEmail, setVEmail] = React.useState("");
  const [vContactPerson, setVContactPerson] = React.useState("");
  const [vAddress, setVAddress] = React.useState("");
  const [vRequirements, setVRequirements] = React.useState("");
  const [vNotes, setVNotes] = React.useState("");
  const [vStatus, setVStatus] = React.useState<VendorStatus>("Researching");

  // Quotation Modal State
  const [isQuotationModalOpen, setIsQuotationModalOpen] = React.useState(false);
  const [editingQuotation, setEditingQuotation] = React.useState<VendorQuotation | null>(null);
  const [qVendorId, setQVendorId] = React.useState("");
  const [qCategory, setQCategory] = React.useState<VendorCategory>("Caterer");
  const [qBudgetCatId, setQBudgetCatId] = React.useState("");
  const [qAmount, setQAmount] = React.useState<number | "">("");
  const [qCoverage, setQCoverage] = React.useState<number | "">("");
  const [qServicesText, setQServicesText] = React.useState("");
  const [qAdditionalChargesText, setQAdditionalChargesText] = React.useState("");
  const [qTerms, setQTerms] = React.useState("");
  const [qMissingInfoText, setQMissingInfoText] = React.useState("");
  const [qNotes, setQNotes] = React.useState("");

  // Accessible modal focus management & Escape dismissal
  const vendorModalRef = useModalA11y(isVendorModalOpen, () => setIsVendorModalOpen(false));
  const quotationModalRef = useModalA11y(isQuotationModalOpen, () => setIsQuotationModalOpen(false));

  // Question Preparation State
  const [selectedCategoryForQuestions, setSelectedCategoryForQuestions] = React.useState<VendorCategory>("Caterer");
  const [questionRequirements, setQuestionRequirements] = React.useState("");
  const [preparedQuestions, setPreparedQuestions] = React.useState<{ category: string; questions: VendorQuestionItem[]; tips: string[] } | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = React.useState(false);
  const [copiedQuestionIdx, setCopiedQuestionIdx] = React.useState<number | null>(null);
  const [copiedAllQuestions, setCopiedAllQuestions] = React.useState(false);

  // Comparison State
  const [comparisonCategory, setComparisonCategory] = React.useState<VendorCategory>("Caterer");
  const [selectedQuoteIds, setSelectedQuoteIds] = React.useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = React.useState<QuotationComparisonResult | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = React.useState(false);

  // Budget apply notice
  const [budgetApplyNotice, setBudgetApplyNotice] = React.useState<string | null>(null);

  // Load Data
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
      const v = getVendorsForEvent(currentEvent.id);
      const q = getQuotationsForEvent(currentEvent.id);
      const b = getCategoriesForEvent(currentEvent.id);
      setVendors(v);
      setQuotations(q);
      setBudgetCategories(b);

      // Load cached comparison if any
      const cachedComp = getComparisonResult(currentEvent.id, comparisonCategory);
      if (cachedComp) {
        setComparisonResult(cachedComp);
      }
    } else {
      setVendors([]);
      setQuotations([]);
      setBudgetCategories([]);
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

  // ==========================================
  // Vendor Form Handlers
  // ==========================================
  const handleOpenAddVendor = (defaultCat?: VendorCategory) => {
    setEditingVendor(null);
    setVName("");
    setVCategory(defaultCat || "Caterer");
    setVPhone("");
    setVEmail("");
    setVContactPerson("");
    setVAddress("");
    setVRequirements("");
    setVNotes("");
    setVStatus("Researching");
    setIsVendorModalOpen(true);
  };

  const handleOpenEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setVName(v.name);
    setVCategory(v.category);
    setVPhone(v.contactDetails.phone || "");
    setVEmail(v.contactDetails.email || "");
    setVContactPerson(v.contactDetails.contactPerson || "");
    setVAddress(v.contactDetails.address || "");
    setVRequirements(v.requirements);
    setVNotes(v.notes);
    setVStatus(v.status);
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !vName.trim()) return;

    if (editingVendor) {
      updateVendor(editingVendor.id, {
        name: vName.trim(),
        category: vCategory,
        contactDetails: {
          phone: vPhone.trim(),
          email: vEmail.trim(),
          contactPerson: vContactPerson.trim(),
          address: vAddress.trim(),
        },
        requirements: vRequirements.trim(),
        notes: vNotes.trim(),
        status: vStatus,
      });
    } else {
      addVendor(event.id, {
        name: vName.trim(),
        category: vCategory,
        contactDetails: {
          phone: vPhone.trim(),
          email: vEmail.trim(),
          contactPerson: vContactPerson.trim(),
          address: vAddress.trim(),
        },
        requirements: vRequirements.trim(),
        notes: vNotes.trim(),
        status: vStatus,
      });
    }

    setIsVendorModalOpen(false);
    loadData();
  };

  const handleDeleteVendor = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete vendor "${name}" and all associated quotations?`)) {
      deleteVendor(id);
      loadData();
    }
  };

  // ==========================================
  // Quotation Form Handlers
  // ==========================================
  const handleOpenAddQuotation = (defaultVendorId?: string, defaultCategory?: VendorCategory) => {
    setEditingQuotation(null);
    const chosenVendor = vendors.find((v) => v.id === defaultVendorId) || vendors[0];
    setQVendorId(defaultVendorId || (chosenVendor ? chosenVendor.id : ""));
    setQCategory(defaultCategory || (chosenVendor ? chosenVendor.category : "Caterer"));
    setQBudgetCatId("");
    setQAmount("");
    setQCoverage(event ? event.guestCount : 100);
    setQServicesText("");
    setQAdditionalChargesText("");
    setQTerms("");
    setQMissingInfoText("");
    setQNotes("");
    setIsQuotationModalOpen(true);
  };

  const handleOpenEditQuotation = (q: VendorQuotation) => {
    setEditingQuotation(q);
    setQVendorId(q.vendorId);
    setQCategory(q.category);
    setQBudgetCatId(q.budgetCategoryId || "");
    setQAmount(q.quotedAmount);
    setQCoverage(q.guestCoverage);
    setQServicesText(q.includedServices.join("\n"));
    setQAdditionalChargesText(q.additionalCharges.join("\n"));
    setQTerms(q.terms);
    setQMissingInfoText(q.missingInformation.join("\n"));
    setQNotes(q.notes);
    setIsQuotationModalOpen(true);
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !qVendorId || !qAmount || Number(qAmount) <= 0) return;

    const vendorObj = vendors.find((v) => v.id === qVendorId);
    const vendorName = vendorObj ? vendorObj.name : "Vendor";

    const includedServices = qServicesText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const additionalCharges = qAdditionalChargesText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const missingInformation = qMissingInfoText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (editingQuotation) {
      updateQuotation(editingQuotation.id, {
        vendorId: qVendorId,
        vendorName,
        category: qCategory,
        budgetCategoryId: qBudgetCatId || undefined,
        quotedAmount: Number(qAmount),
        guestCoverage: Number(qCoverage) || 0,
        includedServices: includedServices.length > 0 ? includedServices : ["Standard service package"],
        additionalCharges,
        terms: qTerms.trim(),
        missingInformation,
        notes: qNotes.trim(),
      });
    } else {
      addQuotation({
        vendorId: qVendorId,
        vendorName,
        eventId: event.id,
        category: qCategory,
        budgetCategoryId: qBudgetCatId || undefined,
        quotedAmount: Number(qAmount),
        guestCoverage: Number(qCoverage) || 0,
        includedServices: includedServices.length > 0 ? includedServices : ["Standard service package"],
        additionalCharges,
        terms: qTerms.trim(),
        missingInformation,
        notes: qNotes.trim(),
      });
    }

    setIsQuotationModalOpen(false);
    loadData();
  };

  const handleDeleteQuotation = (id: string) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      deleteQuotation(id);
      loadData();
    }
  };

  const handleSelectPrimaryQuotation = (q: VendorQuotation) => {
    if (!event) return;
    selectQuotationForCategory(q.id, q.category, event.id);
    loadData();
  };

  const handleApplyQuotationToBudget = (q: VendorQuotation) => {
    if (!event || !q.budgetCategoryId) {
      alert("Please link this quotation to a budget category first by editing it.");
      return;
    }
    const cat = budgetCategories.find((c) => c.id === q.budgetCategoryId);
    if (!cat) return;

    if (
      window.confirm(
        `Apply quoted amount of ₹${q.quotedAmount.toLocaleString("en-IN")} from "${q.vendorName}" as actual expense for category "${cat.name}"?\n\n(Current actual: ₹${(cat.actualAmount || 0).toLocaleString("en-IN")})`
      )
    ) {
      updateCategory(cat.id, {
        actualAmount: q.quotedAmount,
        notes: `${cat.notes ? cat.notes + " • " : ""}[Quotation Applied: ${q.vendorName} ₹${q.quotedAmount.toLocaleString("en-IN")}]`,
      });
      setBudgetApplyNotice(`Successfully applied ₹${q.quotedAmount.toLocaleString("en-IN")} from ${q.vendorName} to "${cat.name}".`);
      setTimeout(() => setBudgetApplyNotice(null), 5000);
      loadData();
    }
  };

  // ==========================================
  // Question Preparation Handlers
  // ==========================================
  const handlePrepareQuestions = async (cat?: VendorCategory, customReq?: string) => {
    if (!event) return;
    const targetCat = cat || selectedCategoryForQuestions;
    setSelectedCategoryForQuestions(targetCat);
    if (customReq !== undefined) setQuestionRequirements(customReq);

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
        // Fallback locally
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

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIdx(idx);
    setTimeout(() => setCopiedQuestionIdx(null), 2500);
  };

  const handleCopyAllQuestions = () => {
    if (!preparedQuestions) return;
    const fullText = `SamarohSathi AI • Vendor Preparation Questions (${preparedQuestions.category})
Event: ${event?.name || "Celebration"} (${event?.guestCount} Guests)
--------------------------------------------------
${preparedQuestions.questions
  .map(
    (q, i) => `${i + 1}. ${q.question}
   [Purpose]: ${q.purpose}`
  )
  .join("\n\n")}

Recommended Tips:
${preparedQuestions.tips.map((t) => `• ${t}`).join("\n")}`;

    navigator.clipboard.writeText(fullText);
    setCopiedAllQuestions(true);
    setTimeout(() => setCopiedAllQuestions(false), 3000);
  };

  // ==========================================
  // Comparison Handlers
  // ==========================================
  const handleToggleQuoteSelection = (id: string) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRunComparison = async () => {
    if (!event) return;
    const catQuotes = quotations.filter(
      (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
    );

    if (catQuotes.length < 2) {
      alert("Please select at least 2 quotations in this category to run a side-by-side comparison.");
      return;
    }

    setIsLoadingComparison(true);

    // Find linked budget category limit if exists
    const matchingCat = budgetCategories.find(
      (c) =>
        c.name.toLowerCase().includes(comparisonCategory.toLowerCase()) ||
        catQuotes.some((q) => q.budgetCategoryId === c.id)
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
        saveComparisonResult(event.id, comparisonCategory, data.result);
      } else {
        const fallback = generateDeterministicQuotationComparison(payload);
        setComparisonResult(fallback);
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
      saveComparisonResult(event.id, comparisonCategory, fallback);
    } finally {
      setIsLoadingComparison(false);
    }
  };

  // Filtered lists
  const filteredVendors = vendors.filter((v) =>
    categoryFilter === "All" ? true : v.category === categoryFilter
  );

  const filteredQuotations = quotations.filter((q) =>
    categoryFilter === "All" ? true : q.category === categoryFilter
  );

  const statusColors: Record<VendorStatus, string> = {
    Researching: "bg-[#F5F2EB] text-[#6B635B] border-[#EBE5DC]",
    Contacted: "bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]",
    "Quotation Received": "bg-[#FFF9F0] text-[#C8963E] border-[#F6E5C8]",
    Shortlisted: "bg-[#FDF2F4] text-[#5B1D2E] border-[#F3D2D9]",
    Selected: "bg-[#F0FFF4] text-[#3F7A56] border-[#C6F6D5]",
    Rejected: "bg-[#FFF5F5] text-[#C05621] border-[#FED7D7]",
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
                Create Event
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
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "vendors"
                  ? "border-[#5B1D2E] text-[#5B1D2E]"
                  : "border-transparent text-[#6B635B] hover:text-[#1F1A17]"
              }`}
            >
              <Store className="w-4 h-4" />
              Vendors ({vendors.length})
            </button>
            <button
              onClick={() => setActiveTab("quotations")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "quotations"
                  ? "border-[#5B1D2E] text-[#5B1D2E]"
                  : "border-transparent text-[#6B635B] hover:text-[#1F1A17]"
              }`}
            >
              <FileText className="w-4 h-4" />
              Quotations ({quotations.length})
            </button>
            <button
              onClick={() => setActiveTab("compare")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "compare"
                  ? "border-[#5B1D2E] text-[#5B1D2E]"
                  : "border-transparent text-[#6B635B] hover:text-[#1F1A17]"
              }`}
            >
              <Scale className="w-4 h-4" />
              Quotation Comparison
            </button>
            <button
              onClick={() => {
                setActiveTab("questions");
                if (!preparedQuestions) handlePrepareQuestions(selectedCategoryForQuestions);
              }}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "questions"
                  ? "border-[#5B1D2E] text-[#5B1D2E]"
                  : "border-transparent text-[#6B635B] hover:text-[#1F1A17]"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#C8963E]" />
              Question Prep
            </button>
          </div>

          {/* Quick link to Budget Planner */}
          <Link href={`/budget?event_id=${event.id}`} className="text-xs font-semibold text-[#5B1D2E] hover:underline flex items-center gap-1">
            Budget Planner <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: VENDORS DIRECTORY                                     */}
        {/* ============================================================ */}
        {activeTab === "vendors" && (
          <div className="space-y-6">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-[#6B635B] uppercase tracking-wider mr-1">
                Filter:
              </span>
              <button
                onClick={() => setCategoryFilter("All")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  categoryFilter === "All"
                    ? "bg-[#5B1D2E] text-white shadow-sm"
                    : "bg-white border border-[#EBE5DC] text-[#6B635B] hover:bg-[#FAF8F5]"
                }`}
              >
                All Categories ({vendors.length})
              </button>
              {VENDOR_CATEGORIES.map((cat) => {
                const count = vendors.filter((v) => v.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      categoryFilter === cat
                        ? "bg-[#5B1D2E] text-white shadow-sm"
                        : "bg-white border border-[#EBE5DC] text-[#6B635B] hover:bg-[#FAF8F5]"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Vendor Cards Grid */}
            {filteredVendors.length === 0 ? (
              <EmptyState
                title="No Vendors Added in this Category"
                description="Add caterers, decorators, venues, photographers, or entertainers you are researching or contacting."
                action={
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleOpenAddVendor(categoryFilter !== "All" ? (categoryFilter as VendorCategory) : undefined)}
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add First Vendor
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredVendors.map((v) => {
                  const vendorQuotes = quotations.filter((q) => q.vendorId === v.id);
                  const selectedQuote = vendorQuotes.find((q) => q.isSelected);

                  return (
                    <Card
                      key={v.id}
                      className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="space-y-3.5">
                        {/* Card Header: Category & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8963E]">
                              {v.category}
                            </span>
                            <h3 className="font-serif text-lg font-bold text-[#1F1A17] mt-0.5">
                              {v.name}
                            </h3>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColors[v.status]}`}
                          >
                            {v.status}
                          </span>
                        </div>

                        {/* Contact Person & Details */}
                        <div className="space-y-1.5 text-xs text-[#6B635B]">
                          {v.contactDetails.contactPerson && (
                            <div className="font-medium text-[#1F1A17]">
                              Spokesperson: {v.contactDetails.contactPerson}
                            </div>
                          )}
                          {v.contactDetails.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[#C8963E]" />
                              <a
                                href={`tel:${v.contactDetails.phone}`}
                                className="hover:text-[#5B1D2E] underline"
                              >
                                {v.contactDetails.phone}
                              </a>
                            </div>
                          )}
                          {v.contactDetails.email && (
                            <div className="flex items-center gap-2 truncate">
                              <Mail className="w-3.5 h-3.5 text-[#C8963E]" />
                              <a
                                href={`mailto:${v.contactDetails.email}`}
                                className="hover:text-[#5B1D2E] underline truncate"
                              >
                                {v.contactDetails.email}
                              </a>
                            </div>
                          )}
                          {v.contactDetails.address && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-[#C8963E] flex-shrink-0" />
                              <span className="truncate">{v.contactDetails.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Requirements snippet */}
                        {v.requirements && (
                          <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#EBE5DC] text-xs">
                            <span className="font-semibold text-[#1F1A17] block mb-0.5">
                              Host Requirements:
                            </span>
                            <p className="text-[#6B635B] line-clamp-2 leading-relaxed">
                              {v.requirements}
                            </p>
                          </div>
                        )}

                        {/* Notes */}
                        {v.notes && (
                          <p className="text-xs text-[#6B635B] italic line-clamp-2">
                            &ldquo;{v.notes}&rdquo;
                          </p>
                        )}

                        {/* Associated Quotations Pill */}
                        <div className="pt-2 border-t border-[#EBE5DC]/70 flex items-center justify-between text-xs">
                          <span className="text-[#6B635B]">
                            {vendorQuotes.length} Quotation{vendorQuotes.length === 1 ? "" : "s"}
                          </span>
                          {selectedQuote ? (
                            <span className="text-[#3F7A56] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selected (₹{selectedQuote.quotedAmount.toLocaleString("en-IN")})
                            </span>
                          ) : vendorQuotes.length > 0 ? (
                            <span className="text-[#C8963E] font-medium">
                              From ₹{Math.min(...vendorQuotes.map((q) => q.quotedAmount)).toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-[#9E978E]">No quote yet</span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-4 mt-3 border-t border-[#EBE5DC] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePrepareQuestions(v.category, v.requirements)}
                            className="p-1.5 text-xs text-[#5B1D2E] hover:bg-[#FDF2F4] rounded-md transition-colors flex items-center gap-1 font-semibold"
                            title="Generate Interview Questions"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#C8963E]" />
                            Interview Prep
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAddQuotation(v.id, v.category)}
                            className="p-1.5 text-xs text-[#3F7A56] hover:bg-[#F0FFF4] rounded-md transition-colors flex items-center gap-1 font-semibold"
                            title="Add Quotation"
                          >
                            <Plus className="w-3.5 h-3.5" /> Quote
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditVendor(v)}
                            className="p-1.5 text-[#6B635B] hover:text-[#5B1D2E] hover:bg-[#FAF8F5] rounded-md transition-colors"
                            title="Edit Vendor"
                            aria-label={`Edit vendor details for ${v.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVendor(v.id, v.name)}
                            className="p-1.5 text-[#6B635B] hover:text-[#C05621] hover:bg-[#FFF5F5] rounded-md transition-colors"
                            title="Delete Vendor"
                            aria-label={`Delete vendor ${v.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: QUOTATIONS LIST                                       */}
        {/* ============================================================ */}
        {activeTab === "quotations" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
                  Celebration Quotations
                </h3>
                <p className="text-xs text-[#6B635B]">
                  Record detailed vendor proposals, verify per-guest coverage, inspect hidden surcharges, and connect to budget categories.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenAddQuotation()}
                className="gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Add Quotation
              </Button>
            </div>

            {filteredQuotations.length === 0 ? (
              <EmptyState
                title="No Quotations Added Yet"
                description="Add formal or informal quotes from venues, caterers, decorators, or photographers to analyze their breakdown."
                action={
                  <Button variant="primary" size="md" onClick={() => handleOpenAddQuotation()}>
                    <Plus className="w-4 h-4 mr-1.5" /> Add First Quotation
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredQuotations.map((q) => {
                  const linkedCat = budgetCategories.find((c) => c.id === q.budgetCategoryId);
                  const perGuest = q.guestCoverage > 0 ? Math.round(q.quotedAmount / q.guestCoverage) : 0;
                  const isOverBudget = linkedCat && q.quotedAmount > linkedCat.estimatedAmount;
                  const variance = linkedCat ? q.quotedAmount - linkedCat.estimatedAmount : 0;

                  return (
                    <Card
                      key={q.id}
                      className={`p-6 space-y-4 relative transition-all ${
                        q.isSelected
                          ? "border-2 border-[#3F7A56] bg-white shadow-sm"
                          : "border border-[#EBE5DC] bg-white hover:border-[#C8963E]/60"
                      }`}
                    >
                      {/* Top Bar: Category & Selection Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8963E]">
                              {q.category}
                            </span>
                            {q.isSelected && (
                              <span className="text-[11px] font-bold px-2 py-0.5 bg-[#F0FFF4] text-[#3F7A56] border border-[#C6F6D5] rounded-full flex items-center gap-1">
                                <BadgeCheck className="w-3.5 h-3.5" /> Primary Selected Quote
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif text-xl font-bold text-[#1F1A17] mt-0.5">
                            {q.vendorName}
                          </h4>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-2xl font-bold text-[#1F1A17]">
                            ₹{q.quotedAmount.toLocaleString("en-IN")}
                          </div>
                          {q.guestCoverage > 0 && (
                            <span className="text-xs text-[#6B635B] block">
                              ~₹{perGuest.toLocaleString("en-IN")}/pax ({q.guestCoverage} guests)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Budget Connection Banner */}
                      {linkedCat ? (
                        <div
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                            isOverBudget
                              ? "bg-[#FFF9F0] border-[#F6E5C8] text-[#C05621]"
                              : "bg-[#FAF8F5] border-[#EBE5DC] text-[#3F7A56]"
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-[#1F1A17] block">
                              Linked Category: {linkedCat.name}
                            </span>
                            <span className="text-[#6B635B]">
                              Estimated Budget: ₹{linkedCat.estimatedAmount.toLocaleString("en-IN")} •{" "}
                              {isOverBudget ? (
                                <strong className="text-[#C05621]">
                                  +₹{variance.toLocaleString("en-IN")} over estimate
                                </strong>
                              ) : (
                                <strong className="text-[#3F7A56]">
                                  ₹{Math.abs(variance).toLocaleString("en-IN")} under estimate
                                </strong>
                              )}
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyQuotationToBudget(q)}
                            className="text-xs py-1 px-2.5 h-auto text-[#1F1A17]"
                            title="Apply to Budget Category Actuals"
                          >
                            Apply to Actuals
                          </Button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-[#FAF8F5] border border-dashed border-[#EBE5DC] rounded-xl text-xs text-[#6B635B] flex items-center justify-between">
                          <span>Not linked to a budget category.</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuotation(q)}
                            className="text-xs font-semibold text-[#5B1D2E] hover:underline"
                          >
                            Link Category
                          </button>
                        </div>
                      )}

                      {/* Included Services List */}
                      <div>
                        <span className="text-xs font-semibold text-[#1F1A17] block mb-1.5 uppercase tracking-wider">
                          Included Deliverables ({q.includedServices.length}):
                        </span>
                        <ul className="space-y-1">
                          {q.includedServices.map((s, i) => (
                            <li key={i} className="text-xs text-[#4A4540] flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-[#3F7A56] mt-0.5 flex-shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Additional Charges / Hidden Cost Risk */}
                      {q.additionalCharges.length > 0 && (
                        <div className="p-3 bg-[#FFF5F5] border border-[#FED7D7] rounded-xl text-xs space-y-1">
                          <span className="font-semibold text-[#C05621] flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Additional / Unbundled Charges:
                          </span>
                          <ul className="list-disc list-inside text-[#822727] space-y-0.5 pl-1">
                            {q.additionalCharges.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing Information Indicators */}
                      {q.missingInformation.length > 0 && (
                        <div className="p-3 bg-[#FFF9F0] border border-[#F6E5C8] rounded-xl text-xs space-y-1">
                          <span className="font-semibold text-[#C8963E] flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Missing Information to Clarify:
                          </span>
                          <ul className="list-disc list-inside text-[#744210] space-y-0.5 pl-1">
                            {q.missingInformation.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Terms */}
                      {q.terms && (
                        <div className="text-xs text-[#6B635B] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EBE5DC]">
                          <strong className="text-[#1F1A17] block mb-0.5">Commercial Terms:</strong>
                          <p>{q.terms}</p>
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-[#EBE5DC] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {!q.isSelected && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectPrimaryQuotation(q)}
                              className="text-xs py-1 px-2.5 h-auto"
                            >
                              Set as Primary
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuotation(q)}
                            className="p-1.5 text-[#6B635B] hover:text-[#5B1D2E] hover:bg-[#FAF8F5] rounded-md transition-colors"
                            title="Edit Quotation"
                            aria-label={`Edit quotation from ${q.vendorName}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuotation(q.id)}
                            className="p-1.5 text-[#6B635B] hover:text-[#C05621] hover:bg-[#FFF5F5] rounded-md transition-colors"
                            title="Delete Quotation"
                            aria-label={`Delete quotation from ${q.vendorName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: SIDE-BY-SIDE QUOTATION COMPARISON & AI ADVISORY       */}
        {/* ============================================================ */}
        {activeTab === "compare" && (
          <div className="space-y-6">
            {/* Category Selector & Controls */}
            <Card className="p-5 bg-white border border-[#EBE5DC]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
                    Quotation Comparison Matrix
                  </h3>
                  <p className="text-xs text-[#6B635B]">
                    Select a category and tick at least 2 quotes to evaluate value-for-money, guest coverage, and hidden surcharges.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#6B635B]">Category:</span>
                    <select
                      value={comparisonCategory}
                      onChange={(e) => {
                        const newCat = e.target.value as VendorCategory;
                        setComparisonCategory(newCat);
                        const catQuotes = quotations.filter((q) => q.category === newCat);
                        setSelectedQuoteIds(catQuotes.map((q) => q.id));
                        if (event) {
                          setComparisonResult(getComparisonResult(event.id, newCat));
                        }
                      }}
                      className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EBE5DC] rounded-lg text-xs font-semibold text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                    >
                      {VENDOR_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat} ({quotations.filter((q) => q.category === cat).length} quotes)
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleRunComparison}
                    disabled={
                      isLoadingComparison ||
                      quotations.filter(
                        (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
                      ).length < 2
                    }
                    className="gap-2"
                  >
                    {isLoadingComparison ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing True Value...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#C8963E]" />
                        Run AI Value Comparison
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quotations selection checkboxes */}
              <div className="mt-4 pt-4 border-t border-[#EBE5DC]">
                <span className="text-xs font-semibold text-[#1F1A17] block mb-2">
                  Select Quotes to Compare in {comparisonCategory}:
                </span>
                <div className="flex flex-wrap gap-3">
                  {quotations
                    .filter((q) => q.category === comparisonCategory)
                    .map((q) => {
                      const isChecked = selectedQuoteIds.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "bg-[#FDF2F4] border-[#5B1D2E] text-[#5B1D2E] font-semibold"
                              : "bg-[#FAF8F5] border-[#EBE5DC] text-[#6B635B]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleQuoteSelection(q.id)}
                            className="rounded text-[#5B1D2E] focus:ring-[#5B1D2E]"
                          />
                          <span>
                            {q.vendorName} (₹{q.quotedAmount.toLocaleString("en-IN")})
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </Card>

            {/* Check if less than 2 quotes */}
            {quotations.filter((q) => q.category === comparisonCategory).length < 2 ? (
              <EmptyState
                title={`Need At Least 2 Quotes for ${comparisonCategory}`}
                description="Add another quotation in this category to run a side-by-side comparison matrix and AI value trade-off analysis."
                action={
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleOpenAddQuotation(undefined, comparisonCategory)}
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add Second Quote in {comparisonCategory}
                  </Button>
                }
              />
            ) : (
              <>
                {/* 1. Side-by-Side Comparison Matrix */}
                {/* Responsive Design Rule: Wide table on desktop, stacked comparative cards on mobile */}
                <div className="space-y-4">
                  <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#EBE5DC] bg-white shadow-sm">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#FAF8F5] border-b border-[#EBE5DC] text-xs uppercase tracking-wider text-[#6B635B]">
                          <th className="py-4 px-5 font-bold w-1/4">Evaluation Attribute</th>
                          {quotations
                            .filter(
                              (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
                            )
                            .map((q) => (
                              <th key={q.id} className="py-4 px-5 font-bold text-[#1F1A17]">
                                <div className="text-base font-serif">{q.vendorName}</div>
                                <div className="font-mono text-xs text-[#5B1D2E] font-bold">
                                  ₹{q.quotedAmount.toLocaleString("en-IN")}
                                </div>
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EBE5DC] text-xs">
                        {/* Guest Coverage */}
                        <tr>
                          <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40">
                            Guest Coverage
                          </td>
                          {quotations
                            .filter(
                              (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
                            )
                            .map((q) => {
                              const coversAll = q.guestCoverage >= event.guestCount;
                              return (
                                <td key={q.id} className="py-3.5 px-5">
                                  <div className="flex items-center gap-1.5 font-medium">
                                    {q.guestCoverage > 0 ? (
                                      <>
                                        <Users className="w-3.5 h-3.5 text-[#C8963E]" />
                                        <span>
                                          {q.guestCoverage} pax{" "}
                                          {coversAll ? (
                                            <span className="text-[#3F7A56] font-semibold">
                                              (Fully covers {event.guestCount})
                                            </span>
                                          ) : (
                                            <span className="text-[#C05621] font-semibold">
                                              (Deficit of {event.guestCount - q.guestCoverage})
                                            </span>
                                          )}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[#C05621]">Unspecified pax limit</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                        </tr>

                        {/* Per-Guest Effective Rate */}
                        <tr>
                          <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40">
                            Effective Rate / Guest
                          </td>
                          {quotations
                            .filter(
                              (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
                            )
                            .map((q) => {
                              const coverage = q.guestCoverage > 0 ? q.guestCoverage : event.guestCount;
                              const perGuest = Math.round(q.quotedAmount / coverage);
                              return (
                                <td key={q.id} className="py-3.5 px-5 font-mono font-medium text-[#1F1A17]">
                                  ~₹{perGuest.toLocaleString("en-IN")}/pax
                                </td>
                              );
                            })}
                        </tr>

                        {/* Included Deliverables */}
                        <tr>
                          <td className="py-4 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40 align-top">
                            Included Deliverables
                          </td>
                          {quotations
                            .filter(
                              (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
                            )
                            .map((q) => (
                              <td key={q.id} className="py-4 px-5 align-top">
                                <ul className="space-y-1.5">
                                  {q.includedServices.map((s, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-[#4A4540]">
                                      <Check className="w-3.5 h-3.5 text-[#3F7A56] mt-0.5 flex-shrink-0" />
                                      <span>{s}</span>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            ))}
                        </tr>

                        {/* Additional / Hidden Surcharges */}
                        <tr>
                          <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40 align-top">
                            Additional Surcharges
                          </td>
                          {quotations
                            .filter(
                              (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
                            )
                            .map((q) => (
                              <td key={q.id} className="py-3.5 px-5 align-top">
                                {q.additionalCharges.length > 0 ? (
                                  <ul className="space-y-1 text-[#C05621]">
                                    {q.additionalCharges.map((c, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span>{c}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-[#3F7A56] font-medium">
                                    No explicit extra surcharges stated
                                  </span>
                                )}
                              </td>
                            ))}
                        </tr>

                        {/* Missing Information */}
                        <tr>
                          <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40 align-top">
                            Missing Information
                          </td>
                          {quotations
                            .filter(
                              (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
                            )
                            .map((q) => (
                              <td key={q.id} className="py-3.5 px-5 align-top">
                                {q.missingInformation.length > 0 ? (
                                  <ul className="space-y-1 text-[#C8963E]">
                                    {q.missingInformation.map((m, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <ShieldAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span>{m}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-[#3F7A56] font-medium">Terms fully stated</span>
                                )}
                              </td>
                            ))}
                        </tr>

                        {/* Actions */}
                        <tr>
                          <td className="py-3.5 px-5 font-semibold text-[#1F1A17] bg-[#FAF8F5]/40">
                            Primary Selection
                          </td>
                          {quotations
                            .filter(
                              (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
                            )
                            .map((q) => (
                              <td key={q.id} className="py-3.5 px-5">
                                {q.isSelected ? (
                                  <span className="font-semibold text-[#3F7A56] flex items-center gap-1">
                                    <BadgeCheck className="w-4 h-4" /> Current Primary
                                  </span>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSelectPrimaryQuotation(q)}
                                    className="text-xs py-1 h-auto"
                                  >
                                    Select as Primary
                                  </Button>
                                )}
                              </td>
                            ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Cards Layout */}
                  <div className="md:hidden space-y-4">
                    {quotations
                      .filter(
                        (q) => q.category === comparisonCategory && selectedQuoteIds.includes(q.id)
                      )
                      .map((q) => {
                        const coverage = q.guestCoverage > 0 ? q.guestCoverage : event.guestCount;
                        const perGuest = Math.round(q.quotedAmount / coverage);
                        const coversAll = q.guestCoverage >= event.guestCount;

                        return (
                          <Card key={q.id} className="p-4 bg-white border border-[#EBE5DC] space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-serif font-bold text-base text-[#1F1A17]">
                                  {q.vendorName}
                                </h4>
                                <span className="font-mono text-sm font-bold text-[#5B1D2E]">
                                  ₹{q.quotedAmount.toLocaleString("en-IN")}
                                </span>
                              </div>
                              {q.isSelected && (
                                <Badge variant="success" className="bg-[#F0FFF4] text-[#3F7A56] border-[#C6F6D5]">
                                  Primary
                                </Badge>
                              )}
                            </div>

                            <div className="text-xs space-y-1.5 pt-2 border-t border-[#EBE5DC]">
                              <div className="flex justify-between">
                                <span className="text-[#6B635B]">Guest Coverage:</span>
                                <span className="font-medium">
                                  {q.guestCoverage} pax {coversAll ? "✓" : `(Deficit: ${event.guestCount - q.guestCoverage})`}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6B635B]">Effective Rate:</span>
                                <span className="font-mono font-medium">~₹{perGuest.toLocaleString("en-IN")}/pax</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[#EBE5DC]">
                              <span className="text-xs font-semibold text-[#1F1A17] block mb-1">
                                Deliverables ({q.includedServices.length}):
                              </span>
                              <ul className="text-xs space-y-1">
                                {q.includedServices.map((s, i) => (
                                  <li key={i} className="flex items-start gap-1 text-[#4A4540]">
                                    <Check className="w-3 h-3 text-[#3F7A56] mt-0.5" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {q.additionalCharges.length > 0 && (
                              <div className="p-2 bg-[#FFF5F5] rounded text-xs text-[#C05621] space-y-0.5">
                                <span className="font-semibold block">Extra Surcharges:</span>
                                {q.additionalCharges.map((c, i) => (
                                  <div key={i}>• {c}</div>
                                ))}
                              </div>
                            )}

                            {!q.isSelected && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectPrimaryQuotation(q)}
                                className="w-full text-xs mt-2"
                              >
                                Set as Primary
                              </Button>
                            )}
                          </Card>
                        );
                      })}
                  </div>
                </div>

                {/* 2. AI Comparison Advisory Report */}
                {comparisonResult && (
                  <div className="space-y-6 pt-4">
                    {/* Top Recommendation Banner */}
                    <Card className="p-6 bg-[#FAF8F5] border-2 border-[#C8963E]/40 rounded-2xl relative overflow-hidden">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#5B1D2E] text-white rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#C8963E]" />
                              AI Value Recommendation
                            </span>
                            <span className="text-xs text-[#6B635B]">
                              Analyzed {new Date(comparisonResult.analyzedAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                          <h4 className="font-serif text-2xl font-bold text-[#1F1A17]">
                            Recommended Choice: {comparisonResult.recommendation.vendorName}
                          </h4>
                          <p className="text-sm text-[#4A4540] max-w-3xl leading-relaxed">
                            {comparisonResult.recommendation.rationale}
                          </p>
                        </div>

                        <div className="lg:text-right p-4 bg-white rounded-xl border border-[#EBE5DC] flex-shrink-0">
                          <span className="text-xs font-semibold text-[#6B635B] uppercase tracking-wider block">
                            Value Assessment
                          </span>
                          <span className="text-sm font-bold text-[#5B1D2E] block mt-1">
                            {comparisonResult.recommendation.valueAssessment}
                          </span>
                        </div>
                      </div>
                    </Card>

                    {/* Summary & Differences */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-5 bg-white border border-[#EBE5DC] space-y-3">
                        <h5 className="font-serif text-base font-bold text-[#1F1A17] flex items-center gap-2">
                          <Scale className="w-4 h-4 text-[#5B1D2E]" />
                          Executive Comparison Summary
                        </h5>
                        <p className="text-xs text-[#4A4540] leading-relaxed">
                          {comparisonResult.comparisonSummary}
                        </p>
                      </Card>

                      <Card className="p-5 bg-white border border-[#EBE5DC] space-y-3">
                        <h5 className="font-serif text-base font-bold text-[#1F1A17] flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#C8963E]" />
                          Primary Quotation Differences
                        </h5>
                        <ul className="space-y-1.5 text-xs text-[#4A4540]">
                          {comparisonResult.quotationDifferences.map((d, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#5B1D2E] mt-1.5 flex-shrink-0" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>

                    {/* Pros & Cons Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {Object.keys(comparisonResult.advantages).map((vendorName) => {
                        const pros = comparisonResult.advantages[vendorName] || [];
                        const cons = comparisonResult.disadvantages[vendorName] || [];

                        return (
                          <Card key={vendorName} className="p-5 bg-white border border-[#EBE5DC] space-y-3">
                            <h5 className="font-serif text-base font-bold text-[#1F1A17] border-b border-[#EBE5DC] pb-2">
                              {vendorName}
                            </h5>

                            {/* Advantages */}
                            <div>
                              <span className="text-[11px] font-bold text-[#3F7A56] uppercase tracking-wider block mb-1">
                                Advantages:
                              </span>
                              <ul className="space-y-1 text-xs text-[#4A4540]">
                                {pros.map((p, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-[#3F7A56] mt-0.5 flex-shrink-0" />
                                    <span>{p}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Disadvantages */}
                            <div className="pt-2 border-t border-[#EBE5DC]/60">
                              <span className="text-[11px] font-bold text-[#C05621] uppercase tracking-wider block mb-1">
                                Trade-offs / Cautions:
                              </span>
                              <ul className="space-y-1 text-xs text-[#4A4540]">
                                {cons.map((c, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-[#C05621] mt-0.5 flex-shrink-0" />
                                    <span>{c}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Clarification Questions to Ask */}
                    {comparisonResult.questionsToAsk.length > 0 && (
                      <Card className="p-5 bg-[#FFF9F0] border border-[#F6E5C8] rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-serif text-base font-bold text-[#744210] flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-[#C8963E]" />
                            Critical Questions to Clarify Before Booking
                          </h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                comparisonResult.questionsToAsk.join("\n")
                              );
                              alert("Questions copied to clipboard!");
                            }}
                            className="text-xs text-[#744210]"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" /> Copy Questions
                          </Button>
                        </div>
                        <ul className="space-y-1.5 text-xs text-[#744210]">
                          {comparisonResult.questionsToAsk.map((q, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="font-bold text-[#C8963E]">{i + 1}.</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {/* Disclaimers & Assumptions */}
                    <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE5DC] text-[11px] text-[#6B635B] space-y-1">
                      <div className="font-semibold text-[#1F1A17] uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#C8963E]" />
                        Advisory Notice & Planning Rules
                      </div>
                      <p>
                        • SamarohSathi AI is a celebration planning coordination advisor, not a booking platform or commercial escrow.
                      </p>
                      <p>
                        • Quotations are user-entered estimates. Always inspect physical contracts and verify 18% GST and overtime rates prior to transferring monetary advances.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: VENDOR QUESTION PREPARATION                           */}
        {/* ============================================================ */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            <Card className="p-6 bg-white border border-[#EBE5DC] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1F1A17] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#C8963E]" />
                    AI Vendor Interview Preparation
                  </h3>
                  <p className="text-xs text-[#6B635B] mt-0.5">
                    Generate insightful, domain-specific questions to ask vendors before signing contracts or transferring advances.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategoryForQuestions}
                    onChange={(e) => {
                      const newCat = e.target.value as VendorCategory;
                      setSelectedCategoryForQuestions(newCat);
                      handlePrepareQuestions(newCat);
                    }}
                    className="px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl text-xs font-semibold text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                  >
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handlePrepareQuestions(selectedCategoryForQuestions)}
                    disabled={isLoadingQuestions}
                    className="gap-2"
                  >
                    {isLoadingQuestions ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#C8963E]" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Custom Requirements Input */}
              <div className="pt-3 border-t border-[#EBE5DC]">
                <label className="text-xs font-semibold text-[#1F1A17] block mb-1">
                  Specific Celebration Requirements or Preferences (Optional):
                </label>
                <div className="flex gap-2">
                  <Input
                    value={questionRequirements}
                    onChange={(e) => setQuestionRequirements(e.target.value)}
                    placeholder="e.g. Traditional floral mandap with marigolds, outside caterer allowed, wheelchair access..."
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handlePrepareQuestions(selectedCategoryForQuestions, questionRequirements)}
                    className="text-xs flex-shrink-0"
                  >
                    Apply Requirements
                  </Button>
                </div>
              </div>
            </Card>

            {/* Questions List */}
            {isLoadingQuestions ? (
              <div className="p-16 text-center text-sm text-[#6B635B] bg-white rounded-2xl border border-[#EBE5DC]">
                <span className="w-6 h-6 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin inline-block mr-2" />
                Preparing domain-specific questions for {selectedCategoryForQuestions}...
              </div>
            ) : preparedQuestions ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B635B] uppercase tracking-wider">
                    {preparedQuestions.questions.length} Questions for {preparedQuestions.category}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAllQuestions}
                    className="text-xs gap-1.5"
                  >
                    {copiedAllQuestions ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#3F7A56]" /> Copied All Questions!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#5B1D2E]" /> Copy All Questions
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {preparedQuestions.questions.map((q, idx) => (
                    <Card
                      key={idx}
                      className="p-5 bg-white border border-[#EBE5DC] flex flex-col justify-between hover:border-[#C8963E]/50 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8963E] px-2 py-0.5 bg-[#FFF9F0] border border-[#F6E5C8] rounded">
                            {q.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyQuestion(q.question, idx)}
                            className="text-[#6B635B] hover:text-[#5B1D2E] p-1 rounded"
                            title="Copy single question"
                          >
                            {copiedQuestionIdx === idx ? (
                              <Check className="w-3.5 h-3.5 text-[#3F7A56]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <h4 className="font-semibold text-sm text-[#1F1A17] leading-snug">
                          {q.question}
                        </h4>

                        <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#EBE5DC] text-xs text-[#6B635B]">
                          <strong className="text-[#1F1A17] block mb-0.5">Why Ask This:</strong>
                          <p className="leading-relaxed">{q.purpose}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Practical Tips */}
                {preparedQuestions.tips && preparedQuestions.tips.length > 0 && (
                  <Card className="p-5 bg-[#FAF8F5] border border-[#EBE5DC] rounded-2xl space-y-2">
                    <span className="font-semibold text-xs text-[#5B1D2E] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C8963E]" />
                      Negotiation & Coordination Tips
                    </span>
                    <ul className="space-y-1 text-xs text-[#4A4540]">
                      {preparedQuestions.tips.map((t, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C8963E] mt-1.5 flex-shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: ADD / EDIT VENDOR                                     */}
        {/* ============================================================ */}
        {isVendorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div
              ref={vendorModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="vendor-modal-title"
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#EBE5DC] space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
                <h3 id="vendor-modal-title" className="font-serif text-xl font-bold text-[#1F1A17]">
                  {editingVendor ? "Edit Vendor Details" : "Add Celebration Vendor"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  aria-label="Close vendor dialog"
                  className="text-[#6B635B] hover:text-[#1F1A17] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveVendor} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-[#1F1A17] block mb-1">
                    Vendor Business Name *
                  </label>
                  <Input
                    required
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    placeholder="e.g. Royal Shahi Rasoi Caterers"
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#1F1A17] block mb-1">Category *</label>
                    <select
                      value={vCategory}
                      onChange={(e) => setVCategory(e.target.value as VendorCategory)}
                      className="w-full px-3 py-2 bg-white border border-[#EBE5DC] rounded-xl text-xs text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                    >
                      {VENDOR_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-[#1F1A17] block mb-1">Status *</label>
                    <select
                      value={vStatus}
                      onChange={(e) => setVStatus(e.target.value as VendorStatus)}
                      className="w-full px-3 py-2 bg-white border border-[#EBE5DC] rounded-xl text-xs text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                    >
                      {VENDOR_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#1F1A17] block mb-1">
                      Contact Person
                    </label>
                    <Input
                      value={vContactPerson}
                      onChange={(e) => setVContactPerson(e.target.value)}
                      placeholder="e.g. Vikram Rathore"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#1F1A17] block mb-1">
                      Phone Number
                    </label>
                    <Input
                      value={vPhone}
                      onChange={(e) => setVPhone(e.target.value)}
                      placeholder="e.g. +91 98290 12345"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#1F1A17] block mb-1">Email Address</label>
                  <Input
                    type="email"
                    value={vEmail}
                    onChange={(e) => setVEmail(e.target.value)}
                    placeholder="e.g. contact@vendor.com"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1F1A17] block mb-1">Address / City</label>
                  <Input
                    value={vAddress}
                    onChange={(e) => setVAddress(e.target.value)}
                    placeholder="e.g. MI Road, Jaipur, Rajasthan"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1F1A17] block mb-1">
                    Your Requirements & Scope
                  </label>
                  <Textarea
                    value={vRequirements}
                    onChange={(e) => setVRequirements(e.target.value)}
                    placeholder="e.g. 220 pax pure vegetarian dinner with 4 live chaat counters..."
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1F1A17] block mb-1">Private Notes</label>
                  <Textarea
                    value={vNotes}
                    onChange={(e) => setVNotes(e.target.value)}
                    placeholder="e.g. Recommended by Sharma uncle. Tasting completed."
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EBE5DC]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVendorModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    {editingVendor ? "Update Vendor" : "Save Vendor"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: ADD / EDIT QUOTATION                                  */}
        {/* ============================================================ */}
        {isQuotationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div
              ref={quotationModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="quotation-modal-title"
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-[#EBE5DC] space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
                <h3 id="quotation-modal-title" className="font-serif text-xl font-bold text-[#1F1A17]">
                  {editingQuotation ? "Edit Quotation Details" : "Record Vendor Quotation"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsQuotationModalOpen(false)}
                  aria-label="Close quotation dialog"
                  className="text-[#6B635B] hover:text-[#1F1A17] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveQuotation} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#1F1A17] block mb-1">Vendor *</label>
                    <select
                      required
                      value={qVendorId}
                      onChange={(e) => {
                        const vid = e.target.value;
                        setQVendorId(vid);
                        const vObj = vendors.find((v) => v.id === vid);
                        if (vObj) setQCategory(vObj.category);
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#EBE5DC] rounded-xl text-xs text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-[#1F1A17] block mb-1">Category *</label>
                    <select
                      value={qCategory}
                      onChange={(e) => setQCategory(e.target.value as VendorCategory)}
                      className="w-full px-3 py-2 bg-white border border-[#EBE5DC] rounded-xl text-xs text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                    >
                      {VENDOR_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#1F1A17] block mb-1">
                      Quoted Total Amount (₹) *
                    </label>
                    <Input
                      type="number"
                      required
                      min={1}
                      value={qAmount}
                      onChange={(e) => setQAmount(e.target.value ? Number(e.target.value) : "")}
                      placeholder="e.g. 420000"
                      className="text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#1F1A17] block mb-1">
                      Guest Coverage (Pax)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={qCoverage}
                      onChange={(e) => setQCoverage(e.target.value ? Number(e.target.value) : "")}
                      placeholder={`e.g. ${event.guestCount}`}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#1F1A17] block mb-1">
                    Connect to Budget Category (Optional)
                  </label>
                  <select
                    value={qBudgetCatId}
                    onChange={(e) => setQBudgetCatId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE5DC] rounded-xl text-xs text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                  >
                    <option value="">-- None (Do not connect to budget) --</option>
                    {budgetCategories.map((bc) => (
                      <option key={bc.id} value={bc.id}>
                        {bc.name} (Estimated: ₹{bc.estimatedAmount.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#1F1A17] block mb-1">
                    Included Services / Deliverables (One per line) *
                  </label>
                  <Textarea
                    required
                    value={qServicesText}
                    onChange={(e) => setQServicesText(e.target.value)}
                    placeholder="4 Live interactive food stalls&#10;North & South Indian buffet&#10;Welcome royal mocktails&#10;Premium bone china crockery"
                    rows={4}
                    className="text-xs font-sans"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#C05621] block mb-1">
                    Additional Charges / Exclusions (One per line)
                  </label>
                  <Textarea
                    value={qAdditionalChargesText}
                    onChange={(e) => setQAdditionalChargesText(e.target.value)}
                    placeholder="18% GST extra on final invoice&#10;Packaged mineral water billed per crate on consumption&#10;Overtime ₹5,000/hr past 1:00 AM"
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#C8963E] block mb-1">
                    Missing Information to Clarify (One per line)
                  </label>
                  <Textarea
                    value={qMissingInfoText}
                    onChange={(e) => setQMissingInfoText(e.target.value)}
                    placeholder="Minimum guarantee plate policy not stated&#10;DG generator fuel inclusion unverified"
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1F1A17] block mb-1">Commercial Terms</label>
                  <Input
                    value={qTerms}
                    onChange={(e) => setQTerms(e.target.value)}
                    placeholder="e.g. 25% booking deposit, 50% on event day, 25% post-event."
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EBE5DC]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsQuotationModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    {editingQuotation ? "Update Quotation" : "Save Quotation"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
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
