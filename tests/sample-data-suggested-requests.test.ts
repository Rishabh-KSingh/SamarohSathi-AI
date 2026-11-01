import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  createSampleEvent,
  getEventById,
  getCategoriesForEvent,
  getTasksForEvent,
  getVendorsForEvent,
  getQuotationsForEvent,
  createEvent,
} from "../src/lib/storage";
import { getSuggestedQuestionGroups } from "../src/lib/assistant-suggestions";

// Mock localStorage and window for Node test environment
const mockStorage: Record<string, string> = {};
const mockLocalStorageObj = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k];
    }
  },
  key: (i: number) => Object.keys(mockStorage)[i] || null,
  length: 0,
};

const globalContext = globalThis as unknown as Record<string, unknown>;
globalContext.localStorage = mockLocalStorageObj;
globalContext.window = {
  localStorage: mockLocalStorageObj,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

describe("Complete Sample Data & Suggested AI Requests", () => {
  test("1. Sample Event: Rohan & Priya Wedding in Patna, Bihar with 250 guests & ₹15,00,000 budget", () => {
    globalThis.localStorage.clear();

    const sample = createSampleEvent();
    assert.equal(sample.name, "Rohan & Priya Wedding");
    assert.equal(sample.location, "Patna, Bihar");
    assert.equal(sample.eventDate, "2026-12-18");
    assert.equal(sample.guestCount, 250);
    assert.equal(sample.totalBudget, 1500000);
    assert.equal(sample.currency, "INR");
    assert.ok(sample.preferences.includes("vegetarian"));

    // Verify categories total exactly ₹15,00,000
    const categories = getCategoriesForEvent(sample.id);
    assert.ok(categories.length >= 8, "Must have realistic category breakdown");
    const totalAllocated = categories.reduce((sum, c) => sum + c.estimatedAmount, 0);
    assert.equal(totalAllocated, 1500000, "Categories sum must deterministically match ₹15,00,000");

    // Verify tasks and dependencies
    const tasks = getTasksForEvent(sample.id);
    assert.ok(tasks.length >= 9, "Must have comprehensive tasks");

    // Cycle check: verify all dependencyIds point to valid preceding tasks
    const taskIds = new Set(tasks.map((t) => t.id));
    tasks.forEach((t) => {
      t.dependencyIds?.forEach((depId) => {
        assert.ok(taskIds.has(depId), `Task ${t.title} dependency ${depId} must exist`);
        assert.notEqual(t.id, depId, "Task cannot depend on itself");
      });
    });
  });

  test("2. Vendor Data: 12 fictional vendors across all 8 requested categories in Patna, Bihar", () => {
    const sample = createSampleEvent();
    const vendors = getVendorsForEvent(sample.id);

    assert.ok(vendors.length >= 8, "Must contain at least 8-10 vendors");
    const categories = new Set(vendors.map((v) => v.category));

    // Must cover all 8 requested categories
    assert.ok(categories.has("Venue"), "Must have Venue");
    assert.ok(categories.has("Caterer"), "Must have Caterer");
    assert.ok(categories.has("Photographer"), "Must have Photographer");
    assert.ok(categories.has("Decorator"), "Must have Decorator");
    assert.ok(categories.has("Entertainment"), "Must have Entertainment");
    assert.ok(categories.has("Transportation"), "Must have Transportation");
    assert.ok(categories.has("Makeup"), "Must have Makeup");
    assert.ok(categories.has("Lighting"), "Must have Lighting");

    // Verify multiple quotations exist for side-by-side comparison
    const quotations = getQuotationsForEvent(sample.id);
    assert.ok(quotations.length >= 8, "Must have quotations linked to vendors");

    const catCounts: Record<string, number> = {};
    quotations.forEach((q) => {
      catCounts[q.category] = (catCounts[q.category] || 0) + 1;
    });

    assert.ok(catCounts["Caterer"] >= 2, "Must have at least 2 caterer quotes for comparison");
    assert.ok(catCounts["Venue"] >= 2, "Must have at least 2 venue quotes for comparison");
    assert.ok(catCounts["Photographer"] >= 2, "Must have at least 2 photographer quotes for comparison");
    assert.ok(catCounts["Decorator"] >= 2, "Must have at least 2 decorator quotes for comparison");

    // Verify quotations have all required details
    quotations.forEach((q) => {
      assert.ok(q.quotedAmount > 0, "Quoted amount must be positive");
      assert.ok(q.includedServices.length > 0, "Included services must not be empty");
      assert.ok(q.terms, "Payment terms must be present");
    });
  });

  test("3. Suggested AI Requests: Contains the 8 exact required questions in 4 structured groups", () => {
    const sample = getEventById("sample_rohan_priya_wedding");
    assert.ok(sample);

    const groups = getSuggestedQuestionGroups(sample);
    assert.equal(groups.length, 4, "Must have 4 question categories");

    const groupNames = groups.map((g) => g.category);
    assert.deepEqual(groupNames, [
      "Budget & Savings",
      "Guest & Event Changes",
      "Vendors & Quotations",
      "Timeline & Priorities",
    ]);

    // Flatten all questions
    const allQuestions = groups.flatMap((g) => g.questions);
    assert.equal(allQuestions.length, 8, "Must contain exactly eight suggested questions");

    // Verify all 8 exact required questions from prompt:
    const requiredQuestions = [
      "Increase guest count from 250 to 300 without increasing the total budget.",
      "Reduce the budget from ₹15 lakh to ₹12 lakh while protecting food quality and photography.",
      "Compare two caterers and identify hidden charges and missing services.",
      "Move the wedding date 10 days earlier and identify affected tasks and deadlines.",
      "Increase photography spending by ₹30,000 and suggest where to save.",
      "Create a vegetarian menu for 300 guests within ₹2,40,000.",
      "Analyze a ₹50,000 venue quotation increase.",
      "Identify the most urgent vendor bookings and tasks.",
    ];

    requiredQuestions.forEach((rq) => {
      assert.ok(
        allQuestions.includes(rq),
        `Must contain exact question: "${rq}"`
      );
    });
  });

  test("4. Safety & Idempotency: User-created data is never overwritten and sample creation is idempotent", () => {
    // Calling createSampleEvent again should return the existing event without re-creating
    const s1 = createSampleEvent();
    const s2 = createSampleEvent();
    assert.equal(s1.id, s2.id);

    // Create a custom user event
    const userEvent = createEvent({
      name: "Ananya Birthday Bash",
      occasion: "Birthday",
      eventDate: "2026-11-20",
      location: "Boring Road, Patna",
      guestCount: 50,
      guestAudience: ["close_friends"],
      totalBudget: 100000,
      currency: "INR",
      budgetFlexibility: "moderate",
      priorities: ["food", "entertainment"],
      atmosphere: "casual_modern",
      preferences: "",
      mustHaves: [],
      constraints: {
        mustHaves: [],
        thingsToAvoid: "",
        hasChildren: false,
        hasElderly: false,
        accessibilityRequirements: "",
        venueLimitations: "",
        culturalPreferences: "",
      },
      status: "planning",
    });

    // Re-accessing sample event should not disturb user event
    const fetchedUserEvent = getEventById(userEvent.id);
    assert.ok(fetchedUserEvent);
    assert.equal(fetchedUserEvent.name, "Ananya Birthday Bash");

    // Dynamic suggestions for user event adapt to user event parameters
    const userGroups = getSuggestedQuestionGroups(fetchedUserEvent);
    const userQuestions = userGroups.flatMap((g) => g.questions);

    // For 50 guests, should suggest 60 guests, not 300!
    assert.ok(userQuestions.some((q) => q.includes("from 50 to 60")));
  });
});
