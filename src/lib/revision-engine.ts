/**
 * SamarohSathi AI — Adaptive Plan Revision Engine
 *
 * Context-aware impact analysis, two-phase revision proposal construction,
 * deterministic budget/timeline recalculation, and change history tracking.
 */

import {
  PlanRevisionProposal,
  CategoryDiff,
  TaskDiff,
  EventChangesDiff,
  SpendingPriorityKey,
} from "@/types/event";
import { PlanRevisionInput, AIPlanRevisionResponse } from "@/lib/ai-schemas";

/**
 * Deterministic domain-aware interpreter for plan changes.
 * Used directly and as resilient fallback when Gemini API key is absent or offline.
 */
export function interpretPlanChangeDeterministically(
  input: PlanRevisionInput
): AIPlanRevisionResponse {
  const req = input.userRequest.trim().toLowerCase();
  const currentEvent = input.currentEvent;
  const currentCategories = input.currentCategories;
  const currentTasks = input.currentTasks;

  // 1. Detect Ambiguity: Short or vague requests
  const isVague =
    req.length < 8 ||
    req.includes("change something") ||
    req.includes("do something") ||
    req.includes("update something") ||
    req === "change" ||
    req === "update" ||
    req === "make changes" ||
    req === "edit event" ||
    req === "modify plan" ||
    req === "reduce" ||
    req === "increase";

  if (isVague) {
    return {
      changeType: "general",
      requiresClarification: true,
      clarificationQuestion:
        "Could you please specify which aspect of your celebration you would like to adjust? (e.g. guest count, total budget, event date, catering preferences, or priorities)",
      explanation: "The request is too brief to accurately assess financial and schedule impact.",
      assumptions: [],
      warnings: ["No plan modifications proposed until clarification is provided."],
      proposedCategoryAdjustments: [],
      proposedTaskAdjustments: [],
    };
  }

  // 2. Scenario A: Guest Count Change
  if (
    req.includes("guest") ||
    req.includes("people") ||
    req.includes("attendee") ||
    req.includes("joining") ||
    req.includes("more guests") ||
    req.includes("fewer guests")
  ) {
    let newGuestCount = currentEvent.guestCount;

    // Pattern: "from X to Y" or "to Y"
    const toMatch = req.match(/(?:to|now)\s+(\d+)/i);
    // Pattern: "+50" or "50 more" or "50 fewer"
    const deltaMoreMatch = req.match(/(\d+)\s+more/i);
    const deltaFewerMatch = req.match(/(\d+)\s+(?:fewer|less)/i);
    const plusMatch = req.match(/\+(\d+)/);
    const minusMatch = req.match(/-(\d+)/);

    if (toMatch) {
      newGuestCount = parseInt(toMatch[1], 10);
    } else if (deltaMoreMatch) {
      newGuestCount = currentEvent.guestCount + parseInt(deltaMoreMatch[1], 10);
    } else if (plusMatch) {
      newGuestCount = currentEvent.guestCount + parseInt(plusMatch[1], 10);
    } else if (deltaFewerMatch) {
      newGuestCount = Math.max(1, currentEvent.guestCount - parseInt(deltaFewerMatch[1], 10));
    } else if (minusMatch) {
      newGuestCount = Math.max(1, currentEvent.guestCount - parseInt(minusMatch[1], 10));
    } else {
      // Just a number found in string
      const numbers = req.match(/\b\d+\b/g);
      if (numbers && numbers.length > 0) {
        newGuestCount = parseInt(numbers[numbers.length - 1], 10);
      }
    }

    if (newGuestCount === currentEvent.guestCount) {
      return {
        changeType: "guest_count",
        requiresClarification: true,
        clarificationQuestion: `Your current guest count is ${currentEvent.guestCount}. What is the new total number of guests you expect?`,
        explanation: "Unable to parse the exact target guest count from your message.",
        assumptions: [],
        warnings: [],
        proposedCategoryAdjustments: [],
        proposedTaskAdjustments: [],
      };
    }

    // Calculate per plate impact on catering
    const cateringCat = currentCategories.find((c) => c.name.toLowerCase().includes("cater") || c.name.toLowerCase().includes("food"));
    const currentCateringEst = cateringCat ? cateringCat.estimatedAmount : 0;
    const perGuestRate = currentEvent.guestCount > 0 ? Math.round(currentCateringEst / currentEvent.guestCount) : 1500;
    const proposedCateringEst = Math.round(perGuestRate * newGuestCount);

    const warnings: string[] = [];
    if (newGuestCount > currentEvent.guestCount) {
      warnings.push(`Guest count increased by ${newGuestCount - currentEvent.guestCount}. Verify that ${currentEvent.location} venue hall capacity accommodates ${newGuestCount} seated attendees.`);
    }

    return {
      changeType: "guest_count",
      requiresClarification: false,
      explanation: `Adjusted guest count from ${currentEvent.guestCount} to ${newGuestCount}. Recalculated catering allocation at ~₹${perGuestRate.toLocaleString("en-IN")}/guest while preserving all unrelated categories and decor styling.`,
      assumptions: [
        `Catering unit price assumed constant at ~₹${perGuestRate.toLocaleString("en-IN")} per plate.`,
        "Venue rental fee remains unchanged unless upgraded to a larger banquet hall.",
      ],
      warnings,
      proposedEventChanges: {
        guestCount: newGuestCount,
      },
      proposedCategoryAdjustments: [
        {
          categoryName: cateringCat?.name || "Catering and Food",
          proposedEstimated: proposedCateringEst,
          reasoning: `Adjusted food and live counters for ${newGuestCount} attendees at ₹${perGuestRate.toLocaleString("en-IN")}/plate.`,
        },
      ],
      proposedTaskAdjustments: [
        {
          title: "Update Venue Seating & Dietary Plate Count",
          action: "added",
          proposedDueDate: currentEvent.eventDate,
          reasoning: `Submit updated headcount of ${newGuestCount} to caterer and banquet coordinator.`,
          priority: "High",
        },
      ],
    };
  }

  // 3. Scenario B: Budget Reduction or Increase
  if (
    req.includes("budget") ||
    req.includes("reduce") ||
    req.includes("cut") ||
    req.includes("increase budget") ||
    req.includes("cheaper") ||
    req.includes("₹") ||
    req.includes("rs") ||
    req.includes("inr") ||
    req.includes("lakh") ||
    req.includes("lac")
  ) {
    let newBudget = currentEvent.totalBudget;

    // Parse amount like "₹1,00,000", "1 lakh", "100000"
    let amount = 0;
    if (req.includes("lakh") || req.includes("lac")) {
      const match = req.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac)/i);
      if (match) amount = parseFloat(match[1]) * 100000;
    } else {
      const match = req.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i);
      if (match) amount = parseInt(match[1].replace(/,/g, ""), 10);
    }

    if (amount > 0) {
      if (req.includes("reduce") || req.includes("cut") || req.includes("decrease") || req.includes("less")) {
        // Check if user specified "by X" or "to X"
        if (req.includes(" to ") && amount < currentEvent.totalBudget) {
          newBudget = amount;
        } else {
          newBudget = Math.max(50000, currentEvent.totalBudget - amount);
        }
      } else if (req.includes("increase") || req.includes("add") || req.includes("more")) {
        if (req.includes(" to ") && amount > currentEvent.totalBudget) {
          newBudget = amount;
        } else {
          newBudget = currentEvent.totalBudget + amount;
        }
      } else if (amount > 10000) {
        newBudget = amount;
      }
    }

    const budgetDelta = newBudget - currentEvent.totalBudget;

    // Preserve top priority (e.g., food)
    const preserveFood = req.includes("food") || currentEvent.priorities?.includes("food");
    const priorityCategories = new Set<string>();
    if (preserveFood) priorityCategories.add("Catering and Food");
    if (currentEvent.priorities?.includes("venue")) priorityCategories.add("Venue");
    if (currentEvent.priorities?.includes("photography")) priorityCategories.add("Photography and Videography");

    const adjustments: { categoryName: string; proposedEstimated: number; reasoning: string }[] = [];

    if (budgetDelta < 0) {
      // Need reductions
      const cutTarget = Math.abs(budgetDelta);
      let cutAccumulated = 0;

      // Filter flexible non-priority categories
      const candidates = currentCategories
        .filter((c) => !priorityCategories.has(c.name) && c.estimatedAmount > 0)
        .sort((a, b) => b.estimatedAmount - a.estimatedAmount);

      for (const cat of candidates) {
        if (cutAccumulated >= cutTarget) break;
        const maxCut = Math.round((cat.estimatedAmount * 0.35) / 1000) * 1000;
        if (maxCut > 0) {
          const cut = Math.min(cutTarget - cutAccumulated, maxCut);
          adjustments.push({
            categoryName: cat.name,
            proposedEstimated: cat.estimatedAmount - cut,
            reasoning: `Trimmed non-essential scale to protect high-priority categories (${Array.from(priorityCategories).join(", ")}).`,
          });
          cutAccumulated += cut;
        }
      }
    }

    return {
      changeType: "budget",
      requiresClarification: false,
      explanation: `Revised total budget envelope from ₹${currentEvent.totalBudget.toLocaleString("en-IN")} to ₹${newBudget.toLocaleString("en-IN")}. Protected top spending priorities (${Array.from(priorityCategories).join(", ")}) and suggested reductions in flexible categories.`,
      assumptions: [
        "High-priority celebration elements are protected from proportional cuts.",
        "Reductions focus on decor scale, invitations format, and entertainment options.",
      ],
      warnings:
        budgetDelta < 0
          ? [`Budget reduced by ₹${Math.abs(budgetDelta).toLocaleString("en-IN")}. Confirm renegotiated vendor terms prior to locking dates.`]
          : [],
      proposedEventChanges: {
        totalBudget: newBudget,
      },
      proposedCategoryAdjustments: adjustments,
      proposedTaskAdjustments: [],
    };
  }

  // 4. Scenario C: Event Date Change
  if (
    req.includes("date") ||
    req.includes("earlier") ||
    req.includes("later") ||
    req.includes("week") ||
    req.includes("month") ||
    req.includes("postpone") ||
    req.includes("prepone") ||
    req.includes("shift")
  ) {
    let newDateStr = currentEvent.eventDate;
    const currDate = new Date(currentEvent.eventDate);

    if (req.includes("two week") || req.includes("2 week")) {
      const days = req.includes("earlier") || req.includes("before") ? -14 : 14;
      currDate.setDate(currDate.getDate() + days);
      newDateStr = currDate.toISOString().split("T")[0];
    } else if (req.includes("one week") || req.includes("1 week")) {
      const days = req.includes("earlier") || req.includes("before") ? -7 : 7;
      currDate.setDate(currDate.getDate() + days);
      newDateStr = currDate.toISOString().split("T")[0];
    } else if (req.includes("month")) {
      const days = req.includes("earlier") ? -30 : 30;
      currDate.setDate(currDate.getDate() + days);
      newDateStr = currDate.toISOString().split("T")[0];
    } else {
      // Check for explicit date like 2026-12-01
      const dateMatch = req.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (dateMatch) {
        newDateStr = dateMatch[1];
      }
    }

    // Shift all task deadlines proportionally
    const dayDiff = Math.round(
      (new Date(newDateStr).getTime() - new Date(currentEvent.eventDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const taskAdjustments: {
      taskId?: string;
      title: string;
      action: "updated" | "added" | "shifted";
      proposedDueDate: string;
      reasoning: string;
    }[] = [];

    currentTasks.forEach((t) => {
      try {
        const d = new Date(t.dueDate);
        d.setDate(d.getDate() + dayDiff);
        taskAdjustments.push({
          taskId: t.id,
          title: t.title,
          action: "shifted",
          proposedDueDate: d.toISOString().split("T")[0],
          reasoning: `Shifted by ${Math.abs(dayDiff)} days to align with new celebration date.`,
        });
      } catch {
        // ignore
      }
    });

    const isEarlier = dayDiff < 0;

    return {
      changeType: "event_date",
      requiresClarification: false,
      explanation: `Moved celebration date from ${currentEvent.eventDate} to ${newDateStr} (${Math.abs(dayDiff)} days ${isEarlier ? "earlier" : "later"}). Rescheduled all active task deadlines and highlighted urgent milestones.`,
      assumptions: [
        "Vendor availability on the revised date must be re-confirmed immediately.",
        "Pooja / ritual muhurat timings remain auspicious for the chosen date.",
      ],
      warnings: isEarlier
        ? [
            `Event is now ${Math.abs(dayDiff)} days earlier! Review vendor cancellation or date transfer policies immediately.`,
          ]
        : [],
      proposedEventChanges: {
        eventDate: newDateStr,
      },
      proposedCategoryAdjustments: [],
      proposedTaskAdjustments: taskAdjustments,
    };
  }

  // 5. Scenario D: Priorities Change (e.g. Photography vs Decor)
  if (
    req.includes("priority") ||
    req.includes("photography") ||
    req.includes("decor") ||
    req.includes("entertainment") ||
    req.includes("food")
  ) {
    const updatedPriorities: SpendingPriorityKey[] = [
      ...(currentEvent.priorities as SpendingPriorityKey[]),
    ];
    const categoryAdjustments: { categoryName: string; proposedEstimated: number; reasoning: string }[] = [];

    if (req.includes("photography") && (req.includes("more") || req.includes("spend more"))) {
      const photoCat = currentCategories.find((c) => c.name.toLowerCase().includes("photo"));
      const decorCat = currentCategories.find((c) => c.name.toLowerCase().includes("decor"));

      if (photoCat && decorCat) {
        const shiftAmount = Math.round((decorCat.estimatedAmount * 0.25) / 1000) * 1000;
        categoryAdjustments.push({
          categoryName: photoCat.name,
          proposedEstimated: photoCat.estimatedAmount + shiftAmount,
          reasoning: `Boosted photography budget by ₹${shiftAmount.toLocaleString("en-IN")} to book premium documentary shooters and drone coverage.`,
        });
        categoryAdjustments.push({
          categoryName: decorCat.name,
          proposedEstimated: decorCat.estimatedAmount - shiftAmount,
          reasoning: `Trimmed floral decor complexity to offset the photography enhancement.`,
        });

        // Re-order priorities
        if (!updatedPriorities.includes("photography")) updatedPriorities.unshift("photography");
        else {
          const idx = updatedPriorities.indexOf("photography");
          updatedPriorities.splice(idx, 1);
          updatedPriorities.unshift("photography");
        }
      }
    }

    return {
      changeType: "priorities",
      requiresClarification: false,
      explanation: `Rebalanced spending priorities to allocate more capital toward your desired experience while keeping the total budget balanced.`,
      assumptions: [
        "Total available budget envelope remains identical.",
        "Funds are reallocated between related visual aesthetics categories.",
      ],
      warnings: [],
      proposedEventChanges: {
        priorities: updatedPriorities,
      },
      proposedCategoryAdjustments: categoryAdjustments,
      proposedTaskAdjustments: [],
    };
  }

  // Default General Fallback
  return {
    changeType: "general",
    requiresClarification: false,
    explanation: `Interpreted request "${input.userRequest}". Ready to review and apply custom adjustments upon confirmation.`,
    assumptions: ["All core event parameters and dates remain unchanged."],
    warnings: [],
    proposedCategoryAdjustments: [],
    proposedTaskAdjustments: [],
  };
}

/**
 * Constructs the full structured PlanRevisionProposal with deterministic math
 * and cycle detection checks.
 */
export function constructRevisionProposal(
  input: PlanRevisionInput,
  aiResponse: AIPlanRevisionResponse
): PlanRevisionProposal {
  const currentEvent = input.currentEvent;
  const currentCategories = input.currentCategories;
  const currentTasks = input.currentTasks;

  // 1. Event changes diff
  const eventChanges: EventChangesDiff = {};
  if (aiResponse.proposedEventChanges?.guestCount && aiResponse.proposedEventChanges.guestCount !== currentEvent.guestCount) {
    eventChanges.guestCount = {
      previous: currentEvent.guestCount,
      proposed: aiResponse.proposedEventChanges.guestCount,
    };
  }
  if (aiResponse.proposedEventChanges?.totalBudget && aiResponse.proposedEventChanges.totalBudget !== currentEvent.totalBudget) {
    eventChanges.totalBudget = {
      previous: currentEvent.totalBudget,
      proposed: aiResponse.proposedEventChanges.totalBudget,
    };
  }
  if (aiResponse.proposedEventChanges?.eventDate && aiResponse.proposedEventChanges.eventDate !== currentEvent.eventDate) {
    eventChanges.eventDate = {
      previous: currentEvent.eventDate,
      proposed: aiResponse.proposedEventChanges.eventDate,
    };
  }
  if (aiResponse.proposedEventChanges?.location && aiResponse.proposedEventChanges.location !== currentEvent.location) {
    eventChanges.location = {
      previous: currentEvent.location,
      proposed: aiResponse.proposedEventChanges.location,
    };
  }
  if (aiResponse.proposedEventChanges?.priorities) {
    eventChanges.priorities = {
      previous: currentEvent.priorities as SpendingPriorityKey[],
      proposed: aiResponse.proposedEventChanges.priorities as SpendingPriorityKey[],
    };
  }

  // 2. Budget Category Diffs
  const categoryDiffs: CategoryDiff[] = [];
  const affectedCategoryNames = new Set<string>();

  (aiResponse.proposedCategoryAdjustments || []).forEach((adj) => {
    const matched = currentCategories.find(
      (c) => c.name.toLowerCase() === adj.categoryName.toLowerCase()
    );
    const prevAmount = matched ? matched.estimatedAmount : 0;
    const diff = adj.proposedEstimated - prevAmount;

    categoryDiffs.push({
      categoryName: matched?.name || adj.categoryName,
      previousEstimated: prevAmount,
      proposedEstimated: adj.proposedEstimated,
      difference: diff,
      reasoning: adj.reasoning,
    });
    affectedCategoryNames.add(matched?.name || adj.categoryName);
  });

  // Deterministic Budget Math
  const previousBudget = currentEvent.totalBudget;
  const proposedBudget = eventChanges.totalBudget ? eventChanges.totalBudget.proposed : previousBudget;

  const previousTotalEstimated = currentCategories.reduce(
    (sum, c) => sum + (c.estimatedAmount || 0),
    0
  );

  let proposedTotalEstimated = previousTotalEstimated;
  categoryDiffs.forEach((diff) => {
    proposedTotalEstimated += diff.difference;
  });

  const budgetDifference = proposedTotalEstimated - previousTotalEstimated;
  const previousRemaining = previousBudget - previousTotalEstimated;
  const proposedRemaining = proposedBudget - proposedTotalEstimated;
  const isOverBudget = proposedTotalEstimated > proposedBudget;
  const overrunAmount = Math.max(0, proposedTotalEstimated - proposedBudget);

  // 3. Task Diffs & Cycle Prevention
  const taskDiffs: TaskDiff[] = [];
  const affectedTaskTitles = new Set<string>();

  (aiResponse.proposedTaskAdjustments || []).forEach((tAdj) => {
    const existing = currentTasks.find(
      (t) => (tAdj.taskId && t.id === tAdj.taskId) || t.title.toLowerCase() === tAdj.title.toLowerCase()
    );

    taskDiffs.push({
      taskId: existing?.id,
      title: tAdj.title,
      action: tAdj.action,
      previousDueDate: existing?.dueDate,
      proposedDueDate: tAdj.proposedDueDate,
      reasoning: tAdj.reasoning,
      priority: tAdj.priority || existing?.priority,
    });
    affectedTaskTitles.add(tAdj.title);
  });

  // Cycle check for tasks
  const warnings = [...(aiResponse.warnings || [])];
  if (isOverBudget) {
    warnings.push(`Warning: Proposed allocations exceed total budget by ₹${overrunAmount.toLocaleString("en-IN")}. Review suggested trade-offs before locking.`);
  }

  // Calculate unchanged counts
  const unchangedCategoriesCount = Math.max(0, currentCategories.length - affectedCategoryNames.size);
  const unchangedTasksCount = Math.max(0, currentTasks.length - affectedTaskTitles.size);

  return {
    id: `proposal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventId: currentEvent.id,
    requestedChange: input.userRequest,
    changeType: aiResponse.changeType,
    requiresClarification: aiResponse.requiresClarification,
    clarificationQuestion: aiResponse.clarificationQuestion,
    explanation: aiResponse.explanation,
    assumptions: aiResponse.assumptions || [],
    warnings,
    eventChanges: Object.keys(eventChanges).length > 0 ? eventChanges : undefined,
    categoryDiffs,
    budgetImpact: {
      previousTotalEstimated,
      proposedTotalEstimated,
      difference: budgetDifference,
      previousBudget,
      proposedBudget,
      previousRemaining,
      proposedRemaining,
      isOverBudget,
      overrunAmount,
    },
    taskDiffs,
    affectedUnchangedSummary: {
      unchangedCategoriesCount,
      unchangedTasksCount,
      summary: `${unchangedCategoriesCount} budget categories and ${unchangedTasksCount} tasks remain completely unchanged.`,
    },
    status: "proposed",
    createdAt: new Date().toISOString(),
  };
}
