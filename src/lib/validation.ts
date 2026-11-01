import { OnboardingFormData, WizardStepId } from "@/types/event";

export interface ValidationErrors {
  [field: string]: string | undefined;
}

/**
 * Validates whether a date string is in valid format and not in the past.
 */
export function validateEventDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === "") {
    return "Event date is required.";
  }
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    return "Please enter a valid date (YYYY-MM-DD).";
  }

  // Set today's date to midnight for fair comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse target date at midnight local time
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    return "Please enter a complete date.";
  }
  const targetDate = new Date(year, month - 1, day);

  if (targetDate < today) {
    return "Event date cannot be in the past.";
  }

  return null;
}

export function validateStep1(data: Partial<OnboardingFormData>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.name || data.name.trim().length < 3) {
    errors.name = "Event name must be at least 3 characters.";
  } else if (data.name.trim().length > 100) {
    errors.name = "Event name cannot exceed 100 characters.";
  }

  if (!data.occasion || data.occasion.trim() === "") {
    errors.occasion = "Please select an occasion type.";
  } else if (data.occasion === "Other" && (!data.customOccasion || data.customOccasion.trim().length < 2)) {
    errors.customOccasion = "Please specify the custom occasion.";
  }

  const dateError = validateEventDate(data.eventDate || "");
  if (dateError) {
    errors.eventDate = dateError;
  }

  if (!data.location || data.location.trim().length < 2) {
    errors.location = "Event location (city or venue) is required.";
  }

  const guestCount = Number(data.guestCount);
  if (data.guestCount === "" || data.guestCount === undefined || isNaN(guestCount)) {
    errors.guestCount = "Guest count is required.";
  } else if (!Number.isInteger(guestCount) || guestCount <= 0) {
    errors.guestCount = "Guest count must be a positive whole number.";
  } else if (guestCount > 25000) {
    errors.guestCount = "Guest count seems unusually large (max 25,000).";
  }

  return errors;
}

export function validateStep2(data: Partial<OnboardingFormData>): ValidationErrors {
  const errors: ValidationErrors = {};

  const budget = Number(data.totalBudget);
  if (data.totalBudget === "" || data.totalBudget === undefined || isNaN(budget)) {
    errors.totalBudget = "Total budget is required.";
  } else if (budget <= 0) {
    errors.totalBudget = "Budget must be greater than zero.";
  } else if (budget > 1000000000) {
    errors.totalBudget = "Budget amount exceeds standard limits.";
  }

  if (!data.currency || data.currency.trim() === "") {
    errors.currency = "Please select a currency.";
  }

  if (!data.budgetFlexibility) {
    errors.budgetFlexibility = "Please choose your budget flexibility.";
  }

  return errors;
}

export function validateStepPriorities(data: Partial<OnboardingFormData>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.priorities || data.priorities.length === 0) {
    errors.priorities = "Please select and rank at least 1 spending priority.";
  }

  return errors;
}

// Backward-compatible alias for existing tests
export const validateStep4 = validateStepPriorities;

export function validateStep3(data: Partial<OnboardingFormData>): ValidationErrors {
  const errors: ValidationErrors = {};
  if (data.atmosphere !== undefined && data.atmosphere.trim() === "") {
    errors.atmosphere = "Please select a desired celebration atmosphere.";
  }
  return errors;
}

export function validateStep5(): ValidationErrors {
  return {};
}

/**
 * Validates a specific step in the 4-step wizard.
 * Returns true if valid, false if errors exist.
 */
export function validateStep(
  step: WizardStepId,
  data: Partial<OnboardingFormData>
): { isValid: boolean; errors: ValidationErrors } {
  let errors: ValidationErrors = {};

  switch (step) {
    case 1:
      errors = validateStep1(data);
      break;
    case 2:
      errors = validateStep2(data);
      break;
    case 3:
      errors = validateStepPriorities(data);
      break;
    case 4:
      // Review step validates everything from steps 1-3
      errors = {
        ...validateStep1(data),
        ...validateStep2(data),
        ...validateStepPriorities(data),
      };
      break;
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}
