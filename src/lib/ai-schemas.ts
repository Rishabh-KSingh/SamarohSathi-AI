import { z } from "zod";

/**
 * Zod validation schema for event plan generation inputs
 */
export const PlanGenerationInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Event name is required"),
  occasion: z.string().min(2, "Occasion is required"),
  eventDate: z.string().min(4, "Event date is required"),
  location: z.string().min(2, "Location is required"),
  guestCount: z.number().int().positive("Guest count must be a positive integer"),
  guestAudience: z.array(z.string()).optional().default([]),
  totalBudget: z.number().positive("Total budget must be a positive number"),
  currency: z.string().default("INR"),
  budgetFlexibility: z.enum(["fixed", "moderate", "flexible"]).default("moderate"),
  atmosphere: z.string().default("traditional_heritage"),
  preferences: z.string().optional().default(""),
  priorities: z.array(z.string()).min(1, "At least one priority is required"),
  mustHaves: z.array(z.string()).optional().default([]),
  constraints: z
    .object({
      mustHaves: z.array(z.string()).optional().default([]),
      thingsToAvoid: z.string().optional().default(""),
      hasChildren: z.boolean().optional().default(false),
      hasElderly: z.boolean().optional().default(false),
      accessibilityRequirements: z.string().optional().default(""),
      venueLimitations: z.string().optional().default(""),
      culturalPreferences: z.string().optional().default(""),
    })
    .optional()
    .default({
      mustHaves: [],
      thingsToAvoid: "",
      hasChildren: false,
      hasElderly: false,
      accessibilityRequirements: "",
      venueLimitations: "",
      culturalPreferences: "",
    }),
});

export type PlanGenerationInput = z.infer<typeof PlanGenerationInputSchema>;

/**
 * Zod validation schema for AI-generated budget item
 */
export const AIBudgetItemSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  estimatedAmount: z.number().nonnegative("Estimated amount must be >= 0"),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
  notes: z.string().optional().default(""),
});

/**
 * Zod validation schema for AI-generated task item
 */
export const AITaskItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().default(""),
  startDate: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
  status: z
    .enum(["Not Started", "In Progress", "Completed", "Delayed"])
    .default("Not Started"),
  dependencyIds: z.array(z.string()).optional().default([]),
});

/**
 * Zod validation schema for full structured AI Event Plan
 */
export const AIPlanResponseSchema = z.object({
  eventSummary: z.string().min(10, "Summary must be descriptive"),
  assumptions: z.array(z.string()).min(1, "At least one assumption required"),
  recommendations: z.array(z.string()).optional().default([]),
  budget: z.object({
    totalBudget: z.number().positive(),
    categories: z.array(AIBudgetItemSchema).min(1, "Must contain budget categories"),
  }),
  tasks: z.array(AITaskItemSchema).min(1, "Must contain tasks"),
  warnings: z.array(z.string()).optional().default([]),
  followUpQuestions: z.array(z.string()).optional().default([]),
});

export type AIPlanResponse = z.infer<typeof AIPlanResponseSchema>;

/**
 * Trade-off suggestions request schema
 */
export const BudgetTradeoffRequestSchema = z.object({
  eventId: z.string(),
  totalBudget: z.number().positive(),
  currentExpenses: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      estimatedAmount: z.number(),
      priority: z.enum(["High", "Medium", "Low"]),
      notes: z.string().optional(),
    })
  ),
  overrunAmount: z.number().positive(),
  priorities: z.array(z.string()),
  occasion: z.string().optional(),
  guestCount: z.number().optional(),
});

export type BudgetTradeoffRequest = z.infer<typeof BudgetTradeoffRequestSchema>;

/**
 * Trade-off item schema
 */
export const TradeoffItemSchema = z.object({
  categoryName: z.string(),
  currentEstimate: z.number(),
  suggestedEstimate: z.number(),
  savings: z.number(),
  reasoning: z.string(),
  preservesPriority: z.boolean(),
});

/**
 * Trade-off response schema
 */
export const BudgetTradeoffResponseSchema = z.object({
  summary: z.string(),
  tradeoffs: z.array(TradeoffItemSchema),
  projectedTotal: z.number(),
  projectedSavings: z.number(),
  advice: z.string(),
});

export type BudgetTradeoffResponse = z.infer<typeof BudgetTradeoffResponseSchema>;

// ==========================================
// Phase 4: Adaptive Plan Revision Engine Schemas
// ==========================================

export const PlanRevisionInputSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  userRequest: z.string().min(3, "Request must be at least 3 characters"),
  currentEvent: z.object({
    id: z.string(),
    name: z.string(),
    occasion: z.string(),
    eventDate: z.string(),
    location: z.string(),
    guestCount: z.number().int().positive(),
    totalBudget: z.number().positive(),
    currency: z.string(),
    budgetFlexibility: z.string(),
    atmosphere: z.string(),
    preferences: z.string().optional(),
    priorities: z.array(z.string()),
    mustHaves: z.array(z.string()).optional(),
  }),
  currentCategories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      estimatedAmount: z.number(),
      actualAmount: z.number().optional().default(0),
      priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
      notes: z.string().optional().default(""),
    })
  ),
  currentTasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional().default(""),
      dueDate: z.string(),
      priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
      status: z.enum(["Not Started", "In Progress", "Completed", "Delayed"]).default("Not Started"),
      dependencyIds: z.array(z.string()).optional().default([]),
    })
  ),
});

export type PlanRevisionInput = z.infer<typeof PlanRevisionInputSchema>;

export const AIPlanRevisionResponseSchema = z.object({
  changeType: z.enum([
    "guest_count",
    "budget",
    "event_date",
    "priorities",
    "venue",
    "catering",
    "decor",
    "entertainment",
    "general",
  ]),
  requiresClarification: z.boolean().default(false),
  clarificationQuestion: z.string().optional(),
  explanation: z.string().min(10, "Explanation must be descriptive"),
  assumptions: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  proposedEventChanges: z
    .object({
      guestCount: z.number().int().positive().optional(),
      totalBudget: z.number().positive().optional(),
      eventDate: z.string().optional(),
      location: z.string().optional(),
      priorities: z.array(z.string()).optional(),
    })
    .optional(),
  proposedCategoryAdjustments: z
    .array(
      z.object({
        categoryName: z.string(),
        proposedEstimated: z.number().nonnegative(),
        reasoning: z.string(),
      })
    )
    .default([]),
  proposedTaskAdjustments: z
    .array(
      z.object({
        taskId: z.string().optional(),
        title: z.string(),
        action: z.enum(["updated", "added", "shifted"]).default("updated"),
        proposedDueDate: z.string(),
        reasoning: z.string(),
        priority: z.enum(["High", "Medium", "Low"]).optional(),
      })
    )
    .default([]),
});

export type AIPlanRevisionResponse = z.infer<typeof AIPlanRevisionResponseSchema>;

// ==========================================
// Phase 5: Vendor & Quotation Schemas
// ==========================================

export const VendorQuestionRequestSchema = z.object({
  eventType: z.string().min(2, "Event type is required"),
  guestCount: z.number().int().positive("Guest count must be positive"),
  budget: z.number().nonnegative("Budget must be non-negative"),
  category: z.enum([
    "Venue",
    "Caterer",
    "Photographer",
    "Decorator",
    "Entertainment",
    "Transportation",
    "Makeup",
    "Lighting",
    "Other",
  ]),
  requirements: z.string().optional().default(""),
  existingPlanSummary: z.string().optional().default(""),
});

export type VendorQuestionRequest = z.input<typeof VendorQuestionRequestSchema>;

export const VendorQuestionItemSchema = z.object({
  question: z.string().min(5, "Question must be specific"),
  purpose: z.string().min(5, "Purpose explanation required"),
  category: z.string().default("General"),
});

export const VendorQuestionResponseSchema = z.object({
  category: z.string(),
  questions: z.array(VendorQuestionItemSchema).min(3, "At least 3 questions required"),
  tips: z.array(z.string()).optional().default([]),
});

export type VendorQuestionResponse = z.infer<typeof VendorQuestionResponseSchema>;

export const QuotationInputItemSchema = z.object({
  id: z.string(),
  vendorName: z.string().min(1, "Vendor name is required"),
  quotedAmount: z.number().positive("Quoted amount must be positive"),
  guestCoverage: z.number().int().nonnegative().default(0),
  includedServices: z.array(z.string()).min(1, "At least one included service is required"),
  additionalCharges: z.array(z.string()).default([]),
  terms: z.string().default(""),
  missingInformation: z.array(z.string()).default([]),
  notes: z.string().default(""),
});

export const QuotationComparisonRequestSchema = z.object({
  eventId: z.string().min(1, "Event ID required"),
  category: z.enum([
    "Venue",
    "Caterer",
    "Photographer",
    "Decorator",
    "Entertainment",
    "Transportation",
    "Makeup",
    "Lighting",
    "Other",
  ]),
  guestCount: z.number().int().positive().default(100),
  categoryBudget: z.number().nonnegative().optional(),
  quotations: z
    .array(QuotationInputItemSchema)
    .min(2, "At least 2 quotations are required for comparison"),
  userPriorities: z.array(z.string()).default([]),
  userRequirements: z.string().default(""),
});

export type QuotationComparisonRequest = z.infer<typeof QuotationComparisonRequestSchema>;

export const QuotationComparisonResponseSchema = z.object({
  comparisonSummary: z.string().min(20, "Summary must be thorough and descriptive"),
  quotationDifferences: z.array(z.string()).min(1, "Must highlight differences"),
  advantages: z.record(z.string(), z.array(z.string())),
  disadvantages: z.record(z.string(), z.array(z.string())),
  additionalChargesAnalysis: z.array(z.string()).default([]),
  missingInformationAlerts: z.array(z.string()).default([]),
  questionsToAsk: z.array(z.string()).default([]),
  recommendation: z.object({
    vendorName: z.string(),
    quotationId: z.string(),
    rationale: z.string().min(10, "Rationale must justify choice based on value, not just lowest price"),
    valueAssessment: z.string().min(10, "Value assessment must be descriptive"),
  }),
  assumptions: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

export type QuotationComparisonResponse = z.infer<typeof QuotationComparisonResponseSchema>;
