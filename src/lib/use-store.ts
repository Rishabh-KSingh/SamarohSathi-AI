"use client";

import * as React from "react";
import { getOnboardingDraft } from "@/lib/storage";
import {
  EventData,
  OnboardingFormData,
  BudgetCategory,
  EventTask,
  AIEventPlan,
  PlanChangeRecord,
  Vendor,
  VendorQuotation,
  QuotationComparisonResult,
} from "@/types/event";

const EVENTS_STORAGE_KEY = "samaroh_sathi_events";
const ACTIVE_EVENT_ID_KEY = "samaroh_sathi_active_event_id";
const BUDGET_CATEGORIES_KEY = "samaroh_sathi_budget_categories";
const TASKS_KEY = "samaroh_sathi_tasks";
const AI_PLANS_KEY = "samaroh_sathi_ai_plans";
const CHANGE_HISTORY_KEY = "samaroh_sathi_change_history";
const VENDORS_STORAGE_KEY = "samaroh_sathi_vendors";
const QUOTATIONS_STORAGE_KEY = "samaroh_sathi_quotations";
const COMPARISONS_STORAGE_KEY = "samaroh_sathi_quotation_comparisons";

const EMPTY_ARRAY: never[] = [];
const emptyArrayFn = () => EMPTY_ARRAY;
const nullFn = () => null;
const trueFn = () => true;
const falseFn = () => false;
const emptySubscribe = () => () => {};

const subscribeStorage = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("samaroh_storage_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("samaroh_storage_change", callback);
  };
};

export function triggerStorageUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("samaroh_storage_change"));
  }
}

// --------------------------------------------------------
// Cached Snapshots for useSyncExternalStore
// React requires getSnapshot and getServerSnapshot to return
// the EXACT same reference if the data has not changed.
// --------------------------------------------------------

// Events Cache
let cachedRawEvents: string | null = null;
let cachedEventsList: EventData[] = EMPTY_ARRAY;

function getCachedAllEvents(): EventData[] {
  if (typeof window === "undefined") return EMPTY_ARRAY;
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (raw === cachedRawEvents) {
      return cachedEventsList;
    }
    cachedRawEvents = raw;
    if (!raw) {
      cachedEventsList = EMPTY_ARRAY;
    } else {
      const parsed = JSON.parse(raw);
      cachedEventsList = Array.isArray(parsed) ? parsed : EMPTY_ARRAY;
    }
    return cachedEventsList;
  } catch {
    return EMPTY_ARRAY;
  }
}

// Active Event Cache
let cachedRawActiveId: string | null = null;
let cachedLastEventsRef: EventData[] = EMPTY_ARRAY;
let cachedActiveEvent: EventData | null = null;

function getCachedActiveEvent(): EventData | null {
  if (typeof window === "undefined") return null;
  try {
    const activeId = localStorage.getItem(ACTIVE_EVENT_ID_KEY);
    const events = getCachedAllEvents();

    if (activeId === cachedRawActiveId && events === cachedLastEventsRef) {
      return cachedActiveEvent;
    }

    cachedRawActiveId = activeId;
    cachedLastEventsRef = events;

    if (activeId) {
      const found = events.find((e) => e.id === activeId);
      cachedActiveEvent = found || (events.length > 0 ? events[0] : null);
    } else {
      cachedActiveEvent = events.length > 0 ? events[0] : null;
    }

    return cachedActiveEvent;
  } catch {
    return null;
  }
}

// Categories Cache
let cachedRawCategories: string | null = null;
let cachedCategoriesByEvent: Record<string, BudgetCategory[]> = {};

function getCachedCategories(eventId?: string): BudgetCategory[] {
  if (typeof window === "undefined" || !eventId) return EMPTY_ARRAY;
  try {
    const raw = localStorage.getItem(BUDGET_CATEGORIES_KEY);
    if (raw !== cachedRawCategories) {
      cachedRawCategories = raw;
      const all: BudgetCategory[] = raw ? JSON.parse(raw) : [];
      const grouped: Record<string, BudgetCategory[]> = {};
      all.forEach((cat) => {
        if (!grouped[cat.eventId]) grouped[cat.eventId] = [];
        grouped[cat.eventId].push(cat);
      });
      cachedCategoriesByEvent = grouped;
    }
    return cachedCategoriesByEvent[eventId] || EMPTY_ARRAY;
  } catch {
    return EMPTY_ARRAY;
  }
}

// Tasks Cache
let cachedRawTasks: string | null = null;
let cachedTasksByEvent: Record<string, EventTask[]> = {};

function getCachedTasks(eventId?: string): EventTask[] {
  if (typeof window === "undefined" || !eventId) return EMPTY_ARRAY;
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (raw !== cachedRawTasks) {
      cachedRawTasks = raw;
      const all: EventTask[] = raw ? JSON.parse(raw) : [];
      const grouped: Record<string, EventTask[]> = {};
      all.forEach((task) => {
        if (!grouped[task.eventId]) grouped[task.eventId] = [];
        grouped[task.eventId].push(task);
      });
      cachedTasksByEvent = grouped;
    }
    return cachedTasksByEvent[eventId] || EMPTY_ARRAY;
  } catch {
    return EMPTY_ARRAY;
  }
}

// Plans Cache
let cachedRawPlans: string | null = null;
let cachedPlansByEvent: Record<string, AIEventPlan> = {};

function getCachedPlan(eventId?: string): AIEventPlan | null {
  if (typeof window === "undefined" || !eventId) return null;
  try {
    const raw = localStorage.getItem(AI_PLANS_KEY);
    if (raw !== cachedRawPlans) {
      cachedRawPlans = raw;
      cachedPlansByEvent = raw ? JSON.parse(raw) : {};
    }
    return cachedPlansByEvent[eventId] || null;
  } catch {
    return null;
  }
}

// Change History Cache
let cachedRawChanges: string | null = null;
let cachedChangesByEvent: Record<string, PlanChangeRecord[]> = {};

function getCachedChangeHistory(eventId?: string): PlanChangeRecord[] {
  if (typeof window === "undefined" || !eventId) return EMPTY_ARRAY;
  try {
    const raw = localStorage.getItem(CHANGE_HISTORY_KEY);
    if (raw !== cachedRawChanges) {
      cachedRawChanges = raw;
      const all: PlanChangeRecord[] = raw ? JSON.parse(raw) : [];
      const grouped: Record<string, PlanChangeRecord[]> = {};
      all.forEach((rec) => {
        if (!grouped[rec.eventId]) grouped[rec.eventId] = [];
        grouped[rec.eventId].push(rec);
      });
      cachedChangesByEvent = grouped;
    }
    return cachedChangesByEvent[eventId] || EMPTY_ARRAY;
  } catch {
    return EMPTY_ARRAY;
  }
}

// Vendors Cache
let cachedRawVendors: string | null = null;
let cachedVendorsByEvent: Record<string, Vendor[]> = {};

function getCachedVendors(eventId?: string): Vendor[] {
  if (typeof window === "undefined" || !eventId) return EMPTY_ARRAY;
  try {
    const raw = localStorage.getItem(VENDORS_STORAGE_KEY);
    if (raw !== cachedRawVendors) {
      cachedRawVendors = raw;
      const all: Vendor[] = raw ? JSON.parse(raw) : [];
      const grouped: Record<string, Vendor[]> = {};
      all.forEach((v) => {
        if (!grouped[v.eventId]) grouped[v.eventId] = [];
        grouped[v.eventId].push(v);
      });
      cachedVendorsByEvent = grouped;
    }
    return cachedVendorsByEvent[eventId] || EMPTY_ARRAY;
  } catch {
    return EMPTY_ARRAY;
  }
}

// Quotations Cache
let cachedRawQuotations: string | null = null;
let cachedQuotationsByEvent: Record<string, VendorQuotation[]> = {};

function getCachedQuotations(eventId?: string): VendorQuotation[] {
  if (typeof window === "undefined" || !eventId) return EMPTY_ARRAY;
  try {
    const raw = localStorage.getItem(QUOTATIONS_STORAGE_KEY);
    if (raw !== cachedRawQuotations) {
      cachedRawQuotations = raw;
      const all: VendorQuotation[] = raw ? JSON.parse(raw) : [];
      const grouped: Record<string, VendorQuotation[]> = {};
      all.forEach((q) => {
        if (!grouped[q.eventId]) grouped[q.eventId] = [];
        grouped[q.eventId].push(q);
      });
      cachedQuotationsByEvent = grouped;
    }
    return cachedQuotationsByEvent[eventId] || EMPTY_ARRAY;
  } catch {
    return EMPTY_ARRAY;
  }
}

// Quotation Comparison Cache
let cachedRawComparisons: string | null = null;
let cachedComparisons: Record<string, QuotationComparisonResult> = {};

function getCachedComparison(eventId?: string, category?: string): QuotationComparisonResult | null {
  if (typeof window === "undefined" || !eventId || !category) return null;
  try {
    const raw = localStorage.getItem(COMPARISONS_STORAGE_KEY);
    if (raw !== cachedRawComparisons) {
      cachedRawComparisons = raw;
      cachedComparisons = raw ? JSON.parse(raw) : {};
    }
    return cachedComparisons[`${eventId}_${category}`] || null;
  } catch {
    return null;
  }
}

// --------------------------------------------------------
// Exported React Hooks
// --------------------------------------------------------

export function useIsClient(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    trueFn,
    falseFn
  );
}

export function useActiveEvent(): EventData | null {
  return React.useSyncExternalStore(
    subscribeStorage,
    getCachedActiveEvent,
    nullFn
  );
}

export function useAllEvents(): EventData[] {
  return React.useSyncExternalStore(
    subscribeStorage,
    getCachedAllEvents,
    emptyArrayFn
  );
}

export function useInitialDraft(): Partial<OnboardingFormData> | null {
  const isClient = useIsClient();
  return React.useMemo(() => {
    if (!isClient) return null;
    return getOnboardingDraft();
  }, [isClient]);
}

export function useCategories(eventId?: string): BudgetCategory[] {
  const getSnapshot = React.useCallback(
    () => getCachedCategories(eventId),
    [eventId]
  );
  return React.useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    emptyArrayFn
  );
}

export function useTasks(eventId?: string): EventTask[] {
  const getSnapshot = React.useCallback(
    () => getCachedTasks(eventId),
    [eventId]
  );
  return React.useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    emptyArrayFn
  );
}

export function useAIPlan(eventId?: string): AIEventPlan | null {
  const getSnapshot = React.useCallback(
    () => getCachedPlan(eventId),
    [eventId]
  );
  return React.useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    nullFn
  );
}

export function useChangeHistory(eventId?: string): PlanChangeRecord[] {
  const getSnapshot = React.useCallback(
    () => getCachedChangeHistory(eventId),
    [eventId]
  );
  return React.useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    emptyArrayFn
  );
}

export function useVendors(eventId?: string): Vendor[] {
  const getSnapshot = React.useCallback(
    () => getCachedVendors(eventId),
    [eventId]
  );
  return React.useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    emptyArrayFn
  );
}

export function useQuotations(eventId?: string): VendorQuotation[] {
  const getSnapshot = React.useCallback(
    () => getCachedQuotations(eventId),
    [eventId]
  );
  return React.useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    emptyArrayFn
  );
}

export function useQuotationComparison(
  eventId?: string,
  category?: string
): QuotationComparisonResult | null {
  const getSnapshot = React.useCallback(
    () => getCachedComparison(eventId, category),
    [eventId, category]
  );
  return React.useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    nullFn
  );
}
