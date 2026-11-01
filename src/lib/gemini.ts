import { GoogleGenAI } from "@google/genai";
import {
  AIPlanResponseSchema,
  AIPlanResponse,
  PlanGenerationInput,
  BudgetTradeoffRequest,
  BudgetTradeoffResponseSchema,
  BudgetTradeoffResponse,
  PlanRevisionInput,
  AIPlanRevisionResponseSchema,
  VendorQuestionRequest,
  VendorQuestionResponse,
  VendorQuestionResponseSchema,
  QuotationComparisonRequest,
  QuotationComparisonResponseSchema,
} from "@/lib/ai-schemas";
import {
  generateDeterministicPlan,
  generateDeterministicTradeoffs,
} from "@/lib/planner-engine";
import {
  interpretPlanChangeDeterministically,
  constructRevisionProposal,
} from "@/lib/revision-engine";
import {
  generateDeterministicVendorQuestions,
  generateDeterministicQuotationComparison,
} from "@/lib/vendor-engine";
import {
  EventData,
  BudgetCategory,
  GuestAudienceType,
  SpendingPriorityKey,
  PlanRevisionProposal,
  QuotationComparisonResult,
} from "@/types/event";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export interface GeminiHealthStatus {
  status: "connected" | "missing_key" | "invalid_key" | "error";
  model: string;
  message: string;
}

export async function checkGeminiHealth(): Promise<GeminiHealthStatus> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = getGeminiModel();

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return {
      status: "missing_key",
      model,
      message: "GEMINI_API_KEY is not configured in environment. System will utilize deterministic planning fallbacks.",
    };
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model,
      contents: "Reply with the single word: OK",
    });

    if (response.text) {
      return {
        status: "connected",
        model,
        message: "Gemini API connected and responsive.",
      };
    } else {
      return {
        status: "error",
        model,
        message: "Empty response received from Gemini test probe.",
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isInvalid =
      errorMsg.includes("API key not valid") ||
      errorMsg.includes("API_KEY_INVALID") ||
      errorMsg.includes("403") ||
      errorMsg.includes("400");

    return {
      status: isInvalid ? "invalid_key" : "error",
      model,
      message: isInvalid
        ? "Configured GEMINI_API_KEY is invalid or unauthorized."
        : `Connection failed: ${errorMsg.slice(0, 150)}`,
    };
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Server-side AI Event Plan Generator using Gemini 2.5 Flash with fallback
 */
export async function generateAIEventPlan(
  input: PlanGenerationInput
): Promise<{ plan: AIPlanResponse; source: "gemini" | "deterministic-fallback" }> {
  const client = getGeminiClient();

  // If no API key is configured, immediately use deterministic domain planner
  if (!client) {
    const fallbackEvent: EventData = {
      id: input.id || `event_${Date.now()}`,
      name: input.name,
      occasion: input.occasion,
      eventDate: input.eventDate,
      location: input.location,
      guestCount: input.guestCount,
      guestAudience: (input.guestAudience || []) as GuestAudienceType[],
      totalBudget: input.totalBudget,
      currency: input.currency || "INR",
      budgetFlexibility: input.budgetFlexibility,
      atmosphere: input.atmosphere,
      preferences: input.preferences || "",
      priorities: input.priorities as SpendingPriorityKey[],
      mustHaves: input.mustHaves || [],
      constraints: {
        mustHaves: input.constraints?.mustHaves || input.mustHaves || [],
        thingsToAvoid: input.constraints?.thingsToAvoid || "",
        hasChildren: !!input.constraints?.hasChildren,
        hasElderly: !!input.constraints?.hasElderly,
        accessibilityRequirements: input.constraints?.accessibilityRequirements || "",
        venueLimitations: input.constraints?.venueLimitations || "",
        culturalPreferences: input.constraints?.culturalPreferences || "",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "planning",
    };

    const deterministic = generateDeterministicPlan(fallbackEvent);
    return {
      plan: {
        eventSummary: deterministic.eventSummary,
        assumptions: deterministic.assumptions,
        recommendations: deterministic.recommendations || [],
        budget: deterministic.budget,
        tasks: deterministic.tasks,
        warnings: deterministic.warnings,
        followUpQuestions: deterministic.followUpQuestions,
      },
      source: "deterministic-fallback",
    };
  }

  // Gemini API is configured: construct prompt adhering to PRD requirements
  const systemInstruction = `You are SamarohSathi AI, a distinguished master Indian celebration planner.
Your goal is to generate a realistic, culturally sensitive, personalized event blueprint adhering to all user constraints.

CRITICAL RULES:
1. Respect the user's budget exactly: sum of category estimates should be close or equal to the total available budget (${input.currency} ${input.totalBudget}).
2. Respect the user's ranked priorities: allocate larger shares to categories the user marked as high priority (${input.priorities.join(", ")}).
3. Always include these standard categories:
   - Venue
   - Catering and Food
   - Decoration
   - Photography and Videography
   - Entertainment
   - Invitations
   - Transportation
   - Accommodation
   - Miscellaneous
   - Emergency Reserve
4. Never invent confirmed vendor prices. Label notes clearly: "Estimated — based on planning assumptions. Confirm with the vendor before booking."
5. Generate actionable, sequential tasks with logical dependencies (e.g. catering and decor depend on venue confirmation, invites depend on venue and date).
6. Prevent dependency cycles. Each task must have a dueDate in YYYY-MM-DD format (before or on the event date ${input.eventDate}).
7. Include practical Indian celebration warnings (quiet hours, catering permits, elderly accessibility if specified).
8. Return ONLY valid JSON adhering strictly to the schema provided.`;

  const userPrompt = `Generate a personalized celebration plan for:
Event Name: ${input.name}
Occasion: ${input.occasion}
Date: ${input.eventDate}
Location: ${input.location}
Guest Count: ${input.guestCount}
Total Budget: ${input.currency} ${input.totalBudget}
Budget Flexibility: ${input.budgetFlexibility}
Atmosphere: ${input.atmosphere}
User Vision & Preferences: ${input.preferences || "None specified"}
Ranked Spending Priorities: ${input.priorities.join(", ")}
Must-Haves: ${input.mustHaves?.join(", ") || "None"}
Constraints:
- Things to avoid: ${input.constraints?.thingsToAvoid || "None"}
- Elderly guests: ${input.constraints?.hasElderly ? "Yes (requires seating and accessibility considerations)" : "No"}
- Children: ${input.constraints?.hasChildren ? "Yes (requires safety and kid-friendly provisions)" : "No"}
- Venue limitations: ${input.constraints?.venueLimitations || "None"}
- Cultural preferences: ${input.constraints?.culturalPreferences || "None"}

Generate JSON with:
- eventSummary (string)
- assumptions (array of strings)
- recommendations (array of strings)
- budget: { totalBudget (number), categories: [{ name, estimatedAmount, priority ("High"|"Medium"|"Low"), notes }] }
- tasks: [{ title, description, dueDate (YYYY-MM-DD), priority ("High"|"Medium"|"Low"), status ("Not Started"), dependencyIds: [] }]
- warnings (array of strings)
- followUpQuestions (array of strings)`;

  try {
    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedJson = JSON.parse(text);
    const validated = AIPlanResponseSchema.parse(parsedJson);

    return {
      plan: validated,
      source: "gemini",
    };
  } catch (error) {
    console.error("Gemini API call failed or response validation failed, falling back to deterministic planner:", error);

    // Fallback to deterministic plan
    const fallbackEvent: EventData = {
      id: input.id || `event_${Date.now()}`,
      name: input.name,
      occasion: input.occasion,
      eventDate: input.eventDate,
      location: input.location,
      guestCount: input.guestCount,
      guestAudience: (input.guestAudience || []) as GuestAudienceType[],
      totalBudget: input.totalBudget,
      currency: input.currency || "INR",
      budgetFlexibility: input.budgetFlexibility,
      atmosphere: input.atmosphere,
      preferences: input.preferences || "",
      priorities: input.priorities as SpendingPriorityKey[],
      mustHaves: input.mustHaves || [],
      constraints: {
        mustHaves: input.constraints?.mustHaves || input.mustHaves || [],
        thingsToAvoid: input.constraints?.thingsToAvoid || "",
        hasChildren: !!input.constraints?.hasChildren,
        hasElderly: !!input.constraints?.hasElderly,
        accessibilityRequirements: input.constraints?.accessibilityRequirements || "",
        venueLimitations: input.constraints?.venueLimitations || "",
        culturalPreferences: input.constraints?.culturalPreferences || "",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "planning",
    };

    const deterministic = generateDeterministicPlan(fallbackEvent);
    return {
      plan: {
        eventSummary: deterministic.eventSummary,
        assumptions: deterministic.assumptions,
        recommendations: deterministic.recommendations || [],
        budget: deterministic.budget,
        tasks: deterministic.tasks,
        warnings: deterministic.warnings,
        followUpQuestions: deterministic.followUpQuestions,
      },
      source: "deterministic-fallback",
    };
  }
}

/**
 * Server-side AI Budget Trade-off Explanations using Gemini with deterministic fallback
 */
export async function generateAIBudgetTradeoffs(
  input: BudgetTradeoffRequest
): Promise<BudgetTradeoffResponse & { source: "gemini" | "deterministic-fallback" }> {
  const client = getGeminiClient();

  if (!client) {
    const fallbackCategories: BudgetCategory[] = input.currentExpenses.map((c, i) => ({
      id: c.id || `cat_${i}`,
      eventId: input.eventId,
      name: c.name,
      estimatedAmount: c.estimatedAmount,
      actualAmount: 0,
      priority: c.priority,
      notes: c.notes || "",
    }));

    const result = generateDeterministicTradeoffs(
      input.totalBudget,
      fallbackCategories,
      input.priorities as SpendingPriorityKey[]
    );

    return {
      summary: result.summary,
      tradeoffs: result.tradeoffs,
      projectedTotal: result.projectedTotal,
      projectedSavings: result.projectedSavings,
      advice: result.advice,
      source: "deterministic-fallback",
    };
  }

  const systemInstruction = `You are SamarohSathi AI, an expert celebration financial advisor.
The user's estimated expenses currently exceed their total budget.
Suggest practical, respectful trade-offs to bring estimated expenses within or close to the total budget.
DO NOT cut high-priority categories equally. Preserve the user's top priorities (${input.priorities.join(", ")}).
Recommend reductions in flexible, non-essential categories (e.g. digital invites, seasonal flowers, simplified bar/entertainment).
Return structured JSON matching:
{
  "summary": string,
  "tradeoffs": [
    {
      "categoryName": string,
      "currentEstimate": number,
      "suggestedEstimate": number,
      "savings": number,
      "reasoning": string,
      "preservesPriority": boolean
    }
  ],
  "projectedTotal": number,
  "projectedSavings": number,
  "advice": string
}`;

  const prompt = `Total Available Budget: ₹${input.totalBudget}
Current Estimated Total: ₹${input.totalBudget + input.overrunAmount}
Overrun Amount: ₹${input.overrunAmount}
User Top Priorities: ${input.priorities.join(", ")}
Current Category Allocations:
${JSON.stringify(input.currentExpenses, null, 2)}`;

  try {
    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const parsedJson = JSON.parse(text);
    const validated = BudgetTradeoffResponseSchema.parse(parsedJson);

    return {
      ...validated,
      source: "gemini",
    };
  } catch (error) {
    console.error("Gemini trade-offs generation failed, falling back to deterministic engine:", error);

    const fallbackCategories: BudgetCategory[] = input.currentExpenses.map((c, i) => ({
      id: c.id || `cat_${i}`,
      eventId: input.eventId,
      name: c.name,
      estimatedAmount: c.estimatedAmount,
      actualAmount: 0,
      priority: c.priority,
      notes: c.notes || "",
    }));

    const result = generateDeterministicTradeoffs(
      input.totalBudget,
      fallbackCategories,
      input.priorities as SpendingPriorityKey[]
    );

    return {
      summary: result.summary,
      tradeoffs: result.tradeoffs,
      projectedTotal: result.projectedTotal,
      projectedSavings: result.projectedSavings,
      advice: result.advice,
      source: "deterministic-fallback",
    };
  }
}

/**
 * Server-side Adaptive Plan Revision Engine using Gemini 2.5 Flash with fallback
 */
export async function proposePlanRevisionWithGemini(
  input: PlanRevisionInput
): Promise<{ proposal: PlanRevisionProposal; source: "gemini" | "deterministic-fallback" }> {
  const client = getGeminiClient();

  if (!client) {
    const fallbackResponse = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, fallbackResponse);
    return {
      proposal,
      source: "deterministic-fallback",
    };
  }

  const systemInstruction = `You are SamarohSathi AI, an expert adaptive Indian celebration revision advisor.
Your role is to interpret natural language plan changes for an EXISTING celebration.

CRITICAL RULES:
1. Do not treat this as a brand new event. Respect existing categories, tasks, and constraints.
2. Only propose changes to what is directly affected by the user's request. Keep unrelated categories and tasks untouched.
3. If the user wants to reduce budget, protect high-priority categories (${input.currentEvent.priorities.join(", ")}) and suggest cuts in flexible categories.
4. If the user changes guest count, adjust catering proportionally and check venue capacity notes.
5. If the request is ambiguous or critical details are missing, set "requiresClarification": true and provide a "clarificationQuestion".
6. Return ONLY structured JSON adhering strictly to:
{
  "changeType": "guest_count" | "budget" | "event_date" | "priorities" | "venue" | "catering" | "decor" | "entertainment" | "general",
  "requiresClarification": boolean,
  "clarificationQuestion": string | null,
  "explanation": string,
  "assumptions": string[],
  "warnings": string[],
  "proposedEventChanges": {
    "guestCount"?: number,
    "totalBudget"?: number,
    "eventDate"?: string,
    "location"?: string,
    "priorities"?: string[]
  },
  "proposedCategoryAdjustments": [
    { "categoryName": string, "proposedEstimated": number, "reasoning": string }
  ],
  "proposedTaskAdjustments": [
    { "taskId"?: string, "title": string, "action": "updated" | "added" | "shifted", "proposedDueDate": string, "reasoning": string, "priority"?: "High" | "Medium" | "Low" }
  ]
}`;

  const prompt = `Current Event Context:
- Name: ${input.currentEvent.name}
- Occasion: ${input.currentEvent.occasion}
- Date: ${input.currentEvent.eventDate}
- Location: ${input.currentEvent.location}
- Guest Count: ${input.currentEvent.guestCount}
- Total Budget: ${input.currentEvent.currency} ${input.currentEvent.totalBudget}
- Top Priorities: ${input.currentEvent.priorities.join(", ")}

Current Budget Categories:
${JSON.stringify(input.currentCategories, null, 2)}

Current Tasks:
${JSON.stringify(input.currentTasks, null, 2)}

User's Requested Change:
"${input.userRequest}"`;

  try {
    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini API");

    const parsedJson = JSON.parse(text);
    const validated = AIPlanRevisionResponseSchema.parse(parsedJson);

    // Run deterministic application calculations on AI proposal
    const proposal = constructRevisionProposal(input, validated);

    return {
      proposal,
      source: "gemini",
    };
  } catch (error) {
    console.error("Gemini plan revision failed, falling back to deterministic revision engine:", error);

    const fallbackResponse = interpretPlanChangeDeterministically(input);
    const proposal = constructRevisionProposal(input, fallbackResponse);

    return {
      proposal,
      source: "deterministic-fallback",
    };
  }
}

/**
 * Server-side Vendor Question Preparation using Gemini 2.5 Flash with fallback
 */
export async function generateVendorQuestionsWithGemini(
  input: VendorQuestionRequest
): Promise<{ result: VendorQuestionResponse; source: "gemini" | "deterministic-fallback" }> {
  const client = getGeminiClient();

  if (!client) {
    const deterministic = generateDeterministicVendorQuestions(input);
    return {
      result: deterministic,
      source: "deterministic-fallback",
    };
  }

  const systemInstruction = `You are an elite Indian celebration procurement and vendor coordination advisor for SamarohSathi AI.
Your goal is to prepare insightful, domain-specific interview questions for the user to ask potential event vendors before signing contracts or transferring advances.

CRITICAL RULES:
1. Questions must be sharply tailored to the specific category (${input.category}) and context (${input.eventType}, ${input.guestCount} guests, budget: ₹${input.budget.toLocaleString("en-IN")}).
2. Focus on common Indian celebration pitfalls:
   - Hidden DG generator fuel / power charges and 10 PM sound curfew for Venues.
   - Per-plate minimum guarantee (MG), live counters, mineral water/ice billing, and 1:25 server ratios for Caterers.
   - Raw footage handover, lead vs assistant coverage, deliverable timelines (45-60 days) for Photographers.
   - Fresh vs artificial flower proportion, rain contingency for Decorators.
   - Overtime charges past 1:00 AM, license clearances (IPRS/PPL) for Entertainment.
3. Every question must include a clear, educational "purpose" explaining why the host needs to ask this.
4. Output structured JSON conforming to the schema.`;

  const prompt = `Please generate vendor preparation interview questions for:
- Category: ${input.category}
- Celebration Type: ${input.eventType}
- Expected Guest Count: ${input.guestCount}
- Budget: ₹${input.budget.toLocaleString("en-IN")}
- Custom Requirements: "${input.requirements || "Standard celebration requirements"}"
${input.existingPlanSummary ? `- Existing Plan Context: ${input.existingPlanSummary}` : ""}`;

  try {
    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const parsedJson = JSON.parse(text);
    const validated = VendorQuestionResponseSchema.parse(parsedJson);

    return {
      result: validated,
      source: "gemini",
    };
  } catch (error) {
    console.error("Gemini vendor questions failed, using deterministic fallback:", error);
    const deterministic = generateDeterministicVendorQuestions(input);
    return {
      result: deterministic,
      source: "deterministic-fallback",
    };
  }
}

/**
 * Server-side Quotation Comparison using Gemini 2.5 Flash with fallback
 */
export async function compareQuotationsWithGemini(
  input: QuotationComparisonRequest
): Promise<{ result: QuotationComparisonResult; source: "gemini" | "deterministic-fallback" }> {
  const client = getGeminiClient();

  if (!client) {
    const deterministic = generateDeterministicQuotationComparison(input);
    return {
      result: deterministic,
      source: "deterministic-fallback",
    };
  }

  const systemInstruction = `You are a meticulous celebration procurement and vendor analysis advisor for SamarohSathi AI.
Analyze and compare user-provided quotations for ${input.category}.

CRITICAL MANDATORY RULES:
1. NEVER simply recommend the cheapest quotation. A more expensive quotation may offer far superior overall value if it includes essential services, better guest coverage, or transparent terms.
2. Check guest coverage: if a quote covers fewer than ${input.guestCount} guests, explicitly identify the coverage shortfall and overage penalty risk.
3. Scrutinize for hidden costs: identify whether 18% GST, generator fuel, transport, or overtime are excluded.
4. Flag missing information: do not invent or hallucinate data that is absent. If something is omitted, mark it as unknown in missingInformationAlerts.
5. Provide balanced advantages and disadvantages for EACH vendor quotation.
6. Clearly explain your recommendation rationale based on VALUE, risk mitigation, and user requirements.
7. NEVER declare any vendor as "verified", "available", or "booked".
8. Return structured JSON conforming to the schema.`;

  const prompt = `Compare these ${input.quotations.length} vendor quotations for ${input.category}:
- Expected Guest Count: ${input.guestCount}
- Allocated Category Budget: ${input.categoryBudget ? `₹${input.categoryBudget.toLocaleString("en-IN")}` : "Not specified"}
- User Celebration Priorities: ${input.userPriorities.join(", ") || "Balanced hospitality"}
- User Requirements: "${input.userRequirements || "None specified"}"

Quotations Data:
${JSON.stringify(input.quotations, null, 2)}`;

  try {
    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const parsedJson = JSON.parse(text);
    const validated = QuotationComparisonResponseSchema.parse(parsedJson);

    const result: QuotationComparisonResult = {
      comparisonSummary: validated.comparisonSummary,
      quotationDifferences: validated.quotationDifferences,
      advantages: validated.advantages,
      disadvantages: validated.disadvantages,
      additionalChargesAnalysis: validated.additionalChargesAnalysis,
      missingInformationAlerts: validated.missingInformationAlerts,
      questionsToAsk: validated.questionsToAsk,
      recommendation: validated.recommendation,
      assumptions: validated.assumptions,
      warnings: validated.warnings,
      analyzedAt: new Date().toISOString(),
      source: "gemini",
    };

    return {
      result,
      source: "gemini",
    };
  } catch (error) {
    console.error("Gemini quotation comparison failed, using deterministic fallback:", error);
    const deterministic = generateDeterministicQuotationComparison(input);
    return {
      result: deterministic,
      source: "deterministic-fallback",
    };
  }
}

