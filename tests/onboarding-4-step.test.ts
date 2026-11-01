import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { WIZARD_STEPS } from "../src/lib/constants";
import {
  validateStep,
} from "../src/lib/validation";
import { createEvent } from "../src/lib/storage";
import { OnboardingFormData } from "../src/types/event";

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

describe("Updated 4-Step Onboarding Flow", () => {
  test("1. WIZARD_STEPS contains exactly 4 steps: Basics, Budget, Priorities, Review", () => {
    assert.equal(WIZARD_STEPS.length, 4, "Must contain exactly 4 steps");

    assert.equal(WIZARD_STEPS[0].step, 1);
    assert.equal(WIZARD_STEPS[0].shortTitle, "Basics");

    assert.equal(WIZARD_STEPS[1].step, 2);
    assert.equal(WIZARD_STEPS[1].shortTitle, "Budget");

    assert.equal(WIZARD_STEPS[2].step, 3);
    assert.equal(WIZARD_STEPS[2].shortTitle, "Priorities");

    assert.equal(WIZARD_STEPS[3].step, 4);
    assert.equal(WIZARD_STEPS[3].shortTitle, "Review");

    // Verify Experience & Constraints steps are completely removed
    const shortTitles = WIZARD_STEPS.map((s) => s.shortTitle);
    assert.equal(shortTitles.includes("Experience"), false);
    assert.equal(shortTitles.includes("Constraints"), false);
  });

  test("2. Validation operates on 4 steps without atmosphere or constraints required", () => {
    const validData: Partial<OnboardingFormData> = {
      name: "Sneha & Varun Reception",
      occasion: "Reception",
      eventDate: "2026-12-30",
      location: "Bengaluru",
      guestCount: 180,
      guestAudience: ["family_relatives", "close_friends"],
      totalBudget: 1200000,
      currency: "INR",
      budgetFlexibility: "moderate",
      priorities: ["food", "venue", "photography"],
    };

    // Step 1 check
    const step1Result = validateStep(1, validData);
    assert.equal(step1Result.isValid, true);

    // Step 2 check
    const step2Result = validateStep(2, validData);
    assert.equal(step2Result.isValid, true);

    // Step 3 (Priorities) check
    const step3Result = validateStep(3, validData);
    assert.equal(step3Result.isValid, true);

    // Step 4 (Review) check - validates steps 1-3
    const step4Result = validateStep(4, validData);
    assert.equal(step4Result.isValid, true, "Review step must pass without atmosphere or constraints");
  });

  test("3. Validation catches missing fields on individual steps", () => {
    // Missing event name on step 1
    const step1Invalid = validateStep(1, { name: "" });
    assert.equal(step1Invalid.isValid, false);
    assert.ok(step1Invalid.errors.name);

    // Missing budget on step 2
    const step2Invalid = validateStep(2, { totalBudget: "" });
    assert.equal(step2Invalid.isValid, false);
    assert.ok(step2Invalid.errors.totalBudget);

    // Missing priorities on step 3
    const step3Invalid = validateStep(3, { priorities: [] });
    assert.equal(step3Invalid.isValid, false);
    assert.ok(step3Invalid.errors.priorities);
  });

  test("4. Event creation preserves backward compatibility with safe defaults", () => {
    globalThis.localStorage.clear();

    const created = createEvent({
      name: "Aarav Upanayana Sanskar",
      occasion: "Festival Celebration",
      eventDate: "2026-11-28",
      location: "Pune, Maharashtra",
      guestCount: 120,
      guestAudience: ["family_relatives"],
      totalBudget: 400000,
      currency: "INR",
      budgetFlexibility: "fixed",
      atmosphere: "traditional_heritage",
      preferences: "",
      priorities: ["food", "hospitality"],
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

    assert.ok(created.id);
    assert.equal(created.name, "Aarav Upanayana Sanskar");
    assert.equal(created.totalBudget, 400000);
    assert.ok(created.atmosphere, "Default atmosphere preserved for downstream planner");
    assert.ok(created.constraints, "Constraints structure preserved for downstream planner");
  });
});
