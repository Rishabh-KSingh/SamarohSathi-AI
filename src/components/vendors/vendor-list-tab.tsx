"use client";

import * as React from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Vendor, VendorCategory, VendorQuotation, VendorStatus } from "@/types/event";
import { formatCurrency } from "@/lib/utils";

interface VendorListTabProps {
  vendors: Vendor[];
  quotations: VendorQuotation[];
  vendorCategories: VendorCategory[];
  categoryFilter: string;
  statusColors: Record<VendorStatus, string>;
  onCategoryFilterChange: (category: string) => void;
  onOpenAddVendor: (category?: VendorCategory) => void;
  onOpenEditVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string, name: string) => void;
  onOpenAddQuotation: (vendorId: string, category: VendorCategory) => void;
  onPrepareQuestions: (category: VendorCategory, requirements?: string) => void;
}

export function VendorListTab({
  vendors,
  quotations,
  vendorCategories,
  categoryFilter,
  statusColors,
  onCategoryFilterChange,
  onOpenAddVendor,
  onOpenEditVendor,
  onDeleteVendor,
  onOpenAddQuotation,
  onPrepareQuestions,
}: VendorListTabProps) {
  const filteredVendors = vendors.filter((v) =>
    categoryFilter === "All" ? true : v.category === categoryFilter
  );

  return (
    <div className="space-y-6">
      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-[#6B635B] uppercase tracking-wider mr-1">
          Filter:
        </span>
        <button
          onClick={() => onCategoryFilterChange("All")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            categoryFilter === "All"
              ? "bg-[#5B1D2E] text-white shadow-sm"
              : "bg-white border border-[#EBE5DC] text-[#6B635B] hover:bg-[#FAF8F5]"
          }`}
        >
          All Categories ({vendors.length})
        </button>
        {vendorCategories.map((cat) => {
          const count = vendors.filter((v) => v.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => onCategoryFilterChange(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-[#5B1D2E] text-white shadow-sm"
                  : "bg-white border border-[#EBE5DC] text-[#6B635B] hover:bg-[#FAF8F5]"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Vendor Cards Grid */}
      {filteredVendors.length === 0 ? (
        <EmptyState
          title="No Vendors Added in this Category"
          description="Add caterers, decorators, venues, photographers, or entertainers you are researching or contacting."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() =>
                onOpenAddVendor(
                  categoryFilter !== "All" ? (categoryFilter as VendorCategory) : undefined
                )
              }
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add First Vendor
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((v) => {
            const vendorQuotes = quotations.filter((q) => q.vendorId === v.id);
            const selectedQuote = vendorQuotes.find((q) => q.isSelected);

            return (
              <Card
                key={v.id}
                className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Category & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8963E]">
                        {v.category}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-[#1F1A17] mt-0.5">
                        {v.name}
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColors[v.status]}`}
                    >
                      {v.status}
                    </span>
                  </div>

                  {/* Contact Person & Details */}
                  <div className="space-y-1.5 text-xs text-[#6B635B]">
                    {v.contactDetails.contactPerson && (
                      <div className="font-medium text-[#1F1A17]">
                        Spokesperson: {v.contactDetails.contactPerson}
                      </div>
                    )}
                    {v.contactDetails.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#C8963E]" />
                        <a
                          href={`tel:${v.contactDetails.phone}`}
                          className="hover:text-[#5B1D2E] underline"
                        >
                          {v.contactDetails.phone}
                        </a>
                      </div>
                    )}
                    {v.contactDetails.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#C8963E]" />
                        <a
                          href={`mailto:${v.contactDetails.email}`}
                          className="hover:text-[#5B1D2E] underline truncate"
                        >
                          {v.contactDetails.email}
                        </a>
                      </div>
                    )}
                    {v.contactDetails.address && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#C8963E] flex-shrink-0" />
                        <span className="truncate">{v.contactDetails.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Requirements snippet */}
                  {v.requirements && (
                    <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#EBE5DC] text-xs">
                      <span className="font-semibold text-[#1F1A17] block mb-0.5">
                        Host Requirements:
                      </span>
                      <p className="text-[#6B635B] line-clamp-2 leading-relaxed">
                        {v.requirements}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {v.notes && (
                    <p className="text-xs text-[#6B635B] italic line-clamp-2">
                      &ldquo;{v.notes}&rdquo;
                    </p>
                  )}

                  {/* Associated Quotations Pill */}
                  <div className="pt-2 border-t border-[#EBE5DC]/70 flex items-center justify-between text-xs">
                    <span className="text-[#6B635B]">
                      {vendorQuotes.length} Quotation{vendorQuotes.length === 1 ? "" : "s"}
                    </span>
                    {selectedQuote ? (
                      <span className="text-[#3F7A56] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected ({formatCurrency(selectedQuote.quotedAmount)})
                      </span>
                    ) : vendorQuotes.length > 0 ? (
                      <span className="text-[#C8963E] font-medium">
                        From {formatCurrency(Math.min(...vendorQuotes.map((q) => q.quotedAmount)))}
                      </span>
                    ) : (
                      <span className="text-[#9E978E]">No quote yet</span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 mt-3 border-t border-[#EBE5DC] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onPrepareQuestions(v.category, v.requirements)}
                      className="p-1.5 text-xs text-[#5B1D2E] hover:bg-[#FDF2F4] rounded-md transition-colors flex items-center gap-1 font-semibold"
                      title="Generate Interview Questions"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C8963E]" />
                      Interview Prep
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenAddQuotation(v.id, v.category)}
                      className="p-1.5 text-xs text-[#3F7A56] hover:bg-[#F0FFF4] rounded-md transition-colors flex items-center gap-1 font-semibold"
                      title="Add Quotation"
                    >
                      <Plus className="w-3.5 h-3.5" /> Quote
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenEditVendor(v)}
                      className="p-1.5 text-[#6B635B] hover:text-[#5B1D2E] hover:bg-[#FAF8F5] rounded-md transition-colors"
                      title="Edit Vendor"
                      aria-label={`Edit vendor details for ${v.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteVendor(v.id, v.name)}
                      className="p-1.5 text-[#6B635B] hover:text-[#C05621] hover:bg-[#FFF5F5] rounded-md transition-colors"
                      title="Delete Vendor"
                      aria-label={`Delete vendor ${v.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
