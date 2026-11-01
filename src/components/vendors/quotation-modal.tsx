"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Vendor, VendorCategory, VendorQuotation, BudgetCategory } from "@/types/event";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { formatCurrency } from "@/lib/utils";

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingQuotation: VendorQuotation | null;
  vendors: Vendor[];
  vendorCategories: VendorCategory[];
  budgetCategories: BudgetCategory[];
  defaultGuestCount: number;
  initialVendorId?: string;
  initialCategory?: VendorCategory;
  onSaveQuotation: (data: {
    vendorId: string;
    vendorName: string;
    category: VendorCategory;
    budgetCategoryId?: string;
    quotedAmount: number;
    guestCoverage: number;
    includedServices: string[];
    additionalCharges: string[];
    terms: string;
    missingInformation: string[];
    notes: string;
  }) => void;
}

export function QuotationModal({
  isOpen,
  onClose,
  editingQuotation,
  vendors,
  vendorCategories,
  budgetCategories,
  defaultGuestCount,
  initialVendorId = "",
  initialCategory = "Caterer",
  onSaveQuotation,
}: QuotationModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);

  const defaultVid = initialVendorId || (vendors[0]?.id || "");
  const defaultCat = initialCategory || (vendors.find((v) => v.id === defaultVid)?.category || "Caterer");

  const [vendorId, setVendorId] = React.useState(
    editingQuotation ? editingQuotation.vendorId : defaultVid
  );
  const [category, setCategory] = React.useState<VendorCategory>(
    editingQuotation ? editingQuotation.category : defaultCat
  );
  const [budgetCatId, setBudgetCatId] = React.useState(
    editingQuotation?.budgetCategoryId || ""
  );
  const [amount, setAmount] = React.useState<number | "">(
    editingQuotation ? editingQuotation.quotedAmount : ""
  );
  const [coverage, setCoverage] = React.useState<number | "">(
    editingQuotation ? (editingQuotation.guestCoverage || "") : defaultGuestCount
  );
  const [servicesText, setServicesText] = React.useState(
    editingQuotation ? editingQuotation.includedServices.join("\n") : ""
  );
  const [additionalChargesText, setAdditionalChargesText] = React.useState(
    editingQuotation ? editingQuotation.additionalCharges.join("\n") : ""
  );
  const [terms, setTerms] = React.useState(
    editingQuotation?.terms || ""
  );
  const [missingInfoText, setMissingInfoText] = React.useState(
    editingQuotation ? editingQuotation.missingInformation.join("\n") : ""
  );
  const [notes, setNotes] = React.useState(
    editingQuotation?.notes || ""
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vObj = vendors.find((v) => v.id === vendorId);
    if (!vObj || !amount) return;

    const includedServices = servicesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const additionalCharges = additionalChargesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const missingInformation = missingInfoText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    onSaveQuotation({
      vendorId: vObj.id,
      vendorName: vObj.name,
      category,
      budgetCategoryId: budgetCatId || undefined,
      quotedAmount: Number(amount),
      guestCoverage: Number(coverage) || 0,
      includedServices,
      additionalCharges,
      terms: terms.trim(),
      missingInformation,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quotation-modal-title"
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-[#EBE5DC] space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
          <h3 id="quotation-modal-title" className="font-serif text-xl font-bold text-[#1F1A17]">
            {editingQuotation ? "Edit Quotation Details" : "Record Vendor Quotation"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quotation dialog"
            className="text-[#6B635B] hover:text-[#1F1A17] text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#1F1A17] block mb-1">Vendor *</label>
              <select
                required
                value={vendorId}
                onChange={(e) => {
                  const vid = e.target.value;
                  setVendorId(vid);
                  const vObj = vendors.find((v) => v.id === vid);
                  if (vObj) setCategory(vObj.category);
                }}
                className="w-full px-3 py-2 bg-white border border-[#EBE5DC] rounded-xl text-xs text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#1F1A17] block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VendorCategory)}
                className="w-full px-3 py-2 bg-white border border-[#EBE5DC] rounded-xl text-xs text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
              >
                {vendorCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#1F1A17] block mb-1">
                Quoted Total Amount (₹) *
              </label>
              <Input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 420000"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-[#1F1A17] block mb-1">
                Guest Coverage (Pax)
              </label>
              <Input
                type="number"
                min={0}
                value={coverage}
                onChange={(e) => setCoverage(e.target.value ? Number(e.target.value) : "")}
                placeholder={`e.g. ${defaultGuestCount}`}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#1F1A17] block mb-1">
              Connect to Budget Category (Optional)
            </label>
            <select
              value={budgetCatId}
              onChange={(e) => setBudgetCatId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#EBE5DC] rounded-xl text-xs text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
            >
              <option value="">-- None (Do not connect to budget) --</option>
              {budgetCategories.map((bc) => (
                <option key={bc.id} value={bc.id}>
                  {bc.name} (Estimated: {formatCurrency(bc.estimatedAmount)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#1F1A17] block mb-1">
              Included Services / Deliverables (One per line) *
            </label>
            <Textarea
              required
              value={servicesText}
              onChange={(e) => setServicesText(e.target.value)}
              placeholder="4 Live interactive food stalls&#10;North & South Indian buffet&#10;Welcome royal mocktails&#10;Premium bone china crockery"
              rows={4}
              className="text-xs font-sans"
            />
          </div>

          <div>
            <label className="font-semibold text-[#C05621] block mb-1">
              Additional Charges / Exclusions (One per line)
            </label>
            <Textarea
              value={additionalChargesText}
              onChange={(e) => setAdditionalChargesText(e.target.value)}
              placeholder="18% GST extra on final invoice&#10;Packaged mineral water billed per crate on consumption&#10;Overtime ₹5,000/hr past 1:00 AM"
              rows={2}
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-[#C8963E] block mb-1">
              Missing Information to Clarify (One per line)
            </label>
            <Textarea
              value={missingInfoText}
              onChange={(e) => setMissingInfoText(e.target.value)}
              placeholder="Minimum guarantee plate policy not stated&#10;DG generator fuel inclusion unverified"
              rows={2}
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-[#1F1A17] block mb-1">Commercial Terms</label>
            <Input
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g. 25% booking deposit, 50% on event day, 25% post-event."
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-[#1F1A17] block mb-1">Internal Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Valid until next Monday. Direct owner contact."
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EBE5DC]">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingQuotation ? "Update Quotation" : "Save Quotation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
