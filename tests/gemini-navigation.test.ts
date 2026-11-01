import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { checkGeminiHealth, getGeminiModel, proposePlanRevisionWithGemini } from "../src/lib/gemini";
import { navigationItems } from "../src/components/layout/sidebar";
import {
  createEvent,
  getVendorsForEvent,
  deleteVendor,
  getQuotationsForEvent,
} from "../src/lib/storage";
import { EventData } from "../src/types/event";

// Mock localStorage and window for Node test runner
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

describe("Task 1, 2, 3 & 4: Navigation, Vendor Data & Gemini AI Integration", () => {
  test("Task 1: Sidebar navigation contains exactly 7 items without 'Create Event'", () => {
    assert.equal(navigationItems.length, 7);

    const names = navigationItems.map((item) => item.name);
    assert.deepEqual(names, [
      "Dashboard",
      "AI Assistant",
      "My Events",
      "Budget Planner",
      "Timeline & Tasks",
      "Vendors",
      "Settings",
    ]);

    // Ensure 'Create Event' is strictly excluded from sidebar
    assert.equal(names.includes("Create Event"), false);
    assert.equal(names.includes("Create New Event"), false);
  });

  test("Task 2: Realistic vendor seeding is idempotent and supports deletion without unwanted re-seeding", () => {
    globalThis.localStorage.clear();
    const mockEvent: EventData = {
      id: "ev_test_seeding_101",
      name: "Radhika & Siddharth Royal Wedding",
      occasion: "Wedding",
      eventDate: "2026-12-15",
      location: "Jaipur, Rajasthan",
      guestCount: 220,
      guestAudience: ["family_relatives", "close_friends"],
      totalBudget: 1500000,
      currency: "INR",
      budgetFlexibility: "moderate",
      atmosphere: "Royal & Traditional",
      preferences: "Rich Rajasthani hospitality",
      priorities: ["food", "venue", "photography"],
      mustHaves: ["Live Chaat counters"],
      constraints: {
        mustHaves: ["Live Chaat counters"],
        thingsToAvoid: "Plastic cutlery",
        hasChildren: true,
        hasElderly: true,
        accessibilityRequirements: "Wheelchair ramp at dining pavilion",
        venueLimitations: "Sound curfew at 10:00 PM",
        culturalPreferences: "Satvik catering options",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "planning",
    };

    createEvent(mockEvent);

    // Initial get should seed 12 realistic Indian vendors
    const seeded = getVendorsForEvent(mockEvent.id);
    assert.equal(seeded.length, 12, "Should initialize exactly 12 realistic Indian vendors");

    // Check categories present across 6 core categories
    const categories = new Set(seeded.map((v) => v.category));
    assert.ok(categories.has("Venue"));
    assert.ok(categories.has("Caterer"));
    assert.ok(categories.has("Photographer"));
    assert.ok(categories.has("Decorator"));
    assert.ok(categories.has("Entertainment"));
    assert.ok(categories.has("Transportation"));

    // Check quotations seeded for immediate comparison
    const quotes = getQuotationsForEvent(mockEvent.id);
    assert.ok(quotes.length >= 4, "Should initialize comparison quotations for Caterer, Venue, etc.");

    // Idempotency: Calling getVendorsForEvent again does NOT duplicate records
    const secondCall = getVendorsForEvent(mockEvent.id);
    assert.equal(secondCall.length, 12, "Should not duplicate vendors on subsequent calls");

    // Deletion: If a user deletes a vendor, it stays deleted and does not resurrect
    const firstVendorId = seeded[0].id;
    const deleted = deleteVendor(firstVendorId);
    assert.equal(deleted, true);

    const afterDelete = getVendorsForEvent(mockEvent.id);
    assert.equal(afterDelete.length, 11, "Vendor count should be 11 after 1 deletion");
    assert.ok(!afterDelete.some((v) => v.id === firstVendorId));
  });

  test("Task 3 & 4: Gemini model defaults to gemini-2.5-flash and checkGeminiHealth reports missing key safely", async () => {
    // Test model helper
    const originalKey = process.env.GEMINI_API_KEY;
    const originalModel = process.env.GEMINI_MODEL;

    delete process.env.GEMINI_MODEL;
    assert.equal(getGeminiModel(), "gemini-2.5-flash");

    process.env.GEMINI_MODEL = "gemini-2.5-pro";
    assert.equal(getGeminiModel(), "gemini-2.5-pro");

    // Restore or clear
    if (originalModel) {
      process.env.GEMINI_MODEL = originalModel;
    } else {
      delete process.env.GEMINI_MODEL;
    }

    // Test health check when key is missing or placeholder
    delete process.env.GEMINI_API_KEY;
    const healthMissing = await checkGeminiHealth();
    assert.equal(healthMissing.status, "missing_key");
    assert.ok(healthMissing.message.includes("GEMINI_API_KEY"));

    process.env.GEMINI_API_KEY = "your_gemini_api_key_here";
    const healthPlaceholder = await checkGeminiHealth();
    assert.equal(healthPlaceholder.status, "missing_key");

    // Restore original key if any
    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });

  test("Task 3: Deterministic fallback engine is used when GEMINI_API_KEY is not configured", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const mockEvent: EventData = {
      id: "ev_test_revision_102",
      name: "Sangeet Night",
      occasion: "Sangeet",
      eventDate: "2026-11-20",
      location: "Mumbai",
      guestCount: 150,
      guestAudience: ["close_friends"],
      totalBudget: 600000,
      currency: "INR",
      budgetFlexibility: "fixed",
      atmosphere: "Festive & Vibrant",
      preferences: "Lively music and dance",
      priorities: ["entertainment", "food"],
      mustHaves: ["Top DJ"],
      constraints: {
        mustHaves: ["Top DJ"],
        thingsToAvoid: "Slow music",
        hasChildren: false,
        hasElderly: false,
        accessibilityRequirements: "",
        venueLimitations: "10 PM sound curfew",
        culturalPreferences: "Bollywood hits",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "planning",
    };

    const res = await proposePlanRevisionWithGemini({
      eventId: mockEvent.id,
      userRequest: "Increase guest count from 150 to 180",
      currentEvent: mockEvent,
      currentCategories: [
        {
          id: "cat_cater",
          name: "Catering and Food",
          estimatedAmount: 300000,
          actualAmount: 0,
          priority: "High",
          notes: "Buffet dinner",
        },
      ],
      currentTasks: [],
    });

    assert.equal(res.source, "deterministic-fallback");
    assert.ok(res.proposal);
    assert.equal(res.proposal.eventChanges?.guestCount?.proposed, 180);

    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  });
});
