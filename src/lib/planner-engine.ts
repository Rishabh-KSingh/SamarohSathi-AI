/**
 * SamarohSathi AI — Indian Celebration Planning & Trade-off Engine
 *
 * Deterministic business logic for budget allocation, task scheduling,
 * dependency cycle prevention, and priority-preserving trade-offs.
 * Used both directly and as the resilient fallback when Gemini API key is unset/offline.
 */

import {
  EventData,
  BudgetCategory,
  EventTask,
  AIEventPlan,
  BudgetTradeoffSuggestion,
  SpendingPriorityKey,
  CategoryPriority,
  TaskPriority,
} from "@/types/event";
import { STANDARD_BUDGET_CATEGORIES } from "@/lib/constants";

// =========================================================================
// Category Baselines & Weight Multipliers for Indian Celebrations
// =========================================================================

interface CategoryWeightProfile {
  [category: string]: number; // Percentage of total budget (sums to 100)
}

const DEFAULT_WEDDING_WEIGHTS: CategoryWeightProfile = {
  Venue: 22,
  "Catering and Food": 34,
  Decoration: 14,
  "Photography and Videography": 10,
  Entertainment: 5,
  Invitations: 2,
  Transportation: 3,
  Accommodation: 4,
  Miscellaneous: 2,
  "Emergency Reserve": 4,
};

const DEFAULT_PARTY_WEIGHTS: CategoryWeightProfile = {
  Venue: 25,
  "Catering and Food": 38,
  Decoration: 14,
  "Photography and Videography": 8,
  Entertainment: 7,
  Invitations: 2,
  Transportation: 1,
  Accommodation: 0,
  Miscellaneous: 2,
  "Emergency Reserve": 3,
};

const DEFAULT_HOUSEWARMING_WEIGHTS: CategoryWeightProfile = {
  Venue: 6, // Usually home or society clubhouse
  "Catering and Food": 46,
  Decoration: 20,
  "Photography and Videography": 10,
  Entertainment: 4,
  Invitations: 3,
  Transportation: 2,
  Accommodation: 2,
  Miscellaneous: 3,
  "Emergency Reserve": 4,
};

const DEFAULT_CORPORATE_WEIGHTS: CategoryWeightProfile = {
  Venue: 28,
  "Catering and Food": 36,
  Decoration: 8,
  "Photography and Videography": 8,
  Entertainment: 8,
  Invitations: 2,
  Transportation: 4,
  Accommodation: 0,
  Miscellaneous: 2,
  "Emergency Reserve": 4,
};

function getBaseWeights(occasion: string): CategoryWeightProfile {
  const occ = occasion.toLowerCase();
  if (occ.includes("wedding") || occ.includes("sangeet") || occ.includes("reception") || occ.includes("engagement")) {
    return { ...DEFAULT_WEDDING_WEIGHTS };
  }
  if (occ.includes("housewarming") || occ.includes("griha") || occ.includes("godh") || occ.includes("baby")) {
    return { ...DEFAULT_HOUSEWARMING_WEIGHTS };
  }
  if (occ.includes("corporate")) {
    return { ...DEFAULT_CORPORATE_WEIGHTS };
  }
  return { ...DEFAULT_PARTY_WEIGHTS };
}

/**
 * Adjusts base weights according to user's ranked spending priorities
 */
function adjustWeightsByPriorities(
  baseWeights: CategoryWeightProfile,
  priorities: SpendingPriorityKey[]
): CategoryWeightProfile {
  const adjusted = { ...baseWeights };

  // Map priority keys to category names
  const keyToCategoryMap: Record<SpendingPriorityKey, string> = {
    food: "Catering and Food",
    venue: "Venue",
    decor: "Decoration",
    photography: "Photography and Videography",
    entertainment: "Entertainment",
    hospitality: "Accommodation",
    simplicity: "Miscellaneous",
    gifting: "Miscellaneous",
  };

  priorities.forEach((priKey, index) => {
    const category = keyToCategoryMap[priKey];
    if (category && adjusted[category] !== undefined) {
      // Rank 1 gets +6%, Rank 2 gets +4%, Rank 3 gets +2%
      const boost = Math.max(0, 6 - index * 2);
      adjusted[category] += boost;
    }
  });

  // Re-normalize weights so total is exactly 100%
  const sum = Object.values(adjusted).reduce((a, b) => a + b, 0);
  const normalized: CategoryWeightProfile = {};
  let totalAllocated = 0;

  const categories = Object.keys(adjusted);
  categories.forEach((cat, idx) => {
    if (idx === categories.length - 1) {
      // Last category absorbs rounding difference
      normalized[cat] = Math.max(1, 100 - totalAllocated);
    } else {
      const pct = Math.round((adjusted[cat] / sum) * 100);
      normalized[cat] = Math.max(1, pct);
      totalAllocated += normalized[cat];
    }
  });

  return normalized;
}

/**
 * Generates initial budget categories deterministically based on event data
 */
export function generateDeterministicBudgetCategories(event: EventData): BudgetCategory[] {
  const baseWeights = getBaseWeights(event.occasion);
  const finalWeights = adjustWeightsByPriorities(baseWeights, event.priorities || []);
  const total = event.totalBudget;

  const categories: BudgetCategory[] = [];
  let allocatedSum = 0;

  STANDARD_BUDGET_CATEGORIES.forEach((catName, index) => {
    const pct = finalWeights[catName] ?? 5;
    let amount = Math.round((total * (pct / 100)) / 1000) * 1000;

    // For the last category, make sure total matches exactly
    if (index === STANDARD_BUDGET_CATEGORIES.length - 1) {
      amount = Math.max(0, total - allocatedSum);
    } else {
      allocatedSum += amount;
    }

    let priority: CategoryPriority = "Medium";
    if (
      (catName === "Catering and Food" && event.priorities?.includes("food")) ||
      (catName === "Venue" && event.priorities?.includes("venue")) ||
      (catName === "Decoration" && event.priorities?.includes("decor")) ||
      (catName === "Photography and Videography" && event.priorities?.includes("photography"))
    ) {
      priority = "High";
    } else if (catName === "Miscellaneous" || catName === "Invitations") {
      priority = "Low";
    }

    let notes = "Estimated — based on planning assumptions. Confirm with the vendor before booking.";
    if (catName === "Catering and Food" && event.guestCount > 0) {
      const perPlate = Math.round(amount / event.guestCount);
      notes = `Approx. ₹${perPlate.toLocaleString("en-IN")}/guest for ${event.guestCount} guests. ${notes}`;
    } else if (catName === "Emergency Reserve") {
      notes = `Safety buffer for unforeseen costs (approx. ${pct}% of total budget). ${notes}`;
    }

    categories.push({
      id: `cat_${Date.now()}_${index}`,
      eventId: event.id,
      name: catName,
      estimatedAmount: amount,
      actualAmount: 0,
      priority,
      notes,
      isAiGenerated: true,
    });
  });

  return categories;
}

/**
 * Calculates deadline date based on days before eventDate
 */
function getRelativeDate(eventDateStr: string, daysBefore: number): string {
  try {
    const d = new Date(eventDateStr);
    if (isNaN(d.getTime())) {
      const today = new Date();
      today.setDate(today.getDate() + 30);
      return today.toISOString().split("T")[0];
    }
    d.setDate(d.getDate() - daysBefore);
    return d.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Generates initial event tasks with structured dependencies and deadlines
 */
export function generateDeterministicTasks(event: EventData): EventTask[] {
  const eventDate = event.eventDate || "2026-12-31";
  const now = new Date().toISOString();

  // Create tasks with static temporary keys to link dependencies reliably
  interface RawTask {
    key: string;
    title: string;
    description: string;
    daysBefore: number;
    priority: TaskPriority;
    depKeys: string[];
  }

  const rawTasks: RawTask[] = [
    {
      key: "task_date_guest",
      title: "Finalize Guest Count & RSVP Baseline",
      description: `Review guest audience requirements (${event.guestCount} guests expected) and finalize initial guest list segments.`,
      daysBefore: 60,
      priority: "High",
      depKeys: [],
    },
    {
      key: "task_venue",
      title: "Confirm Venue Booking & Contract Terms",
      description: `Finalize venue agreement in ${event.location || "selected city"} ensuring capacity for ${event.guestCount} guests and quiet-hour compliance.`,
      daysBefore: 50,
      priority: "High",
      depKeys: ["task_date_guest"],
    },
    {
      key: "task_catering",
      title: "Confirm Catering Menu & Per-Plate Pricing",
      description: `Select live counters, regional specialties, and dietary provisions for ${event.guestCount} guests based on confirmed venue pantry access.`,
      daysBefore: 35,
      priority: "High",
      depKeys: ["task_date_guest", "task_venue"],
    },
    {
      key: "task_decor",
      title: "Finalize Floral Decor & Mandap/Stage Styling",
      description: `Coordinate floral themes, lighting architecture, and seating layout aligned with the "${event.atmosphere}" aesthetic.`,
      daysBefore: 28,
      priority: event.priorities?.includes("decor") ? "High" : "Medium",
      depKeys: ["task_venue"],
    },
    {
      key: "task_photo",
      title: "Book Photography & Cinematography Crew",
      description: "Confirm documentary lead, candid shooter, and highlight video delivery schedule with advance deposit.",
      daysBefore: 25,
      priority: event.priorities?.includes("photography") ? "High" : "Medium",
      depKeys: ["task_venue"],
    },
    {
      key: "task_invites",
      title: "Design & Dispatch Digital / Print Invitations",
      description: "Distribute formal invites with exact venue location, Google Maps pin, timings, and dress code.",
      daysBefore: 21,
      priority: "High",
      depKeys: ["task_venue", "task_date_guest"],
    },
    {
      key: "task_entertainment",
      title: "Finalize Music, DJ & Sound Requirements",
      description: "Curate playlist, brief DJ or folk musicians, and verify sound setup permissions with venue management.",
      daysBefore: 14,
      priority: event.priorities?.includes("entertainment") ? "High" : "Low",
      depKeys: ["task_venue"],
    },
    {
      key: "task_logistics",
      title: "Arrange Guest Transportation & Parking Logistics",
      description: "Arrange valet assistance, shuttle coordination, and wheelchair accessibility ramps if elderly guests are attending.",
      daysBefore: 10,
      priority: "Medium",
      depKeys: ["task_venue"],
    },
    {
      key: "task_dietary",
      title: "Lock Dietary Counters & Sacred Ritual Items",
      description: "Review specific dietary restrictions, pure-vegetarian counters, and pooja / ceremonial checklist with priests or family.",
      daysBefore: 5,
      priority: "Medium",
      depKeys: ["task_catering"],
    },
    {
      key: "task_rehearsal",
      title: "Final Vendor Walkthrough & Final Settlement Check",
      description: "Run final soundcheck, coordinate master vendor contact sheet, and confirm remaining payment balances.",
      daysBefore: 2,
      priority: "High",
      depKeys: ["task_catering", "task_decor"],
    },
  ];

  // Map temporary keys to stable IDs
  const keyToIdMap: Record<string, string> = {};
  rawTasks.forEach((t, i) => {
    keyToIdMap[t.key] = `task_${Date.now()}_${i}`;
  });

  return rawTasks.map((t) => {
    const id = keyToIdMap[t.key];
    const dependencyIds = t.depKeys.map((k) => keyToIdMap[k]).filter(Boolean);

    return {
      id,
      eventId: event.id,
      title: t.title,
      description: t.description,
      dueDate: getRelativeDate(eventDate, t.daysBefore),
      priority: t.priority,
      status: "Not Started",
      dependencyIds,
      createdAt: now,
      updatedAt: now,
    };
  });
}

/**
 * Generates a full personalized AI plan deterministically
 */
export function generateDeterministicPlan(event: EventData): AIEventPlan {
  const categories = generateDeterministicBudgetCategories(event);
  const tasks = generateDeterministicTasks(event);

  const budgetItems = categories.map((c) => ({
    name: c.name,
    estimatedAmount: c.estimatedAmount,
    priority: c.priority,
    notes: c.notes,
  }));

  const taskItems = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    dueDate: t.dueDate,
    priority: t.priority,
    status: t.status,
    dependencyIds: t.dependencyIds,
  }));

  const warnings: string[] = [
    `Always verify vendor availability and obtain written quotations before committing advance deposits.`,
    `Sound equipment and loud music in ${event.location || "your venue"} may have local municipal quiet hours (typically 10:00 PM).`,
  ];

  if (event.constraints?.hasElderly) {
    warnings.push("Elderly guests attending: Ensure ground floor accessibility, wheelchair access, and comfortable seating.");
  }

  if (event.constraints?.hasChildren) {
    warnings.push("Children attending: Keep safety barriers around stage risers and provide mild, kid-friendly food options.");
  }

  const followUpQuestions: string[] = [
    "Do you already have shortlisted venues in mind, or would you like venue recommendations?",
    "Will you require separate pre-event functions (e.g. Mehendi/Haldi) budgeted under the same envelope?",
  ];

  const assumptions: string[] = [
    `Calculated for ${event.guestCount} guests in ${event.location || "the specified location"}.`,
    `Budget flexibility is "${event.budgetFlexibility}". Highest spending priority given to ${event.priorities?.join(", ") || "food and venue"}.`,
    "All figures are initial planning estimates subject to seasonal vendor availability and quotation confirmation.",
  ];

  return {
    eventId: event.id,
    eventSummary: `${event.name} — A personalized ${event.occasion} in ${event.location || "India"} for ${event.guestCount} guests with a ${event.currency} ${event.totalBudget.toLocaleString()} budget focused on ${event.atmosphere}.`,
    assumptions,
    recommendations: [
      "Book venue at least 2 to 3 months in advance to lock competitive seasonal rates.",
      "Bundle floral decor and sound stage with one verified vendor to negotiate a 10-15% package discount.",
    ],
    budget: {
      totalBudget: event.totalBudget,
      categories: budgetItems,
    },
    tasks: taskItems,
    warnings,
    followUpQuestions,
    generatedAt: new Date().toISOString(),
    source: "deterministic-fallback",
  };
}

// =========================================================================
// Dependency Cycle Prevention Logic
// =========================================================================

/**
 * Checks whether adding or updating a task with `newDependencyIds` creates a cyclic dependency.
 * Returns { hasCycle: true, cyclePath: string[] } if a cycle is detected.
 */
export function detectDependencyCycle(
  tasks: EventTask[],
  taskIdToUpdate: string,
  newDependencyIds: string[]
): { hasCycle: boolean; cyclePath?: string[]; errorMessage?: string } {
  // Build adjacency list: task -> tasks that it depends on
  const graph = new Map<string, string[]>();

  tasks.forEach((t) => {
    graph.set(t.id, [...t.dependencyIds]);
  });

  // Apply hypothetical new dependencies for the target task
  graph.set(taskIdToUpdate, [...newDependencyIds]);

  // If a task depends on itself directly:
  if (newDependencyIds.includes(taskIdToUpdate)) {
    const task = tasks.find((t) => t.id === taskIdToUpdate);
    return {
      hasCycle: true,
      cyclePath: [taskIdToUpdate, taskIdToUpdate],
      errorMessage: `Task "${task?.title || taskIdToUpdate}" cannot depend on itself.`,
    };
  }

  // Depth-first search to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(curr: string): boolean {
    visited.add(curr);
    recursionStack.add(curr);
    path.push(curr);

    const neighbors = graph.get(curr) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        path.push(neighbor);
        return true;
      }
    }

    path.pop();
    recursionStack.delete(curr);
    return false;
  }

  for (const taskId of graph.keys()) {
    if (!visited.has(taskId)) {
      if (dfs(taskId)) {
        // Found cycle
        const cycleStartIndex = path.indexOf(path[path.length - 1]);
        const cycleSegment = path.slice(cycleStartIndex);
        const cycleNames = cycleSegment.map((id) => {
          const t = tasks.find((item) => item.id === id);
          return t ? `"${t.title}"` : id;
        });

        return {
          hasCycle: true,
          cyclePath: cycleSegment,
          errorMessage: `Circular dependency detected: ${cycleNames.join(" → ")}. A task cannot depend on a predecessor that transitively depends on it.`,
        };
      }
    }
  }

  return { hasCycle: false };
}

// =========================================================================
// Deterministic Trade-off Suggestions Engine (Overrun Handling)
// =========================================================================

/**
 * When total estimated expenses exceed the budget, this deterministic engine
 * identifies contributing categories, preserves user's high priorities, and
 * suggests specific reductions to rebalance the budget.
 */
export function generateDeterministicTradeoffs(
  totalBudget: number,
  categories: BudgetCategory[],
  priorities: SpendingPriorityKey[]
): BudgetTradeoffSuggestion {
  const totalEstimated = categories.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
  const overrun = Math.max(0, totalEstimated - totalBudget);

  if (overrun === 0) {
    return {
      summary: "Your estimated expenses are within your total available budget.",
      tradeoffs: [],
      projectedTotal: totalEstimated,
      projectedSavings: 0,
      advice: "Your budget is balanced. Keep recording actual expenses to monitor vendor quotes.",
      source: "deterministic-fallback",
    };
  }

  // Priority mapping
  const priorityCategoryNames = new Set<string>();
  if (priorities.includes("food")) priorityCategoryNames.add("Catering and Food");
  if (priorities.includes("venue")) priorityCategoryNames.add("Venue");
  if (priorities.includes("decor")) priorityCategoryNames.add("Decoration");
  if (priorities.includes("photography")) priorityCategoryNames.add("Photography and Videography");
  if (priorities.includes("entertainment")) priorityCategoryNames.add("Entertainment");
  if (priorities.includes("hospitality")) priorityCategoryNames.add("Accommodation");

  // Candidates for reduction: low priority categories first, then medium non-priority categories
  const flexibleCandidates = categories
    .filter((c) => c.estimatedAmount > 0)
    .sort((a, b) => {
      // Prioritize preserving High priority categories
      const aIsHigh = priorityCategoryNames.has(a.name) || a.priority === "High";
      const bIsHigh = priorityCategoryNames.has(b.name) || b.priority === "High";
      if (aIsHigh && !bIsHigh) return 1;
      if (!aIsHigh && bIsHigh) return -1;
      // Then sort by estimated amount descending (larger amounts give more room)
      return b.estimatedAmount - a.estimatedAmount;
    });

  let remainingToCut = overrun;
  const tradeoffs = [];

  for (const cat of flexibleCandidates) {
    if (remainingToCut <= 0) break;

    const isHighPriority = priorityCategoryNames.has(cat.name) || cat.priority === "High";
    // Maximum reduction fraction: 30% for regular, only 10% max for high priority
    const maxCutFraction = isHighPriority ? 0.1 : 0.35;
    const maxReduction = Math.round((cat.estimatedAmount * maxCutFraction) / 500) * 500;

    if (maxReduction > 500) {
      const cut = Math.min(remainingToCut, maxReduction);
      const newEstimate = cat.estimatedAmount - cut;

      let reasoning = "";
      if (cat.name === "Decoration") {
        reasoning = "Switch from exotic out-of-season florals to seasonal marigold, jasmine, and ambient uplighting.";
      } else if (cat.name === "Invitations") {
        reasoning = "Transition 70% of guest list to interactive digital e-invitations with RSVP tracking instead of heavy boxed cards.";
      } else if (cat.name === "Entertainment") {
        reasoning = "Engage a curated local regional folk troupe or DJ rather than celebrity artists.";
      } else if (cat.name === "Transportation") {
        reasoning = "Optimize bus shuttle routes between hotel and venue instead of individual rental cabs.";
      } else if (cat.name === "Emergency Reserve") {
        reasoning = "Prune buffer slightly once main venue and caterer contractual rates are locked.";
      } else {
        reasoning = `Streamline ancillary add-ons to preserve budget for your top priority categories.`;
      }

      tradeoffs.push({
        categoryName: cat.name,
        currentEstimate: cat.estimatedAmount,
        suggestedEstimate: newEstimate,
        savings: cut,
        reasoning,
        preservesPriority: isHighPriority,
      });

      remainingToCut -= cut;
    }
  }

  const projectedSavings = overrun - remainingToCut;
  const projectedTotal = totalEstimated - projectedSavings;

  return {
    summary: `Identified ₹${overrun.toLocaleString("en-IN")} overrun. Proposed targeted reductions in flexible categories while preserving your top priorities.`,
    tradeoffs,
    projectedTotal,
    projectedSavings,
    advice:
      projectedSavings >= overrun
        ? "Accepting these recommendations brings your estimated expenses completely back within budget."
        : `These suggestions recover ₹${projectedSavings.toLocaleString("en-IN")}. Consider slightly adjusting guest count or venue package for the remaining ₹${remainingToCut.toLocaleString("en-IN")}.`,
    source: "deterministic-fallback",
  };
}

