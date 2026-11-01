/**
 * SamarohSathi AI — Core Event Data Models
 * Follows PRD Section 8 & Section 3.2 Smart Onboarding specifications
 */

export type OccasionType =
  | "Wedding"
  | "Reception"
  | "Birthday Party"
  | "Anniversary"
  | "Engagement"
  | "Sangeet & Mehendi"
  | "Housewarming (Griha Pravesh)"
  | "Baby Shower (Godh Bharai)"
  | "Corporate Gathering"
  | "Festival Celebration"
  | "Retirement Party"
  | "Intimate Dinner"
  | "Other";

export type BudgetFlexibility = "fixed" | "moderate" | "flexible";

export type SpendingPriorityKey =
  | "food"
  | "venue"
  | "decor"
  | "photography"
  | "entertainment"
  | "hospitality"
  | "simplicity"
  | "gifting";

export interface SpendingPriorityItem {
  id: SpendingPriorityKey;
  label: string;
  description: string;
}

export type AtmosphereThemeKey =
  | "simple_elegant"
  | "premium_celebration"
  | "traditional_heritage"
  | "modern_chic"
  | "family_friendly"
  | "intimate_gathering";

export interface AtmosphereOption {
  id: AtmosphereThemeKey;
  label: string;
  tagline: string;
  description: string;
}

export type GuestAudienceType =
  | "family_relatives"
  | "close_friends"
  | "colleagues"
  | "mixed_generations"
  | "vip_dignitaries"
  | "kids_centric";

export interface EventConstraints {
  mustHaves: string[];
  thingsToAvoid: string;
  hasChildren: boolean;
  hasElderly: boolean;
  accessibilityRequirements: string;
  venueLimitations: string;
  culturalPreferences: string;
}

export interface EventData {
  id: string;
  name: string;
  occasion: OccasionType | string;
  eventDate: string; // YYYY-MM-DD
  location: string;
  guestCount: number;
  guestAudience: GuestAudienceType[];
  totalBudget: number;
  currency: string;
  budgetFlexibility: BudgetFlexibility;
  atmosphere: AtmosphereThemeKey | string;
  preferences: string;
  priorities: SpendingPriorityKey[];
  mustHaves: string[];
  constraints: EventConstraints;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  status: "planning" | "confirmed" | "completed";
  isSampleData?: boolean;
}

export interface OnboardingFormData {
  // Step 1: Event Details (Basics)
  name: string;
  occasion: OccasionType | string;
  customOccasion?: string;
  eventDate: string;
  location: string;
  guestCount: number | "";
  guestAudience: GuestAudienceType[];

  // Step 2: Budget
  totalBudget: number | "";
  currency: string;
  budgetFlexibility: BudgetFlexibility;

  // Step 3: Spending Priorities
  priorities: SpendingPriorityKey[];

  // Backward compatibility fields (optional / legacy data preservation)
  atmosphere?: AtmosphereThemeKey | string;
  preferences?: string;
  mustHavesList?: string[];
  thingsToAvoid?: string;
  hasChildren?: boolean;
  hasElderly?: boolean;
  accessibilityRequirements?: string;
  venueLimitations?: string;
  culturalPreferences?: string;
}

export type WizardStepId = 1 | 2 | 3 | 4;

export interface StepMeta {
  step: WizardStepId;
  title: string;
  shortTitle: string;
  description: string;
}

// ==========================================
// Phase 3: Budget, Timeline & AI Plan Types
// ==========================================

export type CategoryPriority = "High" | "Medium" | "Low";

export interface BudgetCategory {
  id: string;
  eventId: string;
  name: string;
  estimatedAmount: number;
  actualAmount: number;
  priority: CategoryPriority;
  notes: string;
  isAiGenerated?: boolean;
}

export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "Not Started" | "In Progress" | "Completed" | "Delayed";

export interface EventTask {
  id: string;
  eventId: string;
  title: string;
  description: string;
  startDate?: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  dependencyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AIPlanBudgetItem {
  name: string;
  estimatedAmount: number;
  priority: CategoryPriority;
  notes: string;
}

export interface AIPlanTaskItem {
  id?: string;
  title: string;
  description: string;
  startDate?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  dependencyIds: string[];
}

export interface AIEventPlan {
  eventId: string;
  eventSummary: string;
  assumptions: string[];
  recommendations?: string[];
  budget: {
    totalBudget: number;
    categories: AIPlanBudgetItem[];
  };
  tasks: AIPlanTaskItem[];
  warnings: string[];
  followUpQuestions: string[];
  generatedAt: string;
  source: "gemini" | "deterministic-fallback";
}

export interface BudgetTradeoffItem {
  categoryName: string;
  currentEstimate: number;
  suggestedEstimate: number;
  savings: number;
  reasoning: string;
  preservesPriority: boolean;
}

export interface BudgetTradeoffSuggestion {
  summary: string;
  tradeoffs: BudgetTradeoffItem[];
  projectedTotal: number;
  projectedSavings: number;
  advice: string;
  source: "gemini" | "deterministic-fallback";
}

// ==========================================
// Phase 4: Adaptive Plan Revision Engine Types
// ==========================================

export type ChangeType =
  | "guest_count"
  | "budget"
  | "event_date"
  | "priorities"
  | "venue"
  | "catering"
  | "decor"
  | "entertainment"
  | "general";

export interface CategoryDiff {
  categoryName: string;
  previousEstimated: number;
  proposedEstimated: number;
  difference: number; // positive = increase, negative = decrease
  reasoning: string;
}

export interface TaskDiff {
  taskId?: string;
  title: string;
  action: "updated" | "added" | "shifted";
  previousDueDate?: string;
  proposedDueDate: string;
  reasoning: string;
  priority?: TaskPriority;
}

export interface EventChangesDiff {
  guestCount?: { previous: number; proposed: number };
  totalBudget?: { previous: number; proposed: number };
  eventDate?: { previous: string; proposed: string };
  location?: { previous: string; proposed: string };
  priorities?: { previous: SpendingPriorityKey[]; proposed: SpendingPriorityKey[] };
}

export interface PlanRevisionProposal {
  id: string;
  eventId: string;
  requestedChange: string;
  changeType: ChangeType;
  requiresClarification: boolean;
  clarificationQuestion?: string;
  explanation: string;
  assumptions: string[];
  warnings: string[];
  eventChanges?: EventChangesDiff;
  categoryDiffs: CategoryDiff[];
  budgetImpact: {
    previousTotalEstimated: number;
    proposedTotalEstimated: number;
    difference: number;
    previousBudget: number;
    proposedBudget: number;
    previousRemaining: number;
    proposedRemaining: number;
    isOverBudget: boolean;
    overrunAmount: number;
  };
  taskDiffs: TaskDiff[];
  affectedUnchangedSummary: {
    unchangedCategoriesCount: number;
    unchangedTasksCount: number;
    summary: string;
  };
  status: "proposed" | "accepted" | "rejected";
  createdAt: string;
}

export interface PlanChangeRecord {
  id: string;
  eventId: string;
  changeType: ChangeType;
  requestedChange: string;
  previousValue: string;
  newValue: string;
  explanation: string;
  affectedCategories: string[];
  affectedTasks: string[];
  budgetDelta: number;
  status: "accepted" | "rejected";
  createdAt: string;
}

// ==========================================
// Phase 5: Vendor & Quotation Management Types
// ==========================================

export type VendorCategory =
  | "Venue"
  | "Caterer"
  | "Photographer"
  | "Decorator"
  | "Entertainment"
  | "Transportation"
  | "Makeup"
  | "Lighting"
  | "Other";

export type VendorStatus =
  | "Researching"
  | "Contacted"
  | "Quotation Received"
  | "Shortlisted"
  | "Selected"
  | "Rejected";

export interface VendorContact {
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
}

export interface Vendor {
  id: string;
  eventId: string;
  name: string;
  category: VendorCategory;
  contactDetails: VendorContact;
  requirements: string;
  notes: string;
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VendorQuotation {
  id: string;
  vendorId: string;
  vendorName: string;
  eventId: string;
  category: VendorCategory;
  budgetCategoryId?: string;
  quotedAmount: number;
  guestCoverage: number;
  includedServices: string[];
  additionalCharges: string[];
  terms: string;
  missingInformation: string[];
  notes: string;
  isSelected?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorQuestionItem {
  question: string;
  purpose: string;
  category: string;
}

export interface QuotationComparisonResult {
  comparisonSummary: string;
  quotationDifferences: string[];
  advantages: Record<string, string[]>;
  disadvantages: Record<string, string[]>;
  additionalChargesAnalysis: string[];
  missingInformationAlerts: string[];
  questionsToAsk: string[];
  recommendation: {
    vendorName: string;
    quotationId: string;
    rationale: string;
    valueAssessment: string;
  };
  assumptions: string[];
  warnings: string[];
  analyzedAt: string;
  source: "gemini" | "deterministic-fallback";
}
