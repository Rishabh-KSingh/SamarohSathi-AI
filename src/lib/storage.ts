import {
  EventData,
  OnboardingFormData,
  BudgetCategory,
  EventTask,
  AIEventPlan,
  PlanRevisionProposal,
  PlanChangeRecord,
  Vendor,
  VendorCategory,
  VendorQuotation,
  QuotationComparisonResult,
} from "@/types/event";
import { generateDeterministicBudgetCategories, generateDeterministicTasks } from "@/lib/planner-engine";
import {
  SAMPLE_EVENT_ID,
  getSampleEventDefinition,
  getSampleCategories,
  getSampleTasks,
  getSampleAIPlan,
  getInitialSeedVendorsDefinitions,
} from "@/lib/sample-data";

const ONBOARDING_DRAFT_KEY = "samaroh_sathi_onboarding_draft";
const EVENTS_STORAGE_KEY = "samaroh_sathi_events";
const ACTIVE_EVENT_ID_KEY = "samaroh_sathi_active_event_id";
const BUDGET_CATEGORIES_KEY = "samaroh_sathi_budget_categories";
const TASKS_KEY = "samaroh_sathi_tasks";
const AI_PLANS_KEY = "samaroh_sathi_ai_plans";
const CHANGE_HISTORY_KEY = "samaroh_sathi_change_history";
const VENDORS_STORAGE_KEY = "samaroh_sathi_vendors";
const QUOTATIONS_STORAGE_KEY = "samaroh_sathi_quotations";
const COMPARISONS_STORAGE_KEY = "samaroh_sathi_quotation_comparisons";
const VENDORS_INITIALIZED_KEY = "samaroh_sathi_vendors_initialized";

function isClient(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function notifyChange(): void {
  if (isClient()) {
    window.dispatchEvent(new Event("samaroh_storage_change"));
  }
}

export function saveOnboardingDraft(draft: Partial<OnboardingFormData>): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
    notifyChange();
  } catch (error) {
    console.error("Failed to save onboarding draft to localStorage:", error);
  }
}

export function getOnboardingDraft(): Partial<OnboardingFormData> | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<OnboardingFormData>) : null;
  } catch (error) {
    console.error("Failed to parse onboarding draft from localStorage:", error);
    return null;
  }
}

export function clearOnboardingDraft(): void {
  if (!isClient()) return;
  try {
    localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    notifyChange();
  } catch (error) {
    console.error("Failed to clear onboarding draft:", error);
  }
}

export function getAllEvents(): EventData[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load events from localStorage:", error);
    return [];
  }
}

export function getEventById(id: string): EventData | null {
  const events = getAllEvents();
  return events.find((e) => e.id === id) || null;
}

export function getActiveEvent(): EventData | null {
  if (!isClient()) return null;
  try {
    const activeId = localStorage.getItem(ACTIVE_EVENT_ID_KEY);
    const events = getAllEvents();
    if (activeId) {
      const matched = events.find((e) => e.id === activeId);
      if (matched) return matched;
    }
    return events.length > 0 ? events[0] : null;
  } catch (error) {
    console.error("Failed to get active event:", error);
    return null;
  }
}

export function setActiveEventId(id: string): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(ACTIVE_EVENT_ID_KEY, id);
    notifyChange();
  } catch (error) {
    console.error("Failed to set active event id:", error);
  }
}

export function createEvent(
  input: Omit<EventData, "id" | "createdAt" | "updatedAt">
): EventData {
  if (!isClient()) {
    throw new Error("Cannot create event on the server.");
  }

  const events = getAllEvents();

  const now = new Date().toISOString();
  const duplicate = events.find(
    (e) =>
      e.name.trim().toLowerCase() === input.name.trim().toLowerCase() &&
      e.eventDate === input.eventDate &&
      e.location.trim().toLowerCase() === input.location.trim().toLowerCase()
  );

  if (duplicate) {
    setActiveEventId(duplicate.id);
    return duplicate;
  }

  const newEvent: EventData = {
    ...input,
    id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  const updatedList = [newEvent, ...events];
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updatedList));
    localStorage.setItem(ACTIVE_EVENT_ID_KEY, newEvent.id);
    clearOnboardingDraft();
    notifyChange();
  } catch (error) {
    console.error("Failed to persist event to localStorage:", error);
  }

  return newEvent;
}

export function updateEvent(
  id: string,
  updates: Partial<Omit<EventData, "id" | "createdAt">>
): EventData | null {
  if (!isClient()) return null;
  const events = getAllEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const updated: EventData = {
    ...events[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  events[index] = updated;
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    notifyChange();
  } catch (error) {
    console.error("Failed to update event in localStorage:", error);
  }
  return updated;
}

export function deleteEvent(id: string): boolean {
  if (!isClient()) return false;
  const events = getAllEvents();
  const filtered = events.filter((e) => e.id !== id);
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(filtered));
    const activeId = localStorage.getItem(ACTIVE_EVENT_ID_KEY);
    if (activeId === id) {
      if (filtered.length > 0) {
        localStorage.setItem(ACTIVE_EVENT_ID_KEY, filtered[0].id);
      } else {
        localStorage.removeItem(ACTIVE_EVENT_ID_KEY);
      }
    }

    // Clean up related categories, tasks, and plan
    const allCats = getAllStoredCategories().filter((c) => c.eventId !== id);
    localStorage.setItem(BUDGET_CATEGORIES_KEY, JSON.stringify(allCats));

    const allTasks = getAllStoredTasks().filter((t) => t.eventId !== id);
    localStorage.setItem(TASKS_KEY, JSON.stringify(allTasks));

    const allPlans = getAllStoredPlans();
    delete allPlans[id];
    localStorage.setItem(AI_PLANS_KEY, JSON.stringify(allPlans));

    const allChanges = getAllStoredChangeRecords().filter((c) => c.eventId !== id);
    localStorage.setItem(CHANGE_HISTORY_KEY, JSON.stringify(allChanges));

    // Clean up Phase 5 vendors, quotations, and comparisons
    const allVendors = getAllVendors().filter((v) => v.eventId !== id);
    localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(allVendors));

    const allQuotations = getAllQuotations().filter((q) => q.eventId !== id);
    localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(allQuotations));

    localStorage.removeItem(`${VENDORS_INITIALIZED_KEY}_${id}`);

    try {
      const allCompRaw = localStorage.getItem(COMPARISONS_STORAGE_KEY);
      if (allCompRaw) {
        const parsed = JSON.parse(allCompRaw);
        const filteredComp: Record<string, unknown> = {};
        Object.keys(parsed).forEach((k) => {
          if (!k.startsWith(`${id}_`)) {
            filteredComp[k] = parsed[k];
          }
        });
        localStorage.setItem(COMPARISONS_STORAGE_KEY, JSON.stringify(filteredComp));
      }
    } catch {}

    notifyChange();
    return true;
  } catch (error) {
    console.error("Failed to delete event:", error);
    return false;
  }
}

export function createSampleEvent(): EventData {
  const existing = getEventById(SAMPLE_EVENT_ID);
  if (existing) {
    setActiveEventId(existing.id);
    return existing;
  }

  const sample = getSampleEventDefinition();

  // Save the event directly to preserve stable ID
  const allEvents = getAllEvents().filter((e) => e.id !== SAMPLE_EVENT_ID);
  allEvents.unshift(sample);
  if (isClient()) {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(allEvents));
      setActiveEventId(sample.id);
      notifyChange();
    } catch (e) {
      console.error("Failed to store sample event:", e);
    }
  }

  // Realistic budget categories totaling exactly ₹15,00,000
  const categories = getSampleCategories(sample.id);
  saveCategoriesForEvent(sample.id, categories);

  // Realistic tasks with valid sequential dependencies
  const tasks = getSampleTasks(sample.id, sample.createdAt, sample.updatedAt);
  saveTasksForEvent(sample.id, tasks);

  // Initialize sample AI plan
  const samplePlan = getSampleAIPlan(sample, categories, tasks);
  saveAIPlanForEvent(sample.id, samplePlan);

  // Seed 12 realistic Patna vendors and quotations
  seedInitialVendorsForEvent(sample.id);

  return sample;
}

// ==========================================
// Budget Categories Storage
// ==========================================

export function getAllStoredCategories(): BudgetCategory[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(BUDGET_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load budget categories from localStorage:", error);
    return [];
  }
}

export function getCategoriesForEvent(eventId: string): BudgetCategory[] {
  const all = getAllStoredCategories();
  const filtered = all.filter((c) => c.eventId === eventId);
  if (filtered.length > 0) return filtered;

  // If no categories exist yet for this event, generate initial defaults
  const event = getEventById(eventId);
  if (event) {
    const initial = generateDeterministicBudgetCategories(event);
    saveCategoriesForEvent(eventId, initial);
    return initial;
  }
  return [];
}

export function saveCategoriesForEvent(eventId: string, categories: BudgetCategory[]): void {
  if (!isClient()) return;
  try {
    const all = getAllStoredCategories();
    const other = all.filter((c) => c.eventId !== eventId);
    const combined = [...other, ...categories];
    localStorage.setItem(BUDGET_CATEGORIES_KEY, JSON.stringify(combined));
    notifyChange();
  } catch (error) {
    console.error("Failed to save categories to localStorage:", error);
  }
}

export function addCategory(
  eventId: string,
  input: Omit<BudgetCategory, "id" | "eventId">
): BudgetCategory {
  const all = getAllStoredCategories();
  const newCat: BudgetCategory = {
    ...input,
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    eventId,
  };
  try {
    localStorage.setItem(BUDGET_CATEGORIES_KEY, JSON.stringify([...all, newCat]));
    notifyChange();
  } catch (error) {
    console.error("Failed to add category:", error);
  }
  return newCat;
}

export function updateCategory(
  id: string,
  updates: Partial<BudgetCategory>
): BudgetCategory | null {
  if (!isClient()) return null;
  const all = getAllStoredCategories();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const updated: BudgetCategory = {
    ...all[idx],
    ...updates,
  };
  all[idx] = updated;

  try {
    localStorage.setItem(BUDGET_CATEGORIES_KEY, JSON.stringify(all));
    notifyChange();
  } catch (error) {
    console.error("Failed to update category:", error);
  }
  return updated;
}

export function deleteCategory(id: string): boolean {
  if (!isClient()) return false;
  const all = getAllStoredCategories();
  const filtered = all.filter((c) => c.id !== id);
  try {
    localStorage.setItem(BUDGET_CATEGORIES_KEY, JSON.stringify(filtered));
    notifyChange();
    return true;
  } catch (error) {
    console.error("Failed to delete category:", error);
    return false;
  }
}

// ==========================================
// Tasks Storage & Management
// ==========================================

export function getAllStoredTasks(): EventTask[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load tasks from localStorage:", error);
    return [];
  }
}

export function getTasksForEvent(eventId: string): EventTask[] {
  const all = getAllStoredTasks();
  const filtered = all.filter((t) => t.eventId === eventId);
  if (filtered.length > 0) return filtered;

  // If no tasks exist yet, generate initial defaults
  const event = getEventById(eventId);
  if (event) {
    const initial = generateDeterministicTasks(event);
    saveTasksForEvent(eventId, initial);
    return initial;
  }
  return [];
}

export function saveTasksForEvent(eventId: string, tasks: EventTask[]): void {
  if (!isClient()) return;
  try {
    const all = getAllStoredTasks();
    const other = all.filter((t) => t.eventId !== eventId);
    const combined = [...other, ...tasks];
    localStorage.setItem(TASKS_KEY, JSON.stringify(combined));
    notifyChange();
  } catch (error) {
    console.error("Failed to save tasks to localStorage:", error);
  }
}

export function addTask(
  eventId: string,
  input: Omit<EventTask, "id" | "eventId" | "createdAt" | "updatedAt">
): EventTask {
  const all = getAllStoredTasks();
  const now = new Date().toISOString();
  const newTask: EventTask = {
    ...input,
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    eventId,
    createdAt: now,
    updatedAt: now,
  };
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify([...all, newTask]));
    notifyChange();
  } catch (error) {
    console.error("Failed to add task:", error);
  }
  return newTask;
}

export function updateTask(
  id: string,
  updates: Partial<EventTask>
): EventTask | null {
  if (!isClient()) return null;
  const all = getAllStoredTasks();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const updated: EventTask = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;

  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(all));
    notifyChange();
  } catch (error) {
    console.error("Failed to update task:", error);
  }
  return updated;
}

export function deleteTask(id: string): boolean {
  if (!isClient()) return false;
  const all = getAllStoredTasks();
  // Also remove this task ID from other tasks' dependencyIds
  const cleaned = all
    .filter((t) => t.id !== id)
    .map((t) => ({
      ...t,
      dependencyIds: t.dependencyIds.filter((depId) => depId !== id),
    }));

  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(cleaned));
    notifyChange();
    return true;
  } catch (error) {
    console.error("Failed to delete task:", error);
    return false;
  }
}

export function toggleTaskStatus(taskId: string): EventTask | null {
  if (!isClient()) return null;
  const all = getAllStoredTasks();
  const task = all.find((t) => t.id === taskId);
  if (!task) return null;

  const nextStatus = task.status === "Completed" ? "In Progress" : "Completed";
  return updateTask(taskId, { status: nextStatus });
}

// ==========================================
// AI Plans Storage
// ==========================================

export function getAllStoredPlans(): Record<string, AIEventPlan> {
  if (!isClient()) return {};
  try {
    const raw = localStorage.getItem(AI_PLANS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Failed to load AI plans from localStorage:", error);
    return {};
  }
}

export function getAIPlanForEvent(eventId: string): AIEventPlan | null {
  const all = getAllStoredPlans();
  return all[eventId] || null;
}

export function saveAIPlanForEvent(eventId: string, plan: AIEventPlan): void {
  if (!isClient()) return;
  try {
    const all = getAllStoredPlans();
    all[eventId] = plan;
    localStorage.setItem(AI_PLANS_KEY, JSON.stringify(all));
    notifyChange();
  } catch (error) {
    console.error("Failed to save AI plan:", error);
  }
}

// ==========================================
// Phase 4: Change History & Revision Application
// ==========================================

export function getAllStoredChangeRecords(): PlanChangeRecord[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(CHANGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load change history:", error);
    return [];
  }
}

export function getChangeHistoryForEvent(eventId: string): PlanChangeRecord[] {
  const all = getAllStoredChangeRecords();
  return all
    .filter((c) => c.eventId === eventId && c.status === "accepted")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveChangeRecord(record: PlanChangeRecord): void {
  if (!isClient()) return;
  try {
    const all = getAllStoredChangeRecords();
    localStorage.setItem(CHANGE_HISTORY_KEY, JSON.stringify([record, ...all]));
    notifyChange();
  } catch (error) {
    console.error("Failed to save change record:", error);
  }
}

/**
 * Applies an accepted PlanRevisionProposal to the saved event, categories, and tasks.
 * ONLY called upon explicit user approval.
 */
export function applyPlanRevision(
  proposal: PlanRevisionProposal
): { event: EventData | null; updatedCategories: number; updatedTasks: number } {
  if (!isClient()) {
    throw new Error("Cannot apply revision on the server.");
  }

  const currentEvent = getEventById(proposal.eventId);
  if (!currentEvent) {
    throw new Error(`Event with id ${proposal.eventId} not found.`);
  }

  // 1. Apply Event Level Changes
  let updatedEvent: EventData = { ...currentEvent };
  if (proposal.eventChanges) {
    const eventUpdates: Partial<EventData> = {};
    if (proposal.eventChanges.guestCount) {
      eventUpdates.guestCount = proposal.eventChanges.guestCount.proposed;
    }
    if (proposal.eventChanges.totalBudget) {
      eventUpdates.totalBudget = proposal.eventChanges.totalBudget.proposed;
    }
    if (proposal.eventChanges.eventDate) {
      eventUpdates.eventDate = proposal.eventChanges.eventDate.proposed;
    }
    if (proposal.eventChanges.location) {
      eventUpdates.location = proposal.eventChanges.location.proposed;
    }
    if (proposal.eventChanges.priorities) {
      eventUpdates.priorities = proposal.eventChanges.priorities.proposed;
    }

    const res = updateEvent(currentEvent.id, eventUpdates);
    if (res) updatedEvent = res;
  }

  // 2. Apply Budget Category Adjustments
  let updatedCategoriesCount = 0;
  const currentCategories = getCategoriesForEvent(currentEvent.id);

  proposal.categoryDiffs.forEach((diff) => {
    const matched = currentCategories.find(
      (c) => c.name.toLowerCase() === diff.categoryName.toLowerCase()
    );
    if (matched) {
      updateCategory(matched.id, {
        estimatedAmount: diff.proposedEstimated,
        notes: `${matched.notes ? matched.notes + " • " : ""}[Revised] ${diff.reasoning}`,
      });
      updatedCategoriesCount++;
    } else {
      // Add as new category if didn't exist
      addCategory(currentEvent.id, {
        name: diff.categoryName,
        estimatedAmount: diff.proposedEstimated,
        actualAmount: 0,
        priority: "Medium",
        notes: `[Added via revision] ${diff.reasoning}`,
      });
      updatedCategoriesCount++;
    }
  });

  // 3. Apply Task & Timeline Adjustments
  let updatedTasksCount = 0;
  const currentTasks = getTasksForEvent(currentEvent.id);

  proposal.taskDiffs.forEach((tDiff) => {
    const existing = currentTasks.find(
      (t) => (tDiff.taskId && t.id === tDiff.taskId) || t.title.toLowerCase() === tDiff.title.toLowerCase()
    );

    if (existing) {
      updateTask(existing.id, {
        dueDate: tDiff.proposedDueDate,
        description: `${existing.description ? existing.description + " • " : ""}[Rescheduled] ${tDiff.reasoning}`,
      });
      updatedTasksCount++;
    } else {
      addTask(currentEvent.id, {
        title: tDiff.title,
        description: tDiff.reasoning,
        dueDate: tDiff.proposedDueDate,
        priority: tDiff.priority || "Medium",
        status: "Not Started",
        dependencyIds: [],
      });
      updatedTasksCount++;
    }
  });

  // 4. Save to Change History (Accepted Revision Record)
  let previousValSummary = "Plan baseline";
  let newValSummary = "Applied revision";

  if (proposal.eventChanges?.guestCount) {
    previousValSummary = `${proposal.eventChanges.guestCount.previous} guests`;
    newValSummary = `${proposal.eventChanges.guestCount.proposed} guests`;
  } else if (proposal.eventChanges?.totalBudget) {
    previousValSummary = `₹${proposal.eventChanges.totalBudget.previous.toLocaleString("en-IN")}`;
    newValSummary = `₹${proposal.eventChanges.totalBudget.proposed.toLocaleString("en-IN")}`;
  } else if (proposal.eventChanges?.eventDate) {
    previousValSummary = proposal.eventChanges.eventDate.previous;
    newValSummary = proposal.eventChanges.eventDate.proposed;
  } else if (proposal.eventChanges?.priorities) {
    previousValSummary = proposal.eventChanges.priorities.previous.join(", ");
    newValSummary = proposal.eventChanges.priorities.proposed.join(", ");
  }

  const record: PlanChangeRecord = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    eventId: currentEvent.id,
    changeType: proposal.changeType,
    requestedChange: proposal.requestedChange,
    previousValue: previousValSummary,
    newValue: newValSummary,
    explanation: proposal.explanation,
    affectedCategories: proposal.categoryDiffs.map((d) => d.categoryName),
    affectedTasks: proposal.taskDiffs.map((t) => t.title),
    budgetDelta: proposal.budgetImpact.difference,
    status: "accepted",
    createdAt: new Date().toISOString(),
  };

  saveChangeRecord(record);
  notifyChange();

  return {
    event: updatedEvent,
    updatedCategories: updatedCategoriesCount,
    updatedTasks: updatedTasksCount,
  };
}

// ==========================================
// Phase 5: Vendor & Quotation Storage Methods
// ==========================================

export function getAllVendors(): Vendor[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(VENDORS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load vendors:", error);
    return [];
  }
}

export function getVendorsForEvent(eventId: string): Vendor[] {
  const current = getAllVendors().filter((v) => v.eventId === eventId);
  if (current.length === 0 && isClient()) {
    const initKey = `${VENDORS_INITIALIZED_KEY}_${eventId}`;
    if (!localStorage.getItem(initKey)) {
      return seedInitialVendorsForEvent(eventId);
    }
  }
  return current;
}

export function seedInitialVendorsForEvent(eventId: string): Vendor[] {
  if (!isClient()) return [];
  const initKey = `${VENDORS_INITIALIZED_KEY}_${eventId}`;
  if (localStorage.getItem(initKey)) {
    return getAllVendors().filter((v) => v.eventId === eventId);
  }

  // Mark initialized to prevent re-entry or unwanted re-insertion if user deletes vendors
  localStorage.setItem(initKey, "true");

  const existing = getAllVendors().filter((v) => v.eventId === eventId);
  if (existing.length > 0) {
    return existing;
  }

  const categories = getCategoriesForEvent(eventId);
  const cateringCat = categories.find(
    (c) => c.name.toLowerCase().includes("catering") || c.name.toLowerCase().includes("food")
  );
  const venueCat = categories.find((c) => c.name.toLowerCase().includes("venue"));
  const photoCat = categories.find((c) => c.name.toLowerCase().includes("photo"));
  const decorCat = categories.find((c) => c.name.toLowerCase().includes("decor"));
  const entCat = categories.find((c) => c.name.toLowerCase().includes("entertainment") || c.name.toLowerCase().includes("music"));
  const transCat = categories.find((c) => c.name.toLowerCase().includes("transport"));
  const makeupCat = categories.find((c) => c.name.toLowerCase().includes("makeup"));
  const lightCat = categories.find((c) => c.name.toLowerCase().includes("light"));

  // 12 Detailed Fictional Indian Wedding Vendors across all 8 categories (Patna, Bihar)
  const initialVendors = getInitialSeedVendorsDefinitions();

  const createdVendors: Vendor[] = [];
  initialVendors.forEach((v) => {
    createdVendors.push(addVendor(eventId, v));
  });

  // Seed illustrative quotations for immediate side-by-side comparison
  const vMaurya = createdVendors.find((v) => v.name.includes("Maurya"));
  const vPatliputra = createdVendors.find((v) => v.name.includes("Patliputra Heritage"));
  const vMithila = createdVendors.find((v) => v.name.includes("Mithila Shahi"));
  const vAnnapurna = createdVendors.find((v) => v.name.includes("Annapurna Swad"));
  const vMagadh = createdVendors.find((v) => v.name.includes("Magadh Candid"));
  const vDrishti = createdVendors.find((v) => v.name.includes("Drishti Studio"));
  const vPushpanjali = createdVendors.find((v) => v.name.includes("Pushpanjali"));
  const vShringar = createdVendors.find((v) => v.name.includes("Shringar"));
  const vSwaranjali = createdVendors.find((v) => v.name.includes("Swaranjali"));
  const vCarFleet = createdVendors.find((v) => v.name.includes("Pataliputra Royal Car"));
  const vAuraMakeup = createdVendors.find((v) => v.name.includes("Aura Bridal"));
  const vLaxmiLighting = createdVendors.find((v) => v.name.includes("Laxmi Sound"));

  // 1. Catering Quotations (Mithila vs Annapurna)
  if (vMithila) {
    addQuotation({
      vendorId: vMithila.id,
      vendorName: vMithila.name,
      eventId,
      category: "Caterer",
      budgetCategoryId: cateringCat?.id,
      quotedAmount: 475000,
      guestCoverage: 250,
      includedServices: [
        "4 Live interactive food stalls (Banarasi Chaat, Wood-fired Dosa, Jalebi-Rabdi, Mocktails)",
        "Multi-course North & Bihari-Maithil vegetarian dinner buffet with 5 desserts",
        "Welcome royal mocktails & continuous mineral water dispensers",
        "Premium bone china crockery, linen, and 1:25 server staffing ratio",
        "Hygienic leftover packaging protocol for host family",
      ],
      additionalCharges: [],
      terms: "25% advance on booking, 50% on event day, 25% post-dinner. 18% GST all-inclusive.",
      missingInformation: [],
      notes: "All-inclusive quote; covers full 250 guest count with zero beverage surcharges.",
      isSelected: true,
    });
  }

  if (vAnnapurna) {
    addQuotation({
      vendorId: vAnnapurna.id,
      vendorName: vAnnapurna.name,
      eventId,
      category: "Caterer",
      budgetCategoryId: cateringCat?.id,
      quotedAmount: 390000,
      guestCoverage: 200,
      includedServices: [
        "Standard vegetarian buffet (2 paneer dishes, dal makhani, breads, 2 desserts)",
        "Melamine crockery and basic serving staff",
      ],
      additionalCharges: [
        "Packaged mineral water & soft beverages billed per crate on actual consumption",
        "Live chaat stall extra at ₹35,000",
        "18% GST extra on final invoice",
        "Additional guest plates billed at ₹1,950/pax over 200",
      ],
      terms: "50% non-refundable advance required.",
      missingInformation: [
        "Live counter pricing details",
        "Staffing ratio not specified",
        "Cutlery washing and cleanup logistics",
      ],
      notes: "Upfront price appears lower, but covers only 200 guests and excludes beverages & taxes.",
    });
  }

  // 2. Venue Quotations (Maurya Grand Palace vs Patliputra Heritage)
  if (vMaurya) {
    addQuotation({
      vendorId: vMaurya.id,
      vendorName: vMaurya.name,
      eventId,
      category: "Venue",
      budgetCategoryId: venueCat?.id,
      quotedAmount: 420000,
      guestCoverage: 250,
      includedServices: [
        "Full indoor AC banquet hall & open courtyard rental for 8 hours",
        "Centralized AC & 100% DG generator power backup",
        "2 Complimentary air-conditioned bridal & family green rooms",
        "Dedicated valet parking assistance for 100+ vehicles",
      ],
      additionalCharges: [
        "Overtime beyond 8 hours billed at ₹12,000/hr",
        "Outside decorator royalty fee ₹25,000",
      ],
      terms: "30% advance on booking, 50% on event day, 20% on handover. All municipal taxes inclusive.",
      missingInformation: [
        "Music curfew exact timing verification",
      ],
      notes: "Premium banquet hall on Bailey Road with full AC and power backup.",
      isSelected: true,
    });
  }

  if (vPatliputra) {
    addQuotation({
      vendorId: vPatliputra.id,
      vendorName: vPatliputra.name,
      eventId,
      category: "Venue",
      budgetCategoryId: venueCat?.id,
      quotedAmount: 360000,
      guestCoverage: 250,
      includedServices: [
        "Riverside lawn & dining pavilion rental for 6 hours",
        "Basic stage platform and ambient house lighting",
        "1 Green room for bride",
      ],
      additionalCharges: [
        "DG generator diesel billed extra at ₹1,100/hr on meter",
        "Mandatory in-house decor tie-in",
        "Sound license fee of ₹8,000",
        "18% GST extra on final invoice",
      ],
      terms: "50% non-refundable advance, 50% one week prior.",
      missingInformation: [
        "Rain contingency and lawn waterproofing arrangements",
        "10:00 PM sound cutoff compliance",
      ],
      notes: "Lower baseline rental, but generator fuel and sound license create hidden surcharges.",
    });
  }

  // 3. Photography Quotations (Magadh Candid vs Drishti Studio)
  if (vMagadh) {
    addQuotation({
      vendorId: vMagadh.id,
      vendorName: vMagadh.name,
      eventId,
      category: "Photographer",
      budgetCategoryId: photoCat?.id,
      quotedAmount: 165000,
      guestCoverage: 250,
      includedServices: [
        "2 Lead Candid Photographers + 2 Traditional 4K Cinematographers",
        "Drone/aerial videography coverage for baraat and varmala",
        "Full high-res raw photo rushes & uncompressed 4K video footage on 1TB hard drive",
        "3-minute cinematic highlights teaser delivered within 10 days",
        "40-page flush-mount leather wedding album with 45-day guaranteed delivery",
      ],
      additionalCharges: [],
      terms: "25% booking, 50% on event day, 25% on final album handover.",
      missingInformation: [],
      notes: "Comprehensive media rights, raw footage handover, and written turnaround guarantee.",
      isSelected: true,
    });
  }

  if (vDrishti) {
    addQuotation({
      vendorId: vDrishti.id,
      vendorName: vDrishti.name,
      eventId,
      category: "Photographer",
      budgetCategoryId: photoCat?.id,
      quotedAmount: 115000,
      guestCoverage: 250,
      includedServices: [
        "1 Candid Photographer + 2 Traditional Photographers",
        "1 Standard edited video film",
        "30-page basic photo album",
      ],
      additionalCharges: [
        "Aerial drone coverage extra at ₹25,000",
        "Raw uncompressed footage on hard drive extra at ₹15,000",
      ],
      terms: "50% upfront advance, 50% on raw shoot completion.",
      missingInformation: [
        "Turnaround timeline guarantee in writing",
        "Video editor revisions policy",
      ],
      notes: "Lower base cost, but drone coverage and raw rushes are excluded; 90-day turnaround.",
    });
  }

  // 4. Decoration Quotations (Pushpanjali vs Shringar)
  if (vPushpanjali) {
    addQuotation({
      vendorId: vPushpanjali.id,
      vendorName: vPushpanjali.name,
      eventId,
      category: "Decorator",
      budgetCategoryId: decorCat?.id,
      quotedAmount: 190000,
      guestCoverage: 250,
      includedServices: [
        "Fresh floral mandap with marigold, mogra, and white tuberoses (rajnigandha)",
        "Pathway ambient fairy lights and floral entrance archway",
        "Seating arrangement with 200 chiavari chairs and 6 VIP lounge sofas",
        "Weatherproof canopy structure for open-air lawn area",
        "Complimentary photo booth backdrop with bride & groom neon signage",
      ],
      additionalCharges: [],
      terms: "30% booking deposit, 70% upon decor handover 3 hours prior to guest arrival.",
      missingInformation: [],
      notes: "85% fresh flowers guaranteed; setup complete 3 hours prior to function.",
      isSelected: true,
    });
  }

  if (vShringar) {
    addQuotation({
      vendorId: vShringar.id,
      vendorName: vShringar.name,
      eventId,
      category: "Decorator",
      budgetCategoryId: decorCat?.id,
      quotedAmount: 135000,
      guestCoverage: 250,
      includedServices: [
        "Synthetic artificial floral mandap and stage backdrop",
        "Basic walkway string lights and 150 plastic banquet chairs with covers",
      ],
      additionalCharges: [
        "Fresh flower upgrade ₹45,000 extra",
        "Generator tie-in and electrical distribution fee ₹10,000",
      ],
      terms: "40% advance, 60% on event morning.",
      missingInformation: [
        "Rainproof canopy provision for open lawn",
      ],
      notes: "Artificial synthetic florals; fresh flowers billed extra.",
    });
  }

  // 5. Entertainment Quotation
  if (vSwaranjali) {
    addQuotation({
      vendorId: vSwaranjali.id,
      vendorName: vSwaranjali.name,
      eventId,
      category: "Entertainment",
      budgetCategoryId: entCat?.id,
      quotedAmount: 55000,
      guestCoverage: 250,
      includedServices: [
        "4 Shehnai and Nadaswaram classical artists for 3-hour guest welcome",
        "8-artist dynamic Punjabi Dhol troupe for grand baraat entry",
        "Acoustic instruments and bilingual artist coordinator",
      ],
      additionalCharges: [
        "Overtime beyond scheduled window billed at ₹5,000/hr",
      ],
      terms: "20% advance on booking, 80% on event night.",
      missingInformation: [],
      notes: "Auspicious traditional folk artists with authentic acoustic instruments.",
      isSelected: true,
    });
  }

  // 6. Transportation Quotation
  if (vCarFleet) {
    addQuotation({
      vendorId: vCarFleet.id,
      vendorName: vCarFleet.name,
      eventId,
      category: "Transportation",
      budgetCategoryId: transCat?.id,
      quotedAmount: 65000,
      guestCoverage: 250,
      includedServices: [
        "2 AC Tempo Travellers (20-seater) and 4 Toyota Innova Crystas for 14 hours",
        "Airport and Patna Junction station guest pickups and drops",
        "Fuel, state border permits, tolls, and driver bhatta included",
      ],
      additionalCharges: [
        "Overtime past 14 hours billed at ₹800/hr per vehicle",
      ],
      terms: "25% booking, 75% on vehicle dispatch morning.",
      missingInformation: [],
      notes: "All-inclusive transit quotation covering outstation family arrival logistics.",
      isSelected: true,
    });
  }

  // 7. Makeup Quotation
  if (vAuraMakeup) {
    addQuotation({
      vendorId: vAuraMakeup.id,
      vendorName: vAuraMakeup.name,
      eventId,
      category: "Makeup",
      budgetCategoryId: makeupCat?.id,
      quotedAmount: 42000,
      guestCoverage: 5,
      includedServices: [
        "Bridal HD Airbrush makeover with pre-wedding trial session",
        "Bridal hairstyle, floral accessories, jewelry setting, and lehenga draping",
        "Groom hair styling and beard grooming touchup",
        "3 Family members party makeup and saree draping",
      ],
      additionalCharges: [
        "Early morning 4:00 AM muhurat slot convenience surcharge ₹5,000",
      ],
      terms: "30% booking advance, 70% upon makeover completion.",
      missingInformation: [],
      notes: "Premium international cosmetics used; trial session included in package.",
      isSelected: true,
    });
  }

  // 8. Lighting Quotation
  if (vLaxmiLighting) {
    addQuotation({
      vendorId: vLaxmiLighting.id,
      vendorName: vLaxmiLighting.name,
      eventId,
      category: "Lighting",
      budgetCategoryId: lightCat?.id,
      quotedAmount: 75000,
      guestCoverage: 250,
      includedServices: [
        "Banquet ambient architectural LED uplighting (60 par cans)",
        "Truss spotlights and moving sharpie heads for grand varmala entry",
        "400m warm fairy light strings over outdoor dining pavilion",
        "125 KVA silent DG generator with diesel for 6 hours",
        "2 On-site licensed electricians and dimmer operators",
      ],
      additionalCharges: [
        "Diesel beyond 6 hours billed at actual fuel receipt (approx ₹1,200/hr)",
      ],
      terms: "25% booking advance, 75% on light trial handover.",
      missingInformation: [],
      notes: "Weatherproof copper cabling and silent generator power backup included.",
      isSelected: true,
    });
  }

  return createdVendors;
}

export function getVendorById(id: string): Vendor | null {
  return getAllVendors().find((v) => v.id === id) || null;
}

export function addVendor(
  eventId: string,
  vendor: Omit<Vendor, "id" | "eventId" | "createdAt" | "updatedAt">
): Vendor {
  const all = getAllVendors();
  const now = new Date().toISOString();
  const newVendor: Vendor = {
    ...vendor,
    id: `ven_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventId,
    createdAt: now,
    updatedAt: now,
  };
  all.push(newVendor);
  if (isClient()) {
    try {
      localStorage.setItem(`${VENDORS_INITIALIZED_KEY}_${eventId}`, "true");
      localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(all));
      notifyChange();
    } catch (e) {
      console.error("Failed to add vendor:", e);
    }
  }
  return newVendor;
}

export function updateVendor(id: string, updates: Partial<Vendor>): Vendor | null {
  const all = getAllVendors();
  const idx = all.findIndex((v) => v.id === id);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // If vendor name updated, also update vendorName across their quotations
  if (updates.name && updates.name !== all[idx].name) {
    const quotes = getAllQuotations();
    let quotesChanged = false;
    quotes.forEach((q) => {
      if (q.vendorId === id) {
        q.vendorName = updates.name!;
        quotesChanged = true;
      }
    });
    if (quotesChanged && isClient()) {
      localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(quotes));
    }
  }

  if (isClient()) {
    try {
      localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(all));
      notifyChange();
    } catch (e) {
      console.error("Failed to update vendor:", e);
    }
  }
  return all[idx];
}

export function deleteVendor(id: string): boolean {
  if (!isClient()) return false;
  const all = getAllVendors();
  const filtered = all.filter((v) => v.id !== id);
  if (filtered.length === all.length) return false;

  try {
    localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(filtered));

    // Also delete linked quotations
    const quotations = getAllQuotations().filter((q) => q.vendorId !== id);
    localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(quotations));

    notifyChange();
    return true;
  } catch (e) {
    console.error("Failed to delete vendor:", e);
    return false;
  }
}

export function getAllQuotations(): VendorQuotation[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(QUOTATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load quotations:", error);
    return [];
  }
}

export function getQuotationsForEvent(eventId: string): VendorQuotation[] {
  return getAllQuotations().filter((q) => q.eventId === eventId);
}

export function getQuotationsForCategory(eventId: string, category: VendorCategory): VendorQuotation[] {
  return getAllQuotations().filter((q) => q.eventId === eventId && q.category === category);
}

export function getQuotationById(id: string): VendorQuotation | null {
  return getAllQuotations().find((q) => q.id === id) || null;
}

export function addQuotation(
  quotation: Omit<VendorQuotation, "id" | "createdAt" | "updatedAt">
): VendorQuotation {
  const all = getAllQuotations();
  const now = new Date().toISOString();
  const newQuote: VendorQuotation = {
    ...quotation,
    id: `quo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };
  all.push(newQuote);
  if (isClient()) {
    try {
      localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(all));
      notifyChange();
    } catch (e) {
      console.error("Failed to add quotation:", e);
    }
  }
  return newQuote;
}

export function updateQuotation(id: string, updates: Partial<VendorQuotation>): VendorQuotation | null {
  const all = getAllQuotations();
  const idx = all.findIndex((q) => q.id === id);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (isClient()) {
    try {
      localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(all));
      notifyChange();
    } catch (e) {
      console.error("Failed to update quotation:", e);
    }
  }
  return all[idx];
}

export function deleteQuotation(id: string): boolean {
  if (!isClient()) return false;
  const all = getAllQuotations();
  const filtered = all.filter((q) => q.id !== id);
  if (filtered.length === all.length) return false;

  try {
    localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(filtered));
    notifyChange();
    return true;
  } catch (e) {
    console.error("Failed to delete quotation:", e);
    return false;
  }
}

/**
 * Mark a quotation as selected for a category.
 * Automatically unselects other quotations in the same category for this event.
 */
export function selectQuotationForCategory(
  quotationId: string,
  category: VendorCategory,
  eventId: string
): void {
  const all = getAllQuotations();
  let modified = false;

  all.forEach((q) => {
    if (q.eventId === eventId && q.category === category) {
      if (q.id === quotationId) {
        q.isSelected = true;
        modified = true;
      } else if (q.isSelected) {
        q.isSelected = false;
        modified = true;
      }
    }
  });

  if (modified && isClient()) {
    try {
      localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(all));
      notifyChange();
    } catch (e) {
      console.error("Failed to set selected quotation:", e);
    }
  }
}

export function saveComparisonResult(
  eventId: string,
  category: string,
  result: QuotationComparisonResult
): void {
  if (!isClient()) return;
  try {
    const raw = localStorage.getItem(COMPARISONS_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[`${eventId}_${category}`] = result;
    localStorage.setItem(COMPARISONS_STORAGE_KEY, JSON.stringify(stored));
    notifyChange();
  } catch (e) {
    console.error("Failed to save comparison result:", e);
  }
}

export function getComparisonResult(
  eventId: string,
  category: string
): QuotationComparisonResult | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(COMPARISONS_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    return stored[`${eventId}_${category}`] || null;
  } catch (e) {
    console.error("Failed to load comparison result:", e);
    return null;
  }
}

