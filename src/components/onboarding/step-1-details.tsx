"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { OCCASION_OPTIONS, GUEST_AUDIENCE_OPTIONS } from "@/lib/constants";
import { OnboardingFormData, GuestAudienceType } from "@/types/event";
import { ValidationErrors } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface Step1DetailsProps {
  formData: OnboardingFormData;
  errors: ValidationErrors;
  onChange: (fields: Partial<OnboardingFormData>) => void;
}

export function Step1Details({ formData, errors, onChange }: Step1DetailsProps) {
  // Today's date in YYYY-MM-DD for native date input min attribute
  const [todayStr, setTodayStr] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTodayStr(new Date().toISOString().split("T")[0]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleAudience = (audienceId: GuestAudienceType) => {
    const current = formData.guestAudience || [];
    if (current.includes(audienceId)) {
      onChange({ guestAudience: current.filter((id) => id !== audienceId) });
    } else {
      onChange({ guestAudience: [...current, audienceId] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Introduction */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1F1A17] tracking-tight">
          Celebration Essentials
        </h2>
        <p className="text-sm text-[#6B635B] mt-1">
          Tell us the fundamental details about what you are planning.
        </p>
      </div>

      {/* Event Name */}
      <div>
        <Input
          id="event-name"
          label="Celebration or Event Title *"
          placeholder="e.g., Sharma Family Silver Jubilee, Aryan & Ananya Wedding"
          value={formData.name}
          error={errors.name}
          helperText="Give your celebration a distinct, memorable name."
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      {/* Occasion Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] select-none block">
          Occasion Type *
        </label>
        <div className="flex flex-wrap gap-2">
          {OCCASION_OPTIONS.map((occ) => {
            const isSelected = formData.occasion === occ;
            return (
              <button
                key={occ}
                type="button"
                onClick={() => onChange({ occasion: occ })}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 border select-none cursor-pointer",
                  isSelected
                    ? "bg-[#5B1D2E] text-white border-[#5B1D2E] shadow-sm font-semibold ring-2 ring-[#C8963E]/40"
                    : "bg-white text-[#1F1A17] border-[#EBE5DC] hover:bg-[#F5F2EB] hover:border-[#6B635B]/30"
                )}
              >
                {occ}
              </button>
            );
          })}
        </div>
        {errors.occasion && (
          <p className="text-xs text-[#C23B38] font-medium mt-1">{errors.occasion}</p>
        )}

        {/* Custom Occasion Input if 'Other' selected */}
        {formData.occasion === "Other" && (
          <div className="pt-2">
            <Input
              id="custom-occasion"
              label="Specify Custom Occasion *"
              placeholder="e.g., Classical Arangetram, Startup Anniversary Gala"
              value={formData.customOccasion || ""}
              error={errors.customOccasion}
              onChange={(e) => onChange({ customOccasion: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Date & Location Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Event Date */}
        <div>
          <Input
            id="event-date"
            type="date"
            min={todayStr || "2026-01-01"}
            label="Celebration Date *"
            value={formData.eventDate}
            error={errors.eventDate}
            helperText="Expected date of the primary celebration."
            onChange={(e) => onChange({ eventDate: e.target.value })}
          />
        </div>

        {/* Location / City */}
        <div>
          <Input
            id="event-location"
            label="Location (City / Area / Venue) *"
            placeholder="e.g., Jaipur, Rajasthan or The Grand Haveli, Udaipur"
            value={formData.location}
            error={errors.location}
            helperText="Where will guests gather for this celebration?"
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </div>
      </div>

      {/* Guest Count & Audience */}
      <div className="space-y-4 pt-2 border-t border-[#EBE5DC]">
        <div className="max-w-xs">
          <Input
            id="guest-count"
            type="number"
            min={1}
            max={25000}
            label="Expected Number of Guests *"
            placeholder="e.g., 150"
            value={formData.guestCount}
            error={errors.guestCount}
            helperText="Estimated attendee count (can be adjusted later)."
            onChange={(e) => {
              const val = e.target.value;
              onChange({ guestCount: val === "" ? "" : Number(val) });
            }}
          />
        </div>

        {/* Guest Audience Types */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6B635B] select-none block">
            Guest Audience Profile (Select all that apply)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {GUEST_AUDIENCE_OPTIONS.map((audience) => {
              const isChecked = (formData.guestAudience || []).includes(audience.id);
              return (
                <button
                  key={audience.id}
                  type="button"
                  onClick={() => toggleAudience(audience.id)}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs sm:text-sm transition-all duration-150 cursor-pointer select-none",
                    isChecked
                      ? "bg-[#F5F2EB] border-[#5B1D2E] text-[#1F1A17] font-medium shadow-xs"
                      : "bg-white border-[#EBE5DC] text-[#6B635B] hover:bg-[#FBF9F5] hover:text-[#1F1A17]"
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-md flex items-center justify-center border text-[10px] transition-colors",
                      isChecked
                        ? "bg-[#5B1D2E] text-white border-[#5B1D2E]"
                        : "border-[#6B635B]/40 bg-white"
                    )}
                  >
                    {isChecked && "✓"}
                  </span>
                  <span>{audience.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
