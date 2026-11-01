import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ATMOSPHERE_OPTIONS, SPENDING_PRIORITIES } from "@/lib/constants";
import { EventData } from "@/types/event";

export interface EventDetailsGridProps {
  event: EventData;
}

export function EventDetailsGrid({ event }: EventDetailsGridProps) {
  const atmosphereObj = ATMOSPHERE_OPTIONS.find((a) => a.id === event.atmosphere);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Column 1 & 2: Atmosphere, Priorities & Vision */}
      <div className="md:col-span-2 space-y-6">
        {/* Atmosphere & Vision */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C8963E]">
              Atmosphere &amp; Theme
            </span>
            <CardTitle className="text-xl">
              {atmosphereObj?.label || event.atmosphere}
            </CardTitle>
            {atmosphereObj?.tagline && (
              <p className="text-xs font-medium text-[#6B635B]">
                {atmosphereObj.tagline}
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {atmosphereObj?.description && (
              <p className="text-sm text-[#1F1A17] leading-relaxed">
                {atmosphereObj.description}
              </p>
            )}

            {event.preferences ? (
              <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#EBE5DC]">
                <p className="text-xs font-semibold text-[#6B635B] uppercase tracking-wider mb-1">
                  User Personal Vision
                </p>
                <p className="text-sm text-[#1F1A17] italic leading-relaxed">
                  &ldquo;{event.preferences}&rdquo;
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Ranked Spending Priorities */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C8963E]">
              Spending Priorities
            </span>
            <CardTitle className="text-xl">Hierarchy of Importance</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2.5">
            {(event.priorities || []).map((priorityKey, idx) => {
              const item = SPENDING_PRIORITIES.find((p) => p.id === priorityKey);
              return (
                <div
                  key={priorityKey}
                  className="p-3 rounded-xl bg-[#F5F2EB]/50 border border-[#EBE5DC] flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#5B1D2E] text-white flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-[#1F1A17]">
                        {item?.label || priorityKey}
                      </p>
                      <p className="text-xs text-[#6B635B] line-clamp-1">
                        {item?.description}
                      </p>
                    </div>
                  </div>
                  {idx === 0 && <Badge variant="accent">Top Priority</Badge>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Column 3: Must-Haves, Demographics & Boundaries */}
      <div className="space-y-6">
        {/* Must Haves Card */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C8963E]">
              Non-Negotiables
            </span>
            <CardTitle className="text-lg">Must-Have Essentials</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(event.mustHaves || []).length > 0 ? (
              <ul className="space-y-2 text-xs">
                {event.mustHaves.map((mh, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg bg-[#FBF9F5] border border-[#EBE5DC]"
                  >
                    <span className="text-[#3F7A56] font-bold">✓</span>
                    <span className="text-[#1F1A17] font-medium">{mh}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#6B635B] italic">
                No specific must-haves entered.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Constraints & Accommodations */}
        <Card className="p-6 space-y-4">
          <CardHeader className="p-0 pb-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C8963E]">
              Care &amp; Limitations
            </span>
            <CardTitle className="text-lg">Special Considerations</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3 text-xs">
            <div>
              <span className="font-semibold text-[#1F1A17] block mb-1">
                Guest Demographic
              </span>
              <div className="flex flex-wrap gap-1.5">
                {event.constraints?.hasChildren && (
                  <Badge variant="default">Children Present</Badge>
                )}
                {event.constraints?.hasElderly && (
                  <Badge variant="default">Seniors / Elderly</Badge>
                )}
                {!event.constraints?.hasChildren && !event.constraints?.hasElderly && (
                  <span className="text-[#6B635B]">
                    Standard attendee demographic.
                  </span>
                )}
              </div>
            </div>

            {event.constraints?.thingsToAvoid && (
              <div>
                <span className="font-semibold text-[#1F1A17] block">
                  Things to Avoid:
                </span>
                <p className="text-[#6B635B] mt-0.5">
                  {event.constraints.thingsToAvoid}
                </p>
              </div>
            )}

            {event.constraints?.accessibilityRequirements && (
              <div>
                <span className="font-semibold text-[#1F1A17] block">
                  Accessibility Needs:
                </span>
                <p className="text-[#6B635B] mt-0.5">
                  {event.constraints.accessibilityRequirements}
                </p>
              </div>
            )}

            {event.constraints?.venueLimitations && (
              <div>
                <span className="font-semibold text-[#1F1A17] block">
                  Venue Limitations:
                </span>
                <p className="text-[#6B635B] mt-0.5">
                  {event.constraints.venueLimitations}
                </p>
              </div>
            )}

            {event.constraints?.culturalPreferences && (
              <div>
                <span className="font-semibold text-[#1F1A17] block">
                  Cultural Traditions:
                </span>
                <p className="text-[#6B635B] mt-0.5">
                  {event.constraints.culturalPreferences}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
