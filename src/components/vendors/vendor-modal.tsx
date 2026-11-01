"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Vendor, VendorCategory, VendorStatus } from "@/types/event";
import { useModalA11y } from "@/lib/use-modal-a11y";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVendor: Vendor | null;
  vendorCategories: VendorCategory[];
  vendorStatuses: VendorStatus[];
  initialCategory?: VendorCategory;
  onSaveVendor: (data: {
    name: string;
    category: VendorCategory;
    status: VendorStatus;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    requirements: string;
    notes: string;
  }) => void;
}

export function VendorModal({
  isOpen,
  onClose,
  editingVendor,
  vendorCategories,
  vendorStatuses,
  initialCategory = "Caterer",
  onSaveVendor,
}: VendorModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);

  const [name, setName] = React.useState(editingVendor ? editingVendor.name : "");
  const [category, setCategory] = React.useState<VendorCategory>(
    editingVendor ? editingVendor.category : initialCategory
  );
  const [status, setStatus] = React.useState<VendorStatus>(
    editingVendor ? editingVendor.status : "Researching"
  );
  const [contactPerson, setContactPerson] = React.useState(
    editingVendor?.contactDetails.contactPerson || ""
  );
  const [phone, setPhone] = React.useState(editingVendor?.contactDetails.phone || "");
  const [email, setEmail] = React.useState(editingVendor?.contactDetails.email || "");
  const [address, setAddress] = React.useState(editingVendor?.contactDetails.address || "");
  const [requirements, setRequirements] = React.useState(editingVendor?.requirements || "");
  const [notes, setNotes] = React.useState(editingVendor?.notes || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveVendor({
      name: name.trim(),
      category,
      status,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      requirements: requirements.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-modal-title"
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#EBE5DC] space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
          <h3 id="vendor-modal-title" className="font-serif text-xl font-bold text-[#1F1A17]">
            {editingVendor ? "Edit Vendor Details" : "Add Celebration Vendor"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close vendor dialog"
            className="text-[#6B635B] hover:text-[#1F1A17] text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#1F1A17] block mb-1">
              Vendor Business Name *
            </label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Royal Shahi Rasoi Caterers"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="font-semibold text-[#1F1A17] block mb-1">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
                className="w-full px-3 py-2 bg-white border border-[#EBE5DC] rounded-xl text-xs text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
              >
                {vendorStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#1F1A17] block mb-1">Contact Person</label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Vikram Rathore"
                className="text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-[#1F1A17] block mb-1">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98290 12345"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#1F1A17] block mb-1">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@vendor.com"
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-[#1F1A17] block mb-1">Address / City</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. MI Road, Jaipur, Rajasthan"
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-[#1F1A17] block mb-1">Your Requirements & Scope</label>
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="e.g. 220 pax pure vegetarian dinner with 4 live chaat counters..."
              rows={2}
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-[#1F1A17] block mb-1">Private Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Recommended by Sharma uncle. Tasting completed."
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EBE5DC]">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingVendor ? "Update Vendor" : "Save Vendor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
