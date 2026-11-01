import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  createEvent,
  getEventById,
  saveCategoriesForEvent,
  getCategoriesForEvent,
  saveTasksForEvent,
  getTasksForEvent,
  addVendor,
  addQuotation,
  getQuotationsForEvent,
  applyPlanRevision,
} from "../src/lib/storage";
import { generateDeterministicPlan, generateDeterministicTradeoffs } from "../src/lib/planner-engine";
import { interpretPlanChangeDeterministically, constructRevisionProposal } from "../src/lib/revision-engine";
import { generateDeterministicQuotationComparison, generateDeterministicVendorQuestions } from "../src/lib/vendor-engine";
import { safeExtractJSON } from "../src/lib/gemini";
import { AIPlanResponseSchema } from "../src/lib/ai-schemas";
import { formatCurrency, formatNumber, clamp, safeParseJSON } from "../src/lib/utils";
import { BudgetCategory, EventTask, VendorQuotation, SpendingPriorityKey, EventData } from "../src/types/event";

// Mock localStorage and window environment for Node.js test runner
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

describe("Comprehensive E2E Workflow & Edge-Case Audit Suite", () => {
  const eventId = "ev_test_e2e_full_lifecycle";

  test("1. Full Event Lifecycle: Create Event -> Plan -> Budget -> Tasks", () => {
    mockLocalStorageObj.clear();

    const created = createEvent({
      name: "Kabir & Ananya Sangeet & Vivah",
      occasion: "Wedding",
      eventDate: "2026-12-28",
      location: "Varanasi, Uttar Pradesh",
      guestCount: 200,
      guestAudience: ["family_relatives", "close_friends"],
      totalBudget: 1200000,
      currency: "INR",
      budgetFlexibility: "moderate",
      priorities: ["food", "photography", "venue"],
      atmosphere: "traditional_heritage",
      preferences: "Strictly vegetarian Banarasi delicacies",
      mustHaves: ["Shehnai vadak at Ganga ghat entrance"],
      constraints: {
        mustHaves: ["Shehnai vadak at Ganga ghat entrance"],
        thingsToAvoid: "Loud Western DJ during rituals",
        hasChildren: true,
        hasElderly: true,
        accessibilityRequirements: "Ghat ramp access",
        venueLimitations: "Riverside sound regulations after 10 PM",
        culturalPreferences: "Traditional Vedic vidhi",
      },
      status: "planning",
    });

    assert.ok(created.id);
    const fetched = getEventById(created.id);
    assert.ok(fetched);
    assert.equal(fetched.name, "Kabir & Ananya Sangeet & Vivah");

    // Generate initial plan using deterministic engine
    const initialPlan = generateDeterministicPlan(fetched);
    assert.ok(initialPlan.budget.categories.length > 0);

    // Verify budget allocations total exactly the total budget
    const totalAllocated = initialPlan.budget.categories.reduce((sum, c) => sum + c.estimatedAmount, 0);
    assert.equal(totalAllocated, 1200000, "Allocated amounts must match total budget exactly");

    // Verify top priority (food) gets dominant allocation
    const foodCat = initialPlan.budget.categories.find((c) => c.name.toLowerCase().includes("food") || c.name.toLowerCase().includes("catering"));
    assert.ok(foodCat);
    assert.ok(foodCat.estimatedAmount >= 300000, "Priority category must receive dominant allocation");

    // Persist budget categories and tasks
    const categories: BudgetCategory[] = initialPlan.budget.categories.map((c, i) => ({
      id: `cat_${i}`,
      eventId: created.id,
      name: c.name,
      estimatedAmount: c.estimatedAmount,
      actualAmount: 0,
      priority: c.priority,
      notes: c.notes || "",
    }));
    saveCategoriesForEvent(created.id, categories);

    const savedCats = getCategoriesForEvent(created.id);
    assert.equal(savedCats.length, categories.length);

    // Save tasks with dependencies
    const nowIso = new Date().toISOString();
    const tasks: EventTask[] = initialPlan.tasks.map((t, idx) => ({
      id: `task_${idx}`,
      eventId: created.id,
      title: t.title,
      description: t.description,
      category: "Planning",
      priority: t.priority,
      status: "Not Started",
      dueDate: t.dueDate,
      dependencies: idx > 0 ? [`task_${idx - 1}`] : [],
      dependencyIds: idx > 0 ? [`task_${idx - 1}`] : [],
      createdAt: nowIso,
      updatedAt: nowIso,
    }));
    saveTasksForEvent(created.id, tasks);

    const savedTasks = getTasksForEvent(created.id);
    assert.equal(savedTasks.length, tasks.length);
  });

  test("2. Vendor Management & Side-by-Side Quotation Comparison", () => {
    // Add two competing caterers
    const v1 = addVendor(eventId, {
      name: "Ganga Ghat Shahi Rasoi",
      category: "Caterer",
      contactDetails: {
        phone: "+91 94310 99001",
        email: "shahi@gangarasoi-example.in",
        contactPerson: "Pandit Radhe Mohan",
        address: "Assi Ghat, Varanasi",
      },
      requirements: "200 pax traditional vegetarian spread",
      notes: "Known for authentic Banarasi kachori-jalebi and satvik thali",
      status: "Quotation Received",
    });

    const v2 = addVendor(eventId, {
      name: "Banaras Modern Buffet & Live Counters",
      category: "Caterer",
      contactDetails: {
        phone: "+91 94310 99002",
        email: "contact@banarasmodern-example.in",
        contactPerson: "Vikas Agrawal",
        address: "Cantt Road, Varanasi",
      },
      requirements: "200 pax vegetarian buffet",
      notes: "Lower base price but beverages and live counter staff billed separately",
      status: "Quotation Received",
    });

    const q1: Omit<VendorQuotation, "id" | "createdAt" | "updatedAt"> = {
      vendorId: v1.id,
      vendorName: v1.name,
      eventId,
      category: "Caterer",
      quotedAmount: 380000,
      guestCoverage: 200,
      includedServices: [
        "Welcome thandai and mocktail bar",
        "4 Live interactive sweet and chaat counters",
        "Silver-plated crockery and 1:20 staffing ratio",
        "Continuous bottled mineral water",
      ],
      additionalCharges: [],
      terms: "18% GST all-inclusive; 30% advance on booking.",
      missingInformation: [],
      notes: "All-inclusive transparent quotation.",
    };

    const q2: Omit<VendorQuotation, "id" | "createdAt" | "updatedAt"> = {
      vendorId: v2.id,
      vendorName: v2.name,
      eventId,
      category: "Caterer",
      quotedAmount: 320000,
      guestCoverage: 160, // Shortfall in coverage
      includedServices: ["Standard buffet line (2 paneer, dal, bread, 2 sweets)"],
      additionalCharges: [
        "Extra guest plates at ₹1,800/pax above 160",
        "18% GST extra on total invoice",
        "Packaged water and beverage dispensers extra",
      ],
      terms: "50% non-refundable advance.",
      missingInformation: ["Live stall menu specifics", "Cleanup logistics"],
      notes: "Deceptive base price with multiple unbundled charges.",
    };

    addQuotation(q1);
    addQuotation(q2);

    const quotations = getQuotationsForEvent(eventId);
    assert.equal(quotations.length, 2);

    // Run deterministic quotation comparison
    const comparison = generateDeterministicQuotationComparison({
      eventId,
      category: "Caterer",
      guestCount: 200,
      quotations,
      categoryBudget: 400000,
      userPriorities: ["food", "venue"],
      userRequirements: "200 pax vegetarian",
    });

    assert.ok(comparison.comparisonSummary.length > 0);
    assert.ok(comparison.additionalChargesAnalysis.length > 0);
    // Best value should pick v1 because v2 has guest shortfall and unbundled GST/extras
    assert.equal(
      comparison.recommendation.vendorName,
      v1.name,
      "Deterministic engine must recommend all-inclusive quote over deceptively cheap quote"
    );
  });

  test("3. Adaptive Plan Revision: Natural Language Interpretation & Human Confirmation", () => {
    const existing = getEventById(eventId);
    const event: EventData = existing || createEvent({
      name: "Kabir & Ananya Sangeet & Vivah",
      occasion: "Wedding",
      eventDate: "2026-12-28",
      location: "Varanasi",
      guestCount: 200,
      guestAudience: ["family_relatives"],
      totalBudget: 1200000,
      currency: "INR",
      budgetFlexibility: "moderate",
      priorities: ["food", "photography"],
      atmosphere: "traditional_heritage",
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

    const currentCats = getCategoriesForEvent(event.id);
    const currentTasks = getTasksForEvent(event.id);

    // Request: Increase guests from 200 to 250 without blowing total budget
    const revisionInput = {
      eventId: event.id,
      currentEvent: event,
      currentCategories: currentCats,
      currentTasks,
      userRequest: "Increase guest count from 200 to 250 guests while keeping food high priority.",
    };

    const interpreted = interpretPlanChangeDeterministically(revisionInput);
    assert.equal(interpreted.changeType, "guest_count");
    assert.equal(interpreted.requiresClarification, false);
    assert.equal(interpreted.proposedEventChanges?.guestCount, 250);

    const proposal = constructRevisionProposal(revisionInput, interpreted);
    assert.ok(proposal.id);
    assert.ok(proposal.eventChanges?.guestCount);
    assert.equal(proposal.eventChanges.guestCount.proposed, 250);

    // Proposal Acceptance: Commit changes to storage
    const applyResult = applyPlanRevision(proposal);
    assert.ok(applyResult.event);
    assert.equal(applyResult.event.guestCount, 250);

    const updatedEvent = getEventById(event.id);
    assert.equal(updatedEvent?.guestCount, 250, "Accepted revision must update stored event guest count");
  });

  test("4. Safe JSON Extraction with Markdown Fences, Quoted Braces & Trailing Prose", () => {
    const validPlanPayload = {
      eventSummary: "Grand Vedic wedding celebration in Varanasi.",
      assumptions: [
        "All ceremonies conducted according to Vedic rituals.",
        "Catering includes {satvik} fasting options and live {banarasi} chaat stalls.",
      ],
      recommendations: ["Book riverside ghat venue 6 months in advance."],
      budget: {
        totalBudget: 1500000,
        categories: [
          {
            name: "Catering",
            estimatedAmount: 450000,
            priority: "High" as const,
            notes: "Multi-course feast with {traditional} copper serveware",
          },
        ],
      },
      tasks: [
        {
          title: "Confirm Pandit Ji and muhurat",
          category: "Planning",
          priority: "High" as const,
          dueDate: "2026-11-01",
          description: "Align on auspicious timings.",
          status: "Not Started" as const,
          dependencyIds: [],
        },
      ],
      warnings: ["Late night loudspeaker curfew applies."],
      followUpQuestions: ["Would you like a morning shehnai troupe?"],
    };

    // Test case 1: Clean JSON
    const clean = JSON.stringify(validPlanPayload);
    const parsedClean = safeExtractJSON(clean, AIPlanResponseSchema);
    assert.equal(parsedClean.eventSummary, validPlanPayload.eventSummary);

    // Test case 2: Wrapped in ```json ... ``` code fence
    const fenced = `\`\`\`json\n${JSON.stringify(validPlanPayload)}\n\`\`\``;
    const parsedFenced = safeExtractJSON(fenced, AIPlanResponseSchema);
    assert.equal(parsedFenced.eventSummary, validPlanPayload.eventSummary);

    // Test case 3: Leading explanation prose before JSON
    const prose = `Here is the requested celebration plan in JSON format:\n\n\`\`\`json\n${JSON.stringify(validPlanPayload)}\n\`\`\`\nHope this helps!`;
    const parsedProse = safeExtractJSON(prose, AIPlanResponseSchema);
    assert.equal(parsedProse.eventSummary, validPlanPayload.eventSummary);

    // Test case 4: Trailing commentary with curly braces and brackets
    const proseWithTrailingBraces = `Below is your customized blueprint:\n${JSON.stringify(validPlanPayload)}\n\nIMPORTANT: Review {appendix-A} and [guidelines-2026] before {contract-signing}.`;
    const parsedTrailingBraces = safeExtractJSON(proseWithTrailingBraces, AIPlanResponseSchema);
    assert.equal(parsedTrailingBraces.eventSummary, validPlanPayload.eventSummary);
    assert.equal(parsedTrailingBraces.assumptions[1], "Catering includes {satvik} fasting options and live {banarasi} chaat stalls.");

    // Test case 5: Braces inside string values without code fences
    const jsonWithQuotedBraces = JSON.stringify({
      ...validPlanPayload,
      eventSummary: "Celebration with {special} floral and {heritage} lighting requirements.",
    });
    const parsedQuotedBraces = safeExtractJSON(jsonWithQuotedBraces, AIPlanResponseSchema);
    assert.equal(parsedQuotedBraces.eventSummary, "Celebration with {special} floral and {heritage} lighting requirements.");

    // Test case 6: Nested JSON structures with arrays and objects
    const nestedData = {
      eventSummary: "Deeply nested test",
      assumptions: ["Nested {1}", "Nested {2}"],
      recommendations: ["R1"],
      budget: {
        totalBudget: 500000,
        categories: [
          { name: "Decor", estimatedAmount: 200000, priority: "High" as const, notes: "Decor with {marigold}" },
          { name: "Sound", estimatedAmount: 100000, priority: "Low" as const, notes: "Sound with {acoustics}" },
        ],
      },
      tasks: [
        {
          title: "Book {sound} engineer",
          category: "Planning",
          priority: "High" as const,
          dueDate: "2026-11-01",
          description: "Align on {audio} setup",
          status: "Not Started" as const,
          dependencyIds: [],
        },
      ],
      warnings: [],
      followUpQuestions: [],
    };
    const parsedNested = safeExtractJSON(`Pre-text\n${JSON.stringify(nestedData)}\nPost-text with {brace}`, AIPlanResponseSchema);
    assert.equal(parsedNested.budget.categories.length, 2);

    // Test case 7: Malformed JSON throws catchable error rather than crashing
    assert.throws(() => {
      safeExtractJSON("Not JSON at all", AIPlanResponseSchema);
    });

    // Test case 8: Incomplete / truncated JSON throws catchable error
    assert.throws(() => {
      safeExtractJSON('{"eventSummary": "Incomplete plan', AIPlanResponseSchema);
    });

    // Test case 9: Schema validation violation throws error
    assert.throws(() => {
      safeExtractJSON('{"unknownField": 123}', AIPlanResponseSchema);
    });
  });

  test("5. Utility Functions: formatCurrency, formatNumber, clamp, safeParseJSON", () => {
    // Currency formatting
    assert.equal(formatCurrency(1500000), "₹15,00,000");
    assert.equal(formatCurrency(0), "₹0");
    assert.equal(formatCurrency(null as unknown as number), "₹0");
    assert.equal(formatCurrency(NaN), "₹0");

    // Number formatting
    assert.equal(formatNumber(250), "250");
    assert.equal(formatNumber(125000), "1,25,000");

    // Clamp bounds
    assert.equal(clamp(50, 0, 100), 50);
    assert.equal(clamp(-10, 0, 100), 0);
    assert.equal(clamp(150, 0, 100), 100);

    // Safe JSON parsing
    assert.deepEqual(safeParseJSON('{"a": 1}', {}), { a: 1 });
    assert.deepEqual(safeParseJSON('invalid json', { fallback: true }), { fallback: true });
    assert.deepEqual(safeParseJSON(null, []), []);
  });

  test("6. Edge Cases: Budget Overrun Trade-offs & Category Checks", () => {
    const categories: BudgetCategory[] = [
      { id: "c1", eventId: "ev_test_overrun", name: "Venue", estimatedAmount: 550000, actualAmount: 0, priority: "High", notes: "" },
      { id: "c2", eventId: "ev_test_overrun", name: "Decoration", estimatedAmount: 250000, actualAmount: 0, priority: "Low", notes: "" },
    ];
    const priorities: SpendingPriorityKey[] = ["venue"];

    // Overrun: totalEstimated = 800000, totalBudget = 600000 -> 200000 overrun
    const tradeoffs = generateDeterministicTradeoffs(600000, categories, priorities);

    assert.ok(tradeoffs);
    assert.ok(tradeoffs.tradeoffs.length > 0);
    assert.ok(tradeoffs.projectedSavings > 0);

    // Vendor questions generation handles empty requirements safely
    const questions = generateDeterministicVendorQuestions({
      category: "Decorator",
      eventType: "Anniversary",
      guestCount: 50,
      budget: 50000,
      requirements: "",
    });

    assert.ok(questions.questions.length >= 3);
    assert.ok(questions.tips.length >= 2);
  });
});
