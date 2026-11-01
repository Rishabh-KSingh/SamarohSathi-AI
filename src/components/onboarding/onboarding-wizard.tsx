"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, Sparkles, Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WizardProgress } from "./wizard-progress";
import { Step1Details } from "./step-1-details";
import { Step2Budget } from "./step-2-budget";
import { Step4Priorities } from "./step-4-priorities";
import { Step6Review } from "./step-6-review";
import {
  OnboardingFormData,
  WizardStepId,
  AIPlanBudgetItem,
  AIPlanTaskItem,
} from "@/types/event";
import {
  getOnboardingDraft,
  saveOnboardingDraft,
  createEvent,
  saveAIPlanForEvent,
  saveCategoriesForEvent,
  saveTasksForEvent,
} from "@/lib/storage";
import { validateStep, ValidationErrors } from "@/lib/validation";

const DEFAULT_FORM_DATA: OnboardingFormData = {
  name: "",
  occasion: "Wedding",
  customOccasion: "",
  eventDate: "",
  location: "",
  guestCount: "",
  guestAudience: ["family_relatives", "close_friends"],

  totalBudget: "",
  currency: "INR",
  budgetFlexibility: "moderate",

  atmosphere: "traditional_heritage",
  preferences: "",

  priorities: ["food", "venue", "decor", "photography"],

  mustHavesList: [],
  thingsToAvoid: "",
  hasChildren: false,
  hasElderly: false,
  accessibilityRequirements: "",
  venueLimitations: "",
  culturalPreferences: "",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<WizardStepId>(1);
  const [completedSteps, setCompletedSteps] = React.useState<WizardStepId[]>([]);
  const [formData, setFormData] = React.useState<OnboardingFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);

  // Restore draft after mount asynchronously to avoid cascading render lint issue
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const saved = getOnboardingDraft();
      if (saved) {
        setFormData((prev) => ({ ...prev, ...saved }));
        setCompletedSteps([1]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Update form fields & clear corresponding errors
  const handleFieldChange = (fields: Partial<OnboardingFormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...fields };
      // Autosave draft
      saveOnboardingDraft(updated);
      return updated;
    });

    // Clear resolved errors
    if (Object.keys(errors).length > 0) {
      const remainingErrors = { ...errors };
      for (const key of Object.keys(fields)) {
        delete remainingErrors[key];
      }
      setErrors(remainingErrors);
    }
  };

  // Explicit Save Draft action
  const handleSaveDraft = () => {
    saveOnboardingDraft(formData);
    setSaveStatus("Progress saved locally");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Navigation handlers
  const handleNext = () => {
    const { isValid, errors: stepErrors } = validateStep(currentStep, formData);
    if (!isValid) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    if (currentStep < 4) {
      const nextStep = (currentStep + 1) as WizardStepId;
      setCurrentStep(nextStep);
      saveOnboardingDraft(formData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStepId);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepJump = (step: WizardStepId) => {
    if (step <= currentStep) {
      setCurrentStep(step);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const { isValid, errors: stepErrors } = validateStep(currentStep, formData);
    if (!isValid) {
      setErrors(stepErrors);
      return;
    }
    setCurrentStep(step);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit and create event
  const handleCreateEvent = async () => {
    const { isValid, errors: allErrors } = validateStep(4, formData);
    if (!isValid) {
      setErrors(allErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const occasionName =
        formData.occasion === "Other" && formData.customOccasion
          ? formData.customOccasion
          : formData.occasion;

      const newEvent = createEvent({
        name: formData.name.trim(),
        occasion: occasionName,
        eventDate: formData.eventDate,
        location: formData.location.trim(),
        guestCount: Number(formData.guestCount),
        guestAudience: formData.guestAudience,
        totalBudget: Number(formData.totalBudget),
        currency: formData.currency,
        budgetFlexibility: formData.budgetFlexibility,
        atmosphere: formData.atmosphere || "traditional_heritage",
        preferences: formData.preferences || "",
        priorities: formData.priorities,
        mustHaves: formData.mustHavesList || [],
        constraints: {
          mustHaves: formData.mustHavesList || [],
          thingsToAvoid: formData.thingsToAvoid || "",
          hasChildren: !!formData.hasChildren,
          hasElderly: !!formData.hasElderly,
          accessibilityRequirements: formData.accessibilityRequirements || "",
          venueLimitations: formData.venueLimitations || "",
          culturalPreferences: formData.culturalPreferences || "",
        },
        status: "planning",
        isSampleData: false,
      });

      // Generate AI event plan and persist categories & tasks
      try {
        const planRes = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEvent),
        });

        if (planRes.ok) {
          const data = await planRes.json();
          if (data.success && data.plan) {
            const plan = {
              ...data.plan,
              eventId: newEvent.id,
              source: data.source || "deterministic-fallback",
            };
            saveAIPlanForEvent(newEvent.id, plan);

            if (plan.budget?.categories?.length > 0) {
              const cats = plan.budget.categories.map((c: AIPlanBudgetItem, idx: number) => ({
                id: `cat_${Date.now()}_${idx}`,
                eventId: newEvent.id,
                name: c.name,
                estimatedAmount: Number(c.estimatedAmount) || 0,
                actualAmount: 0,
                priority: c.priority || "Medium",
                notes: c.notes || "",
                isAiGenerated: true,
              }));
              saveCategoriesForEvent(newEvent.id, cats);
            }

            if (plan.tasks?.length > 0) {
              const tasks = plan.tasks.map((t: AIPlanTaskItem, idx: number) => ({
                id: t.id || `task_${Date.now()}_${idx}`,
                eventId: newEvent.id,
                title: t.title,
                description: t.description || "",
                dueDate: t.dueDate || newEvent.eventDate,
                priority: t.priority || "Medium",
                status: "Not Started",
                dependencyIds: t.dependencyIds || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }));
              saveTasksForEvent(newEvent.id, tasks);
            }
          }
        }
      } catch (aiErr) {
        console.warn("AI generation error, local planner will serve as fallback:", aiErr);
      }

      router.push(`/overview?event_id=${newEvent.id}`);
    } catch (err) {
      console.error("Error creating event:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Wizard Progress & Step Navigation */}
      <Card className="p-4 sm:p-6 shadow-xs border-[#EBE5DC]">
        <WizardProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepJump}
        />
      </Card>

      {/* Main Step Content Card */}
      <Card className="p-6 sm:p-8 md:p-10 shadow-sm border-[#EBE5DC]">
        {currentStep === 1 && (
          <Step1Details
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
          />
        )}

        {currentStep === 2 && (
          <Step2Budget
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
          />
        )}

        {currentStep === 3 && (
          <Step4Priorities
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
          />
        )}

        {currentStep === 4 && (
          <Step6Review
            formData={formData}
            onEditStep={handleStepJump}
          />
        )}

        {/* Global Errors Banner if any unhandled error exists */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-[#C23B38]/10 border border-[#C23B38]/30 flex items-start gap-3 text-xs sm:text-sm text-[#C23B38]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Please fix the highlighted fields:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {Object.values(errors)
                  .filter(Boolean)
                  .map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="mt-8 pt-6 border-t border-[#EBE5DC] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Actions: Back & Save Draft */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="text-[#6B635B] hover:text-[#1F1A17]"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </Button>

            {saveStatus && (
              <span className="text-xs text-[#3F7A56] font-medium flex items-center gap-1 animate-fade-in">
                <Check className="w-3 h-3" /> {saveStatus}
              </span>
            )}
          </div>

          {/* Right Action: Continue / Create Event */}
          <div className="w-full sm:w-auto">
            {currentStep < 4 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                className="w-full sm:w-auto font-semibold px-6"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="accent"
                size="lg"
                onClick={handleCreateEvent}
                disabled={isSubmitting}
                className="w-full sm:w-auto font-bold shadow-md"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Creating Event...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5B1D2E]" />
                    Create Event &amp; Save Plan
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
