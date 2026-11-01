"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, MapPin, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { setActiveEventId, deleteEvent, createSampleEvent } from "@/lib/storage";
import { useAllEvents, useActiveEvent, useIsClient } from "@/lib/use-store";
import { CURRENCY_OPTIONS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export default function MyEventsPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const events = useAllEvents();
  const activeEvent = useActiveEvent();

  const handleSelectEvent = (id: string) => {
    setActiveEventId(id);
    router.push(`/overview?event_id=${id}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this event?")) {
      deleteEvent(id);
    }
  };

  const handleLoadSample = () => {
    const sample = createSampleEvent();
    router.push(`/overview?event_id=${sample.id}`);
  };

  if (!isClient) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-sm text-[#6B635B]">
            <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin" />
            Loading celebrations...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        <PageHeader
          eyebrow="Celebrations Portfolio"
          title="My Celebrations"
          description="Manage and switch between your planned celebrations."
          action={
            <Link href="/onboarding">
              <Button variant="primary" size="md">
                <Plus className="w-4 h-4" />
                Plan New Celebration
              </Button>
            </Link>
          }
        />

        {events.length === 0 ? (
          <EmptyState
            title="No celebrations planned yet."
            description="Start your first celebration with our guided smart onboarding, or explore Rohan & Priya's wedding celebration blueprint."
            action={
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/onboarding">
                  <Button variant="primary" size="md">
                    <Plus className="w-4 h-4" />
                    Start Smart Onboarding
                  </Button>
                </Link>
                <Button variant="outline" size="md" onClick={handleLoadSample}>
                  Explore Rohan &amp; Priya Wedding
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const isActive = activeEvent?.id === ev.id;
              const currencyObj =
                CURRENCY_OPTIONS.find((c) => c.code === ev.currency) || CURRENCY_OPTIONS[0];

              return (
                <div
                  key={ev.id}
                  onClick={() => handleSelectEvent(ev.id)}
                  className="group relative cursor-pointer"
                >
                  <Card className="h-full p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 border-[#EBE5DC] hover:border-[#5B1D2E]">
                    <div className="space-y-4">
                      {/* Top Header & Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="primary">{ev.occasion}</Badge>
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <Badge variant="accent">Active</Badge>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, ev.id)}
                            title="Delete Event"
                            className="p-1 rounded-md text-[#544E47] hover:text-[#C23B38] hover:bg-[#C23B38]/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Event Title */}
                      <div className="space-y-1">
                        <h3 className="font-serif text-2xl font-bold text-[#1F1A17] group-hover:text-[#5B1D2E] transition-colors">
                          {ev.name}
                        </h3>
                        <p className="text-sm text-[#544E47] flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#C8963E] flex-shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </p>
                      </div>

                      {/* Metrics strip */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EBE5DC] text-sm">
                        <div>
                          <span className="text-xs text-[#544E47] block font-medium">Date</span>
                          <span className="font-semibold text-[#1F1A17]">
                            {ev.eventDate || "TBD"}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-[#544E47] block font-medium">Guests</span>
                          <span className="font-semibold text-[#1F1A17]">
                            {ev.guestCount} guests
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-[#544E47] block font-medium">Budget</span>
                          <span className="font-mono font-bold text-[#5B1D2E]">
                            {currencyObj.symbol}
                            {formatNumber(ev.totalBudget)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-[#544E47] block font-medium">Per Guest</span>
                          <span className="font-mono font-semibold text-[#1F1A17]">
                            {currencyObj.symbol}
                            {ev.guestCount > 0 ? formatNumber(Math.round(ev.totalBudget / ev.guestCount)) : 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* View Details Link */}
                    <div className="pt-4 mt-4 border-t border-[#EBE5DC] flex items-center justify-between text-sm font-semibold text-[#5B1D2E]">
                      <span>Open Event Overview</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
