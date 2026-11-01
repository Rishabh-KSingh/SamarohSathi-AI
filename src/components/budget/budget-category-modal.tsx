import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { BudgetCategory, CategoryPriority } from "@/types/event";

export interface BudgetCategoryFormData {
  name: string;
  estimatedAmount: number;
  actualAmount: number;
  priority: CategoryPriority;
  notes: string;
}

export interface BudgetCategoryModalProps {
  isOpen: boolean;
  category?: BudgetCategory | null;
  currencySymbol: string;
  onClose: () => void;
  onSave: (data: BudgetCategoryFormData) => void;
}

export function BudgetCategoryModal({
  isOpen,
  category,
  currencySymbol,
  onClose,
  onSave,
}: BudgetCategoryModalProps) {
  const isEditing = Boolean(category);
  const modalRef = useModalA11y(isOpen, onClose);

  const [name, setName] = React.useState(category?.name || "");
  const [estimated, setEstimated] = React.useState<number | "">(
    typeof category?.estimatedAmount === "number" ? category.estimatedAmount : ""
  );
  const [actual, setActual] = React.useState<number | "">(
    typeof category?.actualAmount === "number" ? category.actualAmount : ""
  );
  const [priority, setPriority] = React.useState<CategoryPriority>(
    category?.priority || "Medium"
  );
  const [notes, setNotes] = React.useState(category?.notes || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      estimatedAmount: Number(estimated) || 0,
      actualAmount: Number(actual) || 0,
      priority,
      notes: notes.trim(),
    });
  };

  const title = isEditing ? "Edit Expense Category" : "Add Expense Category";
  const titleId = isEditing ? "edit-category-modal-title" : "add-category-modal-title";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#EBE5DC] space-y-5 animate-in fade-in-50 zoom-in-95"
      >
        <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
          <h3 id={titleId} className="font-serif text-xl font-bold text-[#1F1A17]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-[#6B635B] hover:text-[#1F1A17] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
              Category Name *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Traditional Mehendi Artist, Baraat Brass Band"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                Estimated Amount ({currencySymbol}) *
              </label>
              <Input
                type="number"
                required
                min="0"
                placeholder="e.g. 25000"
                value={estimated}
                onChange={(e) =>
                  setEstimated(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                Actual Paid ({currencySymbol})
              </label>
              <Input
                type="number"
                min="0"
                placeholder="0 if not paid yet"
                value={actual}
                onChange={(e) =>
                  setActual(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
              Category Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as CategoryPriority)}
              className="w-full bg-white border border-[#EBE5DC] rounded-xl px-3 py-2 text-sm text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
            >
              <option value="High">High Priority (Essential)</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority (Flexible)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
              {isEditing ? "Notes & Disclaimer" : "Notes / Vendor Assumptions"}
            </label>
            <Textarea
              placeholder="Enter notes, vendor contact or package inclusions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={isEditing ? 3 : 2}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE5DC]">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEditing ? "Update Category" : "Save Category"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
