import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  generateDeterministicVendorQuestions,
  generateDeterministicQuotationComparison,
} from "../src/lib/vendor-engine";

import {
  VendorQuestionRequestSchema,
  VendorQuestionResponseSchema,
  QuotationComparisonRequestSchema,
  QuotationComparisonResponseSchema,
} from "../src/lib/ai-schemas";

import {
  createEvent,
  getVendorsForEvent,
  addVendor,
  updateVendor,
  deleteVendor,
  getQuotationsForEvent,
  getQuotationsForCategory,
  addQuotation,
  updateQuotation,
  deleteQuotation,
  getCategoriesForEvent,
  saveCategoriesForEvent,
  updateCategory,
} from "../src/lib/storage";

import {
  generateDeterministicPlan,
  generateDeterministicBudgetCategories,
} from "../src/lib/planner-engine";

import {
  interpretPlanChangeDeterministically,
  constructRevisionProposal,
} from "../src/lib/revision-engine";

import { EventData, BudgetCategory } from "../src/types/event";

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

describe("Phase 5: Vendor Management & Quotation Comparison", () => {
  let mockStorage: MockLocalStorage;
  let testEvent: EventData;
  let testCategories: BudgetCategory[];

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    const globalContext = globalThis as unknown as Record<string, unknown>;
    globalContext.localStorage = mockStorage;
    globalContext.window = {
      localStorage: mockStorage,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    const initialEvent = createEvent({
      name: "Aditi & Kabir Wedding Celebration",
      occasion: "Wedding",
      eventDate: "2026-12-20",
      location: "Jaipur, Rajasthan",
      guestCount: 220,
      guestAudience: ["family_relatives", "close_friends"],
      totalBudget: 1500000,
      currency: "INR",
      budgetFlexibility: "moderate",
      atmosphere: "traditional_heritage",
      preferences: "Warm hospitality, authentic live Rajasthani food stalls, floral mandap, candid photography.",
      priorities: ["food", "venue", "decor", "photography"],
      mustHaves: ["Live Chaat counter", "Fresh marigold mandap"],
      constraints: {
        mustHaves: ["Live Chaat counter", "Fresh marigold mandap"],
        thingsToAvoid: "Loud EDM music during rituals",
        hasChildren: true,
        hasElderly: true,
        accessibilityRequirements: "Ramps for grandparents",
        venueLimitations: "Sound curfew at 10:30 PM",
        culturalPreferences: "Traditional Vedic timing",
      },
      status: "planning",
    });

    testEvent = initialEvent;
    testCategories = generateDeterministicBudgetCategories(initialEvent);
    saveCategoriesForEvent(initialEvent.id, testCategories);
  });

  test("1. Add, edit and delete vendors", () => {
    // Add vendor
    const vendor = addVendor(testEvent.id, {
      name: "Royal Shahi Rasoi Catering",
      category: "Caterer",
      contactDetails: {
        phone: "+91 98290 12345",
        email: "info@royalrasoi.com",
        contactPerson: "Chef Vikram Rathore",
        address: "MI Road, Jaipur",
      },
      requirements: "220 pax high-grade vegetarian banquet with 4 live interactive counters.",
      notes: "Tasting conducted; superb Dal Baati Churma.",
      status: "Researching",
    });

    assert.ok(vendor.id, "Vendor should have a generated ID");
    assert.equal(vendor.name, "Royal Shahi Rasoi Catering");
    assert.equal(vendor.status, "Researching");

    // Verify stored
    const vendors = getVendorsForEvent(testEvent.id);
    assert.equal(vendors.length, 1);

    // Edit vendor
    const updated = updateVendor(vendor.id, {
      status: "Selected",
      notes: "Advance terms finalized with Chef Vikram.",
    });

    assert.ok(updated);
    assert.equal(updated.status, "Selected");
    assert.equal(updated.notes, "Advance terms finalized with Chef Vikram.");

    // Delete vendor
    const deleted = deleteVendor(vendor.id);
    assert.equal(deleted, true);
    assert.equal(getVendorsForEvent(testEvent.id).length, 0);
  });

  test("2. Add multiple quotations for the same category", () => {
    const v1 = addVendor(testEvent.id, {
      name: "Royal Shahi Rasoi Catering",
      category: "Caterer",
      contactDetails: { phone: "+91 98290 11111" },
      requirements: "Full buffet with live counters",
      notes: "Top tier",
      status: "Quotation Received",
    });

    const v2 = addVendor(testEvent.id, {
      name: "Classic Banquet Foodworks",
      category: "Caterer",
      contactDetails: { phone: "+91 98100 22222" },
      requirements: "Standard buffet",
      notes: "Budget caterer",
      status: "Quotation Received",
    });

    // Add Quote 1
    const q1 = addQuotation({
      vendorId: v1.id,
      vendorName: v1.name,
      eventId: testEvent.id,
      category: "Caterer",
      quotedAmount: 420000,
      guestCoverage: 220,
      includedServices: [
        "4 Live interactive food stalls",
        "North & South Indian dinner buffet with 5 desserts",
        "Welcome royal mocktails & continuous mineral water",
        "Premium bone china crockery and 1:25 server staffing ratio",
      ],
      additionalCharges: [],
      terms: "25% advance, 50% event day, 25% post-event. 18% GST all-inclusive.",
      missingInformation: [],
      notes: "All-inclusive quote for full 220 guest count.",
    });

    // Add Quote 2
    const q2 = addQuotation({
      vendorId: v2.id,
      vendorName: v2.name,
      eventId: testEvent.id,
      category: "Caterer",
      quotedAmount: 340000,
      guestCoverage: 180,
      includedServices: ["Standard vegetarian buffet", "Melamine crockery"],
      additionalCharges: [
        "18% GST extra on invoice",
        "Beverages billed per crate on consumption",
        "Extra guest plates over 180 billed at ₹2,100/pax",
      ],
      terms: "50% non-refundable advance required.",
      missingInformation: ["Live counters not included", "Service staff ratio unspecified"],
      notes: "Looks cheaper upfront, but coverage deficit (180 vs 220) and hidden GST.",
    });

    assert.ok(q1.id);
    assert.ok(q2.id);

    const categoryQuotes = getQuotationsForCategory(testEvent.id, "Caterer");
    assert.equal(categoryQuotes.length, 2);
  });

  test("3. Edit and delete quotations", () => {
    const v = addVendor(testEvent.id, {
      name: "Vedic Frames Studio",
      category: "Photographer",
      contactDetails: {},
      requirements: "Photo & Video",
      notes: "",
      status: "Contacted",
    });

    const quote = addQuotation({
      vendorId: v.id,
      vendorName: v.name,
      eventId: testEvent.id,
      category: "Photographer",
      quotedAmount: 180000,
      guestCoverage: 220,
      includedServices: ["2 Candid Photographers", "Traditional Cinematography"],
      additionalCharges: [],
      terms: "30% booking advance",
      missingInformation: [],
      notes: "",
    });

    // Edit
    const updated = updateQuotation(quote.id, {
      quotedAmount: 165000,
      includedServices: [
        "2 Candid Photographers",
        "Traditional Cinematography",
        "Drone coverage included",
      ],
    });

    assert.ok(updated);
    assert.equal(updated.quotedAmount, 165000);
    assert.equal(updated.includedServices.length, 3);

    // Delete
    const deleted = deleteQuotation(quote.id);
    assert.equal(deleted, true);
    assert.equal(getQuotationsForEvent(testEvent.id).length, 0);
  });

  test("4. Compare quotations with deterministic fallback engine", () => {
    const quotations = [
      {
        id: "q1",
        vendorName: "Royal Shahi Rasoi Catering",
        quotedAmount: 420000,
        guestCoverage: 220,
        includedServices: [
          "4 Live interactive food stalls",
          "Multi-course dinner buffet",
          "Welcome mocktails & mineral water",
          "Premium bone china crockery & 1:25 staff ratio",
        ],
        additionalCharges: [],
        terms: "25% advance, 50% event day, 25% post-event. 18% GST all-inclusive.",
        missingInformation: [],
        notes: "All-inclusive quote",
      },
      {
        id: "q2",
        vendorName: "Classic Banquet Foodworks",
        quotedAmount: 340000,
        guestCoverage: 180,
        includedServices: ["Standard buffet", "Melamine crockery"],
        additionalCharges: [
          "18% GST extra on final invoice",
          "Soft beverages billed on consumption",
          "Additional plates over 180 at ₹2,100/pax",
        ],
        terms: "50% non-refundable advance.",
        missingInformation: ["Live counters omitted", "Staff ratio not specified"],
        notes: "Coverage deficit",
      },
    ];

    const result = generateDeterministicQuotationComparison({
      eventId: testEvent.id,
      category: "Caterer",
      guestCount: 220,
      categoryBudget: 450000,
      quotations,
      userPriorities: ["food", "venue"],
      userRequirements: "High quality live food counters",
    });

    assert.ok(result.comparisonSummary.length > 20);
    assert.ok(result.quotationDifferences.length > 0);
    assert.ok(result.advantages["Royal Shahi Rasoi Catering"]);
    assert.ok(result.disadvantages["Classic Banquet Foodworks"]);
    assert.ok(result.recommendation.vendorName);
  });

  test("5. Handle missing quotation information", () => {
    const quotations = [
      {
        id: "q1",
        vendorName: "Transparent Decorators",
        quotedAmount: 200000,
        guestCoverage: 220,
        includedServices: ["Mandap decor", "Entrance arch", "Fairy lights"],
        additionalCharges: [],
        terms: "Written cancellation and refund policy provided.",
        missingInformation: [],
        notes: "",
      },
      {
        id: "q2",
        vendorName: "Vague Decorators",
        quotedAmount: 180000,
        guestCoverage: 0, // Missing guest coverage!
        includedServices: ["Basic stage"],
        additionalCharges: [],
        terms: "", // Missing terms!
        missingInformation: [
          "Flower freshness type not stated",
          "Teardown and transport labour unquoted",
        ],
        notes: "",
      },
    ];

    const result = generateDeterministicQuotationComparison({
      eventId: testEvent.id,
      category: "Decorator",
      guestCount: 220,
      quotations,
      userPriorities: ["decor"],
      userRequirements: "Fresh flower mandap",
    });

    // Verify missing information is identified
    assert.ok(
      result.missingInformationAlerts.some(
        (m) => m.includes("Vague Decorators") || m.includes("missing") || m.includes("coverage")
      ),
      "Missing information should be highlighted in alerts"
    );
  });

  test("6. Verify additional charges and hidden surcharges are identified", () => {
    const quotations = [
      {
        id: "q1",
        vendorName: "Heritage Banquet Palace",
        quotedAmount: 500000,
        guestCoverage: 220,
        includedServices: ["Hall rental", "Centralized AC", "100% DG generator backup"],
        additionalCharges: [],
        terms: "All taxes included",
        missingInformation: [],
        notes: "",
      },
      {
        id: "q2",
        vendorName: "Budget Community Hall",
        quotedAmount: 380000,
        guestCoverage: 220,
        includedServices: ["Bare hall space"],
        additionalCharges: [
          "Generator diesel charged extra at ₹750/hour",
          "Outside caterer royalty fee of ₹35,000",
          "18% GST extra",
        ],
        terms: "Cleaning deposit extra",
        missingInformation: [],
        notes: "",
      },
    ];

    const result = generateDeterministicQuotationComparison({
      eventId: testEvent.id,
      category: "Venue",
      guestCount: 220,
      quotations,
      userPriorities: ["venue"],
      userRequirements: "AC and power backup",
    });

    assert.ok(
      result.additionalChargesAnalysis.some((a) =>
        a.includes("Budget Community Hall") && a.includes("Generator diesel")
      ),
      "Additional charges should be detailed in the analysis"
    );
  });

  test("7. Verify the cheapest quotation is NOT automatically recommended when value is inferior", () => {
    // Quote A: Cheaper upfront (₹3,40,000) but covers only 180 guests (40 guest deficit!), has 3 hidden charges, missing live stalls.
    // Quote B: ₹4,20,000 covers full 220 guests, 4 live stalls, transparent terms, all-inclusive GST.
    const quotations = [
      {
        id: "q_cheap",
        vendorName: "Incomplete Caterers",
        quotedAmount: 340000,
        guestCoverage: 180,
        includedServices: ["Basic buffet"],
        additionalCharges: ["18% GST extra", "Beverages billed on consumption", "Overage plate charges ₹2,100/pax"],
        terms: "",
        missingInformation: ["No live stalls", "Staff ratio unspecified"],
        notes: "Cheapest upfront price",
      },
      {
        id: "q_value",
        vendorName: "Royal Shahi Rasoi",
        quotedAmount: 420000,
        guestCoverage: 220,
        includedServices: [
          "4 Live food counters",
          "Royal mocktails & water",
          "Multi-course banquet",
          "Bone china crockery & 1:25 staff ratio",
        ],
        additionalCharges: [],
        terms: "18% GST all-inclusive. Transparent milestone terms.",
        missingInformation: [],
        notes: "Full value package",
      },
    ];

    const result = generateDeterministicQuotationComparison({
      eventId: testEvent.id,
      category: "Caterer",
      guestCount: 220,
      categoryBudget: 450000,
      quotations,
      userPriorities: ["food"],
      userRequirements: "Live chaat counters and drinks",
    });

    // The recommendation MUST NOT be the cheapest quotation!
    assert.equal(
      result.recommendation.vendorName,
      "Royal Shahi Rasoi",
      "Recommendation should choose the superior value quotation (Royal Shahi Rasoi), NOT the cheapest one"
    );

    assert.ok(
      result.recommendation.rationale.includes("superior") ||
        result.recommendation.rationale.includes("value") ||
        result.recommendation.rationale.includes("coverage"),
      "Rationale should articulate value over price"
    );
  });

  test("8. Generate relevant vendor questions for multiple categories", () => {
    // Venue Questions
    const venueQuestions = generateDeterministicVendorQuestions({
      eventType: "Wedding",
      guestCount: 220,
      budget: 1500000,
      category: "Venue",
      requirements: "AC banquet hall with lawn",
    });

    assert.ok(venueQuestions.questions.length >= 5);
    assert.ok(
      venueQuestions.questions.some((q) =>
        q.question.toLowerCase().includes("generator") || q.question.toLowerCase().includes("electricity")
      ),
      "Venue questions must address generator/electricity charges"
    );
    assert.ok(
      venueQuestions.questions.some((q) =>
        q.question.toLowerCase().includes("cutoff") || q.question.toLowerCase().includes("sound")
      ),
      "Venue questions must address sound cutoff timings"
    );

    // Caterer Questions
    const catererQuestions = generateDeterministicVendorQuestions({
      eventType: "Wedding",
      guestCount: 220,
      budget: 1500000,
      category: "Caterer",
      requirements: "Chaat counter and mocktails",
    });

    assert.ok(catererQuestions.questions.length >= 5);
    assert.ok(
      catererQuestions.questions.some((q) =>
        q.question.toLowerCase().includes("per-plate") || q.question.toLowerCase().includes("minimum guaranteed")
      ),
      "Caterer questions must address per-plate and MG count"
    );
    assert.ok(
      catererQuestions.questions.some((q) =>
        q.question.toLowerCase().includes("mineral water") || q.question.toLowerCase().includes("beverage")
      ),
      "Caterer questions must address beverage inclusion"
    );

    // Photographer Questions
    const photoQuestions = generateDeterministicVendorQuestions({
      eventType: "Wedding",
      guestCount: 220,
      budget: 1500000,
      category: "Photographer",
      requirements: "Candid and drone coverage",
    });

    assert.ok(
      photoQuestions.questions.some((q) =>
        q.question.toLowerCase().includes("raw") || q.question.toLowerCase().includes("rushes")
      ),
      "Photographer questions must address raw footage rights"
    );
  });

  test("9. Formatted interview questions structure", () => {
    const qResp = generateDeterministicVendorQuestions({
      eventType: "Wedding",
      guestCount: 220,
      budget: 1500000,
      category: "Decorator",
      requirements: "Fresh marigolds and fairy lights",
    });

    qResp.questions.forEach((q) => {
      assert.ok(q.question.length > 10, "Question text must be descriptive");
      assert.ok(q.purpose.length > 10, "Purpose must explain why host needs to ask this");
      assert.ok(q.category.length > 0, "Question category must be present");
    });
  });

  test("10. Connect quotations to budget categories", () => {
    const cateringCat = testCategories.find((c) =>
      c.name.toLowerCase().includes("catering") || c.name.toLowerCase().includes("food")
    );
    assert.ok(cateringCat, "Catering category should exist in test event");

    const v = addVendor(testEvent.id, {
      name: "Royal Shahi Rasoi",
      category: "Caterer",
      contactDetails: {},
      requirements: "",
      notes: "",
      status: "Quotation Received",
    });

    const quote = addQuotation({
      vendorId: v.id,
      vendorName: v.name,
      eventId: testEvent.id,
      category: "Caterer",
      budgetCategoryId: cateringCat.id,
      quotedAmount: 420000,
      guestCoverage: 220,
      includedServices: ["Live stalls", "Buffet"],
      additionalCharges: [],
      terms: "18% GST all-inclusive",
      missingInformation: [],
      notes: "",
    });

    assert.equal(quote.budgetCategoryId, cateringCat.id);

    // Verify retrieval
    const quotes = getQuotationsForEvent(testEvent.id);
    const matched = quotes.find((q) => q.budgetCategoryId === cateringCat.id);
    assert.ok(matched);
    assert.equal(matched.quotedAmount, 420000);
  });

  test("11. Verify budget calculations remain correct and deterministic", () => {
    const cateringCat = testCategories.find((c) =>
      c.name.toLowerCase().includes("catering") || c.name.toLowerCase().includes("food")
    )!;

    const originalEstimated = cateringCat.estimatedAmount;
    const originalActual = cateringCat.actualAmount;
    assert.equal(cateringCat.actualAmount, originalActual);

    // Adding a quotation MUST NOT silently change estimatedAmount or totalBudget
    const v = addVendor(testEvent.id, {
      name: "Royal Shahi Rasoi",
      category: "Caterer",
      contactDetails: {},
      requirements: "",
      notes: "",
      status: "Selected",
    });

    const quote = addQuotation({
      vendorId: v.id,
      vendorName: v.name,
      eventId: testEvent.id,
      category: "Caterer",
      budgetCategoryId: cateringCat.id,
      quotedAmount: 420000,
      guestCoverage: 220,
      includedServices: ["Live stalls"],
      additionalCharges: [],
      terms: "",
      missingInformation: [],
      notes: "",
    });

    // Check categories again: estimated must remain unchanged!
    const reloadedCats = getCategoriesForEvent(testEvent.id);
    const catCheck = reloadedCats.find((c) => c.id === cateringCat.id)!;
    assert.equal(
      catCheck.estimatedAmount,
      originalEstimated,
      "Adding a quotation must not modify the category estimated amount"
    );

    // Voluntary application to actual expense: updates actualAmount, leaves estimated intact
    updateCategory(cateringCat.id, {
      actualAmount: quote.quotedAmount,
    });

    const afterApply = getCategoriesForEvent(testEvent.id).find((c) => c.id === cateringCat.id)!;
    assert.equal(afterApply.actualAmount, 420000);
    assert.equal(afterApply.estimatedAmount, originalEstimated);
  });

  test("12. Refresh and verify persistence in LocalStorage", () => {
    addVendor(testEvent.id, {
      name: "Vedic Frames Studio",
      category: "Photographer",
      contactDetails: { phone: "+91 99999 88888" },
      requirements: "Candid shoot",
      notes: "Shortlisted",
      status: "Shortlisted",
    });

    // Simulate page refresh / new context
    const vendorsAfterReload = getVendorsForEvent(testEvent.id);
    assert.equal(vendorsAfterReload.length, 1);
    assert.equal(vendorsAfterReload[0].name, "Vedic Frames Studio");
    assert.equal(vendorsAfterReload[0].contactDetails.phone, "+91 99999 88888");
  });

  test("13. Test invalid AI responses and schema validation", () => {
    // Valid vendor question response schema validation
    const validQuestions = {
      category: "Venue",
      questions: [
        { question: "What is the maximum indoor capacity?", purpose: "Avoid overcrowding", category: "Capacity" },
        { question: "Is generator fuel included?", purpose: "Prevent surprise bills", category: "Cost" },
        { question: "What is the sound cutoff timing?", purpose: "Sound compliance", category: "Rules" },
      ],
      tips: ["Inspect venue in person"],
    };
    const parseResult0 = VendorQuestionResponseSchema.safeParse(validQuestions);
    assert.equal(parseResult0.success, true);

    // Invalid vendor question input (missing required fields)
    const invalidQuestionInput = {
      eventType: "",
      guestCount: -5,
      budget: -100,
      category: "InvalidCategory",
    };
    const parseResult1 = VendorQuestionRequestSchema.safeParse(invalidQuestionInput);
    assert.equal(parseResult1.success, false);

    // Invalid quotation comparison input (only 1 quotation instead of minimum 2)
    const invalidCompInput = {
      eventId: "e1",
      category: "Venue",
      guestCount: 100,
      quotations: [
        {
          id: "q1",
          vendorName: "Single Quote",
          quotedAmount: 100000,
          guestCoverage: 100,
          includedServices: ["Hall"],
        },
      ],
    };
    const parseResult2 = QuotationComparisonRequestSchema.safeParse(invalidCompInput);
    assert.equal(parseResult2.success, false);

    // Valid comparison schema validation
    const validCompResponse = {
      comparisonSummary: "Thorough comparison between two premier celebration caterers.",
      quotationDifferences: ["Price differs by ₹80,000", "Live stalls included in Quote 1"],
      advantages: { "Vendor 1": ["Live counters"], "Vendor 2": ["Lower base price"] },
      disadvantages: { "Vendor 1": ["Higher price"], "Vendor 2": ["Missing GST and drinks"] },
      additionalChargesAnalysis: ["18% GST extra in Vendor 2"],
      missingInformationAlerts: ["Vendor 2 omitted MG count"],
      questionsToAsk: ["Is GST all-inclusive?"],
      recommendation: {
        vendorName: "Vendor 1",
        quotationId: "q1",
        rationale: "Superior overall value due to live counters and full guest coverage.",
        valueAssessment: "Best peace-of-mind ratio.",
      },
      assumptions: ["Prices valid for 30 days"],
      warnings: ["Verify GST in writing before booking"],
    };

    const parseResult3 = QuotationComparisonResponseSchema.safeParse(validCompResponse);
    assert.equal(parseResult3.success, true);
  });

  test("14. Verify Phase 1 through Phase 4 functionality remains intact", () => {
    // Phase 1 & 2: Event creation and validation
    assert.ok(testEvent.id);
    assert.equal(testEvent.occasion, "Wedding");

    // Phase 3: Deterministic Plan Generation
    const plan = generateDeterministicPlan(testEvent);
    assert.ok(plan.eventSummary);
    assert.ok(plan.budget.categories.length >= 8);
    assert.ok(plan.tasks.length >= 10);

    // Phase 4: Plan Revision Engine
    const revisionInput = {
      eventId: testEvent.id,
      userRequest: "Increase guest count from 220 to 260",
      currentEvent: testEvent,
      currentCategories: testCategories,
      currentTasks: [],
    };
    const revision = interpretPlanChangeDeterministically(revisionInput);
    assert.equal(revision.changeType, "guest_count");
    assert.equal(revision.proposedEventChanges?.guestCount, 260);

    const proposal = constructRevisionProposal(revisionInput, revision);
    assert.equal(proposal.eventChanges?.guestCount?.proposed, 260);
  });
});
