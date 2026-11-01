import { Metadata } from "next";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Create Event — Smart Onboarding | SamarohSathi AI",
  description: "Guided 4-step event setup to structure your celebration basics, budget, and spending priorities.",
};

export default function OnboardingPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Guided Planning"
          title="Plan Your Celebration"
          description="Follow our 4-step onboarding to capture your event essentials, budget boundaries, and spending priorities."
        />

        <OnboardingWizard />
      </div>
    </AppLayout>
  );
}
