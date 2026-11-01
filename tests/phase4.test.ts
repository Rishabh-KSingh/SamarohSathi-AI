import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  interpretPlanChangeDeterministically,
  constructRevisionProposal,
} from "../src/lib/revision-engine";

import {
  PlanRevisionInputSchema,
  AIPlanRevisionResponseSchema,
  PlanRevisionInput,
} from "../src/lib/ai-schemas";

import {
  generateDeterministicBudgetCategories,
  generateDeterministicTasks,
} from "../src/lib/planner-engine";

import {
  applyPlanRevision,
  getChangeHistoryForEvent,
  getAllEvents,
  getCategoriesForEvent,
  createEvent,
  saveCategoriesForEvent,
  saveTasksForEvent,
} from "../src/lib/storage";

import { EventData, EventTask, BudgetCategory } from "../src/types/event";

class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe("Phase 4: Adaptive Plan Revision Engine", () => {
  let mockStorage: MockLocalStorage;
  let testEvent: EventData;
  let testCategories: BudgetCategory[];
  let testTasks: EventTask[];

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    const globalContext = globalThis as unknown as Record<string, unknown>;
    globalContext.localStorage = mockStorage;
    globalContext.window = {
      localStorage: mockStorage,
      dispatchEvent: () => {},
    };

    testEvent = createEvent({
      name: "Siddharth & Ananya Vivah",
      occasion: "Wedding",
      eventDate: "2026-12-20",
      location: "Jaipur, Rajasthan",
      guestCount: 200,
      guestAudience: ["family_relatives", "close_friends"],
      totalBudget: 800000,
      currency: "INR",
      budgetFlexibility: "moderate",
      atmosphere: "traditional_heritage",
      preferences: "Authentic royal hospitality with live regional counters",
      priorities: ["food", "venue", "decor"],
      mustHaves: ["Live Chaat counter", "Traditional Shehnai artists"],
      constraints: {
        mustHaves: ["Live Chaat counter"],
        thingsToAvoid: "Loud EDM music during family rituals",
        hasChildren: true,
        hasElderly: true,
        accessibilityRequirements: "Wheelchair ramps",
        venueLimitations: "10 PM sound curfew",
        culturalPreferences: "Vegetarian ceremonial appetizers",
      },
      status: "planning",
    });

    testCategories = generateDeterministicBudgetCategories(testEvent);
    saveCategoriesForEvent(testEvent.id, testCategories);
    testTasks = generateDeterministicTasks(testEvent);
    saveTasksForEvent(testEvent.id, testTasks);
  });

  const getBaseInput = (userRequest: string): PlanRevisionInput => ({
    eventId: testEvent.id,
    userRequest,
    currentEvent: {
      id: testEvent.id,
      name: testEvent.name,
      occasion: testEvent.occasion,
      eventDate: testEvent.eventDate,
      location: testEvent.location,
      guestCount: testEvent.guestCount,
      totalBudget: testEvent.totalBudget,
      currency: testEvent.currency,
      budgetFlexibility: testEvent.budgetFlexibility,
      atmosphere: testEvent.atmosphere,
      preferences: testEvent.preferences,
      priorities: testEvent.priorities,
      mustHaves: testEvent.mustHaves,
    },
    currentCategories: testCategories.map((c) => ({
      id: c.id,
      name: c.name,
      estimatedAmount: c.estimatedAmount,
      actualAmount: c.actualAmount || 0,
      priority: c.priority,
      notes: c.notes || "",
    })),
    currentTasks: testTasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      dependencyIds: t.dependencyIds || [],
    })),
  });

  test("1. Increase guest count from 200 to 250", () => {
    const input = getBaseInput("Increase my guest count from 200 to 250");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);

    assert.equal(proposal.changeType, "guest_count");
    assert.equal(proposal.requiresClarification, false);
    assert.equal(proposal.eventChanges?.guestCount?.previous, 200);
    assert.equal(proposal.eventChanges?.guestCount?.proposed, 250);

    // Catering estimate should have increased
    const cateringDiff = proposal.categoryDiffs.find((d) => d.categoryName.includes("Catering"));
    assert.ok(cateringDiff);
    assert.ok(cateringDiff.proposedEstimated > cateringDiff.previousEstimated);
    assert.ok(cateringDiff.difference > 0);

    // Unrelated categories should be preserved
    const decorDiff = proposal.categoryDiffs.find((d) => d.categoryName.includes("Decor"));
    assert.equal(decorDiff, undefined, "Decor should remain unchanged when only guest count increased");
  });

  test("2. Reduce budget while preserving the highest spending priority", () => {
    const input = getBaseInput("Reduce my budget by ₹1,00,000, but don't compromise on food");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);

    assert.equal(proposal.changeType, "budget");
    assert.equal(proposal.requiresClarification, false);
    assert.equal(proposal.eventChanges?.totalBudget?.previous, 800000);
    assert.equal(proposal.eventChanges?.totalBudget?.proposed, 700000);

    // Food is highest priority: should NOT be cut
    const foodCut = proposal.categoryDiffs.find(
      (d) => d.categoryName.includes("Catering") && d.difference < 0
    );
    assert.equal(foodCut, undefined, "Food must be protected when user says don't compromise on food");

    // Reductions should come from flexible categories
    assert.ok(proposal.categoryDiffs.length > 0, "Lower priority categories should absorb the reduction");
    proposal.categoryDiffs.forEach((d) => {
      assert.ok(d.proposedEstimated <= d.previousEstimated);
    });
  });

  test("3. Move the event date two weeks earlier", () => {
    const input = getBaseInput("Move my event two weeks earlier");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);

    assert.equal(proposal.changeType, "event_date");
    assert.equal(proposal.requiresClarification, false);

    // Calculate expected date (14 days earlier than 2026-12-20 => 2026-12-06)
    assert.equal(proposal.eventChanges?.eventDate?.proposed, "2026-12-06");

    // All task deadlines should be shifted earlier
    assert.ok(proposal.taskDiffs.length > 0);
    proposal.taskDiffs.forEach((t) => {
      assert.equal(t.action, "shifted");
      assert.ok(new Date(t.proposedDueDate) < new Date(t.previousDueDate!));
    });
  });

  test("4. Change spending priorities (spend more on photography, less on decor)", () => {
    const input = getBaseInput("I want to spend more on photography and less on decoration");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);

    assert.equal(proposal.changeType, "priorities");
    assert.equal(proposal.requiresClarification, false);

    const photoDiff = proposal.categoryDiffs.find((d) => d.categoryName.includes("Photo"));
    const decorDiff = proposal.categoryDiffs.find((d) => d.categoryName.includes("Decor"));

    assert.ok(photoDiff);
    assert.ok(decorDiff);
    assert.ok(photoDiff.difference > 0, "Photography budget must increase");
    assert.ok(decorDiff.difference < 0, "Decoration budget must decrease");

    // Check priorities updated
    assert.equal(proposal.eventChanges?.priorities?.proposed[0], "photography");
  });

  test("5. Submit an ambiguous request and verify that the AI asks a clarification question", () => {
    const input = getBaseInput("Change something");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);

    assert.equal(proposal.requiresClarification, true);
    assert.ok(proposal.clarificationQuestion && proposal.clarificationQuestion.length > 10);
    assert.equal(proposal.categoryDiffs.length, 0, "No changes should be proposed on ambiguous input");
    assert.equal(proposal.taskDiffs.length, 0);
  });

  test("6. Accept a revision and verify that the saved plan updates", () => {
    const input = getBaseInput("Increase my guest count from 200 to 250");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);

    // Apply acceptance
    const result = applyPlanRevision(proposal);

    // Verify event in storage has 250 guests
    const updatedEvents = getAllEvents();
    const eventInStore = updatedEvents.find((e) => e.id === testEvent.id);
    assert.equal(eventInStore?.guestCount, 250);
    assert.equal(result.event?.guestCount, 250);

    // Verify catering category updated in storage
    const categoriesInStore = getCategoriesForEvent(testEvent.id);
    const cateringCat = categoriesInStore.find((c) => c.name.includes("Catering"));
    const expectedProposed = proposal.categoryDiffs.find((d) => d.categoryName.includes("Catering"))?.proposedEstimated;
    assert.equal(cateringCat?.estimatedAmount, expectedProposed);
  });

  test("7. Reject a revision and verify that the original plan remains unchanged", () => {
    const input = getBaseInput("Reduce my budget by ₹2,00,000");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);
    assert.ok(proposal.id, "Proposal must be generated");

    // Simulate rejection by doing nothing (no applyPlanRevision call)
    // Verify storage still has original budget ₹8,00,000 and 200 guests
    const eventsInStore = getAllEvents();
    const eventInStore = eventsInStore.find((e) => e.id === testEvent.id);
    assert.equal(eventInStore?.totalBudget, 800000);
    assert.equal(eventInStore?.guestCount, 200);

    // Verify change history has no accepted record
    const history = getChangeHistoryForEvent(testEvent.id);
    assert.equal(history.length, 0);
  });

  test("8. Refresh the browser and verify that accepted changes persist in LocalStorage", () => {
    const input = getBaseInput("Increase my guest count from 200 to 230");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);
    applyPlanRevision(proposal);

    // Simulate complete page refresh: serialize, clear memory, read raw string
    const rawEvents = mockStorage.getItem("samaroh_sathi_events");
    assert.ok(rawEvents);
    const parsed = JSON.parse(rawEvents);
    const reloadedEvent = parsed.find((e: EventData) => e.id === testEvent.id);
    assert.equal(reloadedEvent.guestCount, 230);
  });

  test("9. Verify that budget calculations are performed deterministically by application logic", () => {
    const input = getBaseInput("Increase my guest count from 200 to 250");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);

    // Verify mathematical identity: proposedTotalEstimated = previousTotalEstimated + sum(differences)
    const sumDiffs = proposal.categoryDiffs.reduce((s, d) => s + d.difference, 0);
    assert.equal(
      proposal.budgetImpact.proposedTotalEstimated,
      proposal.budgetImpact.previousTotalEstimated + sumDiffs,
      "Proposed total must equal previous total plus sum of category differences"
    );

    assert.equal(
      proposal.budgetImpact.difference,
      sumDiffs,
      "Budget difference must strictly equal sum of category differences"
    );

    assert.equal(
      proposal.budgetImpact.proposedRemaining,
      proposal.budgetImpact.proposedBudget - proposal.budgetImpact.proposedTotalEstimated,
      "Remaining budget must strictly equal proposed budget minus proposed total estimated"
    );
  });

  test("10. Verify that unrelated tasks and expenses are preserved", () => {
    const input = getBaseInput("Increase my guest count from 200 to 250");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);

    // Verify unchanged counts
    assert.ok(proposal.affectedUnchangedSummary.unchangedCategoriesCount >= 8);
    assert.ok(proposal.affectedUnchangedSummary.unchangedTasksCount >= 5);
    assert.ok(proposal.affectedUnchangedSummary.summary.includes("remain completely unchanged"));
  });

  test("11. Test invalid AI responses and schema validation", () => {
    // Malformed AI output
    const malformed = {
      changeType: "invalid_type_here",
      explanation: "Short",
    };

    const parseResult = AIPlanRevisionResponseSchema.safeParse(malformed);
    assert.equal(parseResult.success, false, "Malformed AI revision output must fail Zod validation");

    // Missing required fields
    const invalidInput = {
      eventId: "",
      userRequest: "a",
    };
    const inputResult = PlanRevisionInputSchema.safeParse(invalidInput);
    assert.equal(inputResult.success, false, "Invalid revision input must fail Zod validation");
  });

  test("12. Verify that change history records accepted revisions correctly", () => {
    const input = getBaseInput("Increase my guest count from 200 to 250");
    const interpreted = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, interpreted);

    applyPlanRevision(proposal);

    const history = getChangeHistoryForEvent(testEvent.id);
    assert.equal(history.length, 1);
    assert.equal(history[0].changeType, "guest_count");
    assert.equal(history[0].status, "accepted");
    assert.ok(history[0].previousValue.includes("200"));
    assert.ok(history[0].newValue.includes("250"));
    assert.ok(history[0].explanation.length > 10);
    assert.ok(history[0].createdAt);
  });
});
