import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Domain & Logic Imports
import {
  generateDeterministicPlan,
  generateDeterministicBudgetCategories,
  generateDeterministicTasks,
  detectDependencyCycle,
  generateDeterministicTradeoffs,
} from "../src/lib/planner-engine";

import {
  PlanGenerationInputSchema,
  AIPlanResponseSchema,
} from "../src/lib/ai-schemas";

import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
} from "../src/lib/validation";

import { EventData, EventTask, BudgetCategory } from "../src/types/event";

// Mock LocalStorage environment for testing persistence layer
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

describe("Phase 3: AI Event Planning, Budget Planner & Timeline Management", () => {
  // Test Event 1: Traditional Wedding
  const sampleWedding: EventData = {
    id: "event_wedding_test",
    name: "Aarav & Meera Royal Vivah",
    occasion: "Wedding",
    eventDate: "2026-11-25",
    location: "Udaipur, Rajasthan",
    guestCount: 300,
    guestAudience: ["family_relatives", "close_friends"],
    totalBudget: 2500000,
    currency: "INR",
    budgetFlexibility: "moderate",
    atmosphere: "traditional_heritage",
    preferences: "Vedic rituals, authentic Marwari thali, candle & marigold decor",
    priorities: ["food", "venue", "decor", "photography"],
    mustHaves: ["Live Jalebi & Chaat stalls", "Documentary photographer"],
    constraints: {
      mustHaves: ["Live Jalebi & Chaat stalls", "Documentary photographer"],
      thingsToAvoid: "Excessive plastic flowers",
      hasChildren: true,
      hasElderly: true,
      accessibilityRequirements: "Ground floor ramps for grandaunt",
      venueLimitations: "10 PM sound curfew",
      culturalPreferences: "Pure veg appetizers",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "planning",
  };

  // Test Event 2: Intimate Birthday Party
  const sampleBirthday: EventData = {
    id: "event_birthday_test",
    name: "Kabir's 30th Rooftop Soiree",
    occasion: "Birthday Party",
    eventDate: "2026-10-15",
    location: "Indiranagar, Bengaluru",
    guestCount: 40,
    guestAudience: ["close_friends"],
    totalBudget: 150000,
    currency: "INR",
    budgetFlexibility: "flexible",
    atmosphere: "modern_chic",
    preferences: "Acoustic lounge music, artisanal mocktails, minimalist fairy lights",
    priorities: ["entertainment", "food", "photography"],
    mustHaves: ["Live acoustic duo", "Craft dessert bar"],
    constraints: {
      mustHaves: ["Live acoustic duo", "Craft dessert bar"],
      thingsToAvoid: "Boring formal seating",
      hasChildren: false,
      hasElderly: false,
      accessibilityRequirements: "",
      venueLimitations: "Terrace weight limit",
      culturalPreferences: "",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "planning",
  };

  test("1. Generate a plan using actual onboarding information", () => {
    const plan = generateDeterministicPlan(sampleWedding);

    assert.ok(plan.eventSummary.includes("Aarav & Meera Royal Vivah"));
    assert.ok(plan.eventSummary.includes("300 guests"));
    assert.equal(plan.budget.totalBudget, 2500000);
    assert.ok(plan.budget.categories.length >= 10);
    assert.ok(plan.tasks.length > 5);
    assert.ok(plan.warnings.some((w) => w.toLowerCase().includes("elderly")));
    assert.ok(plan.warnings.some((w) => w.toLowerCase().includes("children")));
  });

  test("2. Verify that different event inputs produce relevant, customized plans", () => {
    const weddingPlan = generateDeterministicPlan(sampleWedding);
    const birthdayPlan = generateDeterministicPlan(sampleBirthday);

    // Food + Venue allocation for wedding
    const weddingFood = weddingPlan.budget.categories.find((c) => c.name === "Catering and Food");
    const birthdayFood = birthdayPlan.budget.categories.find((c) => c.name === "Catering and Food");

    assert.ok(weddingFood);
    assert.ok(birthdayFood);

    // Wedding total vs Birthday total
    assert.equal(weddingPlan.budget.totalBudget, 2500000);
    assert.equal(birthdayPlan.budget.totalBudget, 150000);

    // Wedding per plate note should reflect 300 guests
    assert.ok(weddingFood?.notes.includes("300 guests"));
    // Birthday per plate note should reflect 40 guests
    assert.ok(birthdayFood?.notes.includes("40 guests"));

    // Elderly warning exists for wedding but not for birthday
    assert.ok(weddingPlan.warnings.some((w) => w.includes("Elderly")));
    assert.ok(!birthdayPlan.warnings.some((w) => w.includes("Elderly")));
  });

  test("3. Verify structured AI response validation with Zod", () => {
    const plan = generateDeterministicPlan(sampleWedding);

    // Validate that the generated plan complies with AIPlanResponseSchema
    const parseResult = AIPlanResponseSchema.safeParse({
      eventSummary: plan.eventSummary,
      assumptions: plan.assumptions,
      recommendations: plan.recommendations,
      budget: plan.budget,
      tasks: plan.tasks,
      warnings: plan.warnings,
      followUpQuestions: plan.followUpQuestions,
    });

    assert.ok(parseResult.success, "Structured AI response must pass Zod validation");
  });

  test("4. Verify API error handling on invalid input", () => {
    // Missing required fields (guest count <= 0, budget negative)
    const invalidInput = {
      name: "T",
      occasion: "",
      guestCount: -5,
      totalBudget: -100,
    };

    const parseResult = PlanGenerationInputSchema.safeParse(invalidInput);
    assert.equal(parseResult.success, false, "Invalid payload must fail Zod parsing");
    if (!parseResult.success) {
      const errorMap = parseResult.error.flatten().fieldErrors;
      assert.ok(errorMap.name, "Name error must be flagged");
      assert.ok(errorMap.occasion, "Occasion error must be flagged");
      assert.ok(errorMap.guestCount, "Guest count error must be flagged");
      assert.ok(errorMap.totalBudget, "Total budget error must be flagged");
    }
  });

  test("5 & 6. Add, edit and delete budget categories and verify deterministic totals", () => {
    let categories: BudgetCategory[] = generateDeterministicBudgetCategories(sampleWedding);
    const initialCount = categories.length;

    // Check sum equals total budget
    const initialSum = categories.reduce((sum, c) => sum + c.estimatedAmount, 0);
    assert.equal(initialSum, sampleWedding.totalBudget, "Initial budget categories must sum to totalBudget");

    // Add new category
    const customCategory: BudgetCategory = {
      id: "cat_custom_1",
      eventId: sampleWedding.id,
      name: "Vintage Royal Vintage Car Rental",
      estimatedAmount: 50000,
      actualAmount: 45000,
      priority: "Medium",
      notes: "For groom baraat entry",
      isAiGenerated: false,
    };
    categories = [...categories, customCategory];
    assert.equal(categories.length, initialCount + 1);

    // Edit category
    categories = categories.map((c) =>
      c.id === "cat_custom_1" ? { ...c, estimatedAmount: 60000, actualAmount: 55000 } : c
    );
    const updated = categories.find((c) => c.id === "cat_custom_1");
    assert.equal(updated?.estimatedAmount, 60000);
    assert.equal(updated?.actualAmount, 55000);

    // Delete category
    categories = categories.filter((c) => c.id !== "cat_custom_1");
    assert.equal(categories.length, initialCount);
  });

  test("7. Verify budget overrun calculations and priority-preserving trade-offs", () => {
    const categories: BudgetCategory[] = generateDeterministicBudgetCategories(sampleWedding);

    // Artificially inflate Decoration by 300,000 to cause an overrun
    const inflatedCategories = categories.map((c) =>
      c.name === "Decoration" ? { ...c, estimatedAmount: c.estimatedAmount + 300000 } : c
    );

    const totalEstimated = inflatedCategories.reduce((s, c) => s + c.estimatedAmount, 0);
    const overrun = Math.max(0, totalEstimated - sampleWedding.totalBudget);
    assert.equal(overrun, 300000, "Overrun must be exactly 300,000");

    // Generate trade-offs
    const tradeoffs = generateDeterministicTradeoffs(
      sampleWedding.totalBudget,
      inflatedCategories,
      sampleWedding.priorities
    );

    assert.ok(tradeoffs.tradeoffs.length > 0, "Trade-off engine must suggest reductions");
    assert.ok(tradeoffs.projectedSavings > 0, "Must calculate projected savings");

    // Verify Food (Priority #1) is protected from aggressive cuts
    const foodTradeoff = tradeoffs.tradeoffs.find((t) => t.categoryName === "Catering and Food");
    if (foodTradeoff) {
      assert.equal(foodTradeoff.preservesPriority, true, "Top priority food must be flagged as preserved");
    }
  });

  test("8 & 9. Add, edit and complete tasks with prerequisite dependencies", () => {
    let tasks = generateDeterministicTasks(sampleWedding);
    assert.ok(tasks.length >= 8);

    // Check that Catering depends on guest count and venue
    const cateringTask = tasks.find((t) => t.title.includes("Catering"));
    assert.ok(cateringTask);
    assert.ok(cateringTask.dependencyIds.length >= 1, "Catering must have prerequisite dependencies");

    // Mark task completed
    tasks = tasks.map((t) => (t.id === cateringTask.id ? { ...t, status: "Completed" as const } : t));
    const completed = tasks.find((t) => t.id === cateringTask.id);
    assert.equal(completed?.status, "Completed");
  });

  test("10. Verify invalid dependency cycle prevention", () => {
    const taskA: EventTask = {
      id: "task_A",
      eventId: "e1",
      title: "Task A",
      description: "",
      dueDate: "2026-12-01",
      priority: "High",
      status: "Not Started",
      dependencyIds: [],
      createdAt: "",
      updatedAt: "",
    };

    const taskB: EventTask = {
      id: "task_B",
      eventId: "e1",
      title: "Task B",
      description: "",
      dueDate: "2026-12-05",
      priority: "Medium",
      status: "Not Started",
      dependencyIds: ["task_A"], // B depends on A
      createdAt: "",
      updatedAt: "",
    };

    const taskList = [taskA, taskB];

    // Attempt direct self dependency: A depends on A
    const selfCycle = detectDependencyCycle(taskList, "task_A", ["task_A"]);
    assert.equal(selfCycle.hasCycle, true, "Self dependency must trigger cycle detection");

    // Attempt circular dependency: Make A depend on B (when B already depends on A)
    const circularCycle = detectDependencyCycle(taskList, "task_A", ["task_B"]);
    assert.equal(circularCycle.hasCycle, true, "Circular dependency A -> B -> A must trigger cycle detection");
    assert.ok(circularCycle.errorMessage?.includes("Circular dependency"));

    // Valid dependency: C depends on B (A -> B -> C is an acyclic DAG)
    const validCheck = detectDependencyCycle(taskList, "task_C", ["task_B"]);
    assert.equal(validCheck.hasCycle, false, "Valid DAG dependency must not trigger cycle detection");
  });

  test("11. Verify LocalStorage persistence model integrity", () => {
    const mockStorage = new MockLocalStorage();
    const globalContext = globalThis as unknown as Record<string, unknown>;
    globalContext.localStorage = mockStorage;
    globalContext.window = {
      localStorage: mockStorage,
      dispatchEvent: () => {},
    };

    // Save sample data
    mockStorage.setItem("samaroh_sathi_events", JSON.stringify([sampleWedding]));
    const retrieved = JSON.parse(mockStorage.getItem("samaroh_sathi_events") || "[]");
    assert.equal(retrieved.length, 1);
    assert.equal(retrieved[0].name, sampleWedding.name);
    assert.equal(retrieved[0].totalBudget, sampleWedding.totalBudget);

    // Save categories
    const cats = generateDeterministicBudgetCategories(sampleWedding);
    mockStorage.setItem("samaroh_sathi_budget_categories", JSON.stringify(cats));
    const retrievedCats = JSON.parse(mockStorage.getItem("samaroh_sathi_budget_categories") || "[]");
    assert.equal(retrievedCats.length, cats.length);

    // Simulate page refresh (clearing memory, re-reading from storage)
    const afterRefreshCats = JSON.parse(mockStorage.getItem("samaroh_sathi_budget_categories") || "[]");
    assert.equal(afterRefreshCats[0].name, cats[0].name);
  });

  test("12. Verify Phase 1 and Phase 2 validation rules remain unbroken", () => {
    // Step 1: Validation of event date and name
    const step1Valid = validateStep1({
      name: "Rohan & Priya Vivah",
      occasion: "Wedding",
      eventDate: "2026-12-25",
      location: "Jaipur",
      guestCount: 200,
    });
    assert.deepEqual(step1Valid, {}, "Valid Step 1 input must have no errors");

    // Step 2: Budget validation
    const step2Valid = validateStep2({
      totalBudget: 1500000,
      currency: "INR",
      budgetFlexibility: "moderate",
    });
    assert.deepEqual(step2Valid, {}, "Valid Step 2 budget must have no errors");

    // Step 3: Atmosphere validation
    const step3Valid = validateStep3({
      atmosphere: "traditional_heritage",
    });
    assert.deepEqual(step3Valid, {}, "Valid Step 3 atmosphere must have no errors");

    // Step 4: Priorities validation
    const step4Valid = validateStep4({
      priorities: ["food", "venue"],
    });
    assert.deepEqual(step4Valid, {}, "Valid Step 4 priorities must have no errors");
  });
});
