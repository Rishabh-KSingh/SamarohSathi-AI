"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "@/lib/constants";
import { WizardStepId } from "@/types/event";

interface WizardProgressProps {
  currentStep: WizardStepId;
  completedSteps: WizardStepId[];
  onStepClick: (step: WizardStepId) => void;
}

export function WizardProgress({
  currentStep,
  completedSteps,
  onStepClick,
}: WizardProgressProps) {
  const progressPercent = Math.round(((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100);

  return (
    <div className="w-full space-y-4">
      {/* Top Header: Step Indicator & Progress Percentage */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-[#C8963E]">
            Step {currentStep} of {WIZARD_STEPS.length}
          </span>
          <span className="text-[#6B635B] hidden sm:inline">•</span>
          <span className="font-serif text-[#1F1A17] text-sm hidden sm:inline">
            {WIZARD_STEPS[currentStep - 1].title}
          </span>
        </div>
        <span className="text-[#6B635B] font-mono text-xs">
          {progressPercent}% Completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-[#EBE5DC] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#5B1D2E] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${Math.max(progressPercent, 8)}%` }}
        />
      </div>

      {/* Stepper Dots & Navigation Bar */}
      <nav aria-label="Onboarding Steps" className="pt-1">
        <ol className="grid grid-cols-4 gap-2">
          {WIZARD_STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.step);
            const isCurrent = currentStep === step.step;
            const canNavigate = isCompleted || step.step <= currentStep;

            return (
              <li key={step.step} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => canNavigate && onStepClick(step.step)}
                  disabled={!canNavigate}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "w-full group flex flex-col items-center gap-1.5 py-1 px-1 rounded-xl transition-all duration-150 text-center select-none",
                    canNavigate
                      ? "cursor-pointer hover:bg-[#F5F2EB]"
                      : "cursor-not-allowed opacity-40",
                    isCurrent && "bg-[#F5F2EB]/60"
                  )}
                >
                  {/* Step Bubble Icon */}
                  <div
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border",
                      isCurrent &&
                        "bg-[#5B1D2E] text-white border-[#5B1D2E] ring-2 ring-[#C8963E] ring-offset-2 ring-offset-[#FBF9F5] shadow-sm",
                      isCompleted &&
                        !isCurrent &&
                        "bg-[#3F7A56] text-white border-[#3F7A56]",
                      !isCompleted &&
                        !isCurrent &&
                        "bg-white text-[#6B635B] border-[#EBE5DC]"
                    )}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                    ) : (
                      <span>{step.step}</span>
                    )}
                  </div>

                  {/* Step Short Title */}
                  <span
                    className={cn(
                      "text-[10px] sm:text-xs font-medium truncate max-w-full hidden sm:block",
                      isCurrent
                        ? "text-[#5B1D2E] font-bold"
                        : isCompleted
                        ? "text-[#1F1A17]"
                        : "text-[#6B635B]"
                    )}
                  >
                    {step.shortTitle}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
