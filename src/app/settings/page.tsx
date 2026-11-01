"use client";

import * as React from "react";
import {
  Download,
  Trash2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveEvent, useAllEvents } from "@/lib/use-store";
import { createSampleEvent } from "@/lib/storage";

export default function SettingsPage() {
  const activeEvent = useActiveEvent();
  const allEvents = useAllEvents();
  const [resetNotice, setResetNotice] = React.useState<string | null>(null);

  const handleExportData = () => {
    if (typeof window === "undefined") return;
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("samaroh_sathi_")) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `samaroh_sathi_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all stored celebration data? This will clear local events, categories, and quotations, and recreate Rohan & Priya's wedding celebration baseline."
      )
    ) {
      if (typeof window !== "undefined") {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("samaroh_sathi_")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        createSampleEvent();
        setResetNotice("Celebration data successfully reset to initial baseline.");
        setTimeout(() => setResetNotice(null), 4000);
      }
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        <PageHeader
          eyebrow="Preferences & Storage"
          title="Application Settings"
          description="Manage your celebration portfolio data, LocalStorage persistence, and planning preferences."
        />

        {resetNotice && (
          <div className="p-4 bg-[#F0FFF4] border border-[#C6F6D5] rounded-xl text-sm font-medium text-[#3F7A56] flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#3F7A56] flex-shrink-0" />
            <span>{resetNotice}</span>
          </div>
        )}

        {/* Portfolio Status */}
        <Card className="p-6 bg-white border border-[#EBE5DC] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1F1A17]">
                Active Portfolio Status
              </h3>
              <p className="text-sm text-[#544E47] mt-0.5">
                Current celebration context and storage summary.
              </p>
            </div>
            <Badge variant="accent">
              {allEvents.length} Saved Celebration{allEvents.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE5DC] space-y-1">
              <span className="text-xs font-semibold text-[#544E47] uppercase tracking-wide block">
                Active Celebration
              </span>
              <p className="font-serif text-lg font-bold text-[#1F1A17]">
                {activeEvent?.name || "None Selected"}
              </p>
              <p className="text-xs text-[#544E47]">
                {activeEvent ? `${activeEvent.occasion} • ${activeEvent.location}` : "Select an event from My Events"}
              </p>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE5DC] space-y-1">
              <span className="text-xs font-semibold text-[#544E47] uppercase tracking-wide block">
                Local Persistence Architecture
              </span>
              <p className="font-serif text-lg font-bold text-[#1F1A17]">
                Browser LocalStorage
              </p>
              <p className="text-xs text-[#544E47]">
                Zero external database requirement • Instant offline access
              </p>
            </div>
          </div>
        </Card>

        {/* Data Management Actions */}
        <Card className="p-6 bg-white border border-[#EBE5DC] space-y-5">
          <div className="border-b border-[#EBE5DC] pb-4">
            <h3 className="font-serif text-xl font-bold text-[#1F1A17]">
              Data Backup & Maintenance
            </h3>
            <p className="text-sm text-[#544E47] mt-0.5">
              Export your celebration blueprints as JSON or reset local storage to baseline.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#EBE5DC] bg-[#FAF8F5]">
              <div className="space-y-1">
                <span className="font-semibold text-base text-[#1F1A17] flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#5B1D2E]" />
                  Export Celebration Backup
                </span>
                <p className="text-sm text-[#544E47]">
                  Download a JSON file containing all saved events, budgets, timeline tasks, and vendor quotations.
                </p>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={handleExportData}
                className="self-start sm:self-auto flex-shrink-0"
              >
                Download Backup
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#FED7D7] bg-[#FFF5F5]">
              <div className="space-y-1">
                <span className="font-semibold text-base text-[#C05621] flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Reset to Initial Celebration Baseline
                </span>
                <p className="text-sm text-[#822727]">
                  Clears locally cached celebrations and resets the environment to a fresh state.
                </p>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={handleResetData}
                className="self-start sm:self-auto flex-shrink-0 text-[#C05621] border-[#FED7D7] hover:bg-[#FED7D7]/30"
              >
                Reset Storage
              </Button>
            </div>
          </div>
        </Card>

        {/* Application Information */}
        <Card className="p-6 bg-white border border-[#EBE5DC] space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F1A17]">
            <Sparkles className="w-4 h-4 text-[#C8963E]" />
            About SamarohSathi AI
          </div>
          <p className="text-sm text-[#544E47] leading-relaxed">
            SamarohSathi AI is an intelligent celebration planning and coordination assistant designed specifically for Indian celebrations. It integrates cultural context, budget allocation, vendor quote comparisons, and natural language plan revisions.
          </p>
          <div className="pt-2 text-xs text-[#544E47]">
            Design Theme: Royal Heritage &amp; Sandalwood • Built with Next.js 16 &amp; Tailwind CSS
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
