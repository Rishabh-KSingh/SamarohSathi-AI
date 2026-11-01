import * as React from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { EventTask, TaskPriority, TaskStatus } from "@/types/event";

export interface TaskFormData {
  title: string;
  description: string;
  startDate?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  dependencyIds: string[];
}

export interface TaskModalProps {
  isOpen: boolean;
  task?: EventTask | null;
  allTasks: EventTask[];
  cycleError: string | null;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
}

export function TaskModal({
  isOpen,
  task,
  allTasks,
  cycleError,
  onClose,
  onSave,
}: TaskModalProps) {
  const isEditing = Boolean(task);
  const modalRef = useModalA11y(isOpen, onClose);

  const [title, setTitle] = React.useState(task?.title || "");
  const [description, setDescription] = React.useState(task?.description || "");
  const [startDate, setStartDate] = React.useState(task?.startDate || "");
  const [dueDate, setDueDate] = React.useState(task?.dueDate || "");
  const [priority, setPriority] = React.useState<TaskPriority>(task?.priority || "Medium");
  const [status, setStatus] = React.useState<TaskStatus>(task?.status || "Not Started");
  const [dependencyIds, setDependencyIds] = React.useState<string[]>(task?.dependencyIds || []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      startDate: startDate || undefined,
      dueDate,
      priority,
      status,
      dependencyIds,
    });
  };

  const titleText = isEditing ? "Edit Task & Dependencies" : "Add Celebration Task";
  const titleId = isEditing ? "edit-task-modal-title" : "add-task-modal-title";

  // When editing, do not allow a task to depend on itself
  const selectableTasks = isEditing ? allTasks.filter((t) => t.id !== task?.id) : allTasks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#EBE5DC] space-y-5 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
          <h3 id={titleId} className="font-serif text-xl font-bold text-[#1F1A17]">
            {titleText}
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

        {cycleError && (
          <div className="p-3 bg-[#FFF5F0] border border-[#C05621] rounded-xl flex items-start gap-2 text-xs text-[#C05621]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{cycleError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
              Task Title *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Schedule Pandit Ji for Muhurat Pooja"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
              Description & Instructions
            </label>
            <Textarea
              placeholder="Details, key contacts, or specific checklist items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                Deadline (Due Date) *
              </label>
              <Input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-white border border-[#EBE5DC] rounded-xl px-3 py-2 text-sm text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                {isEditing ? "Current Status" : "Initial Status"}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-white border border-[#EBE5DC] rounded-xl px-3 py-2 text-sm text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>
          </div>

          {/* Prerequisite Dependencies Multi-select */}
          {selectableTasks.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                {isEditing
                  ? "Prerequisites (Dependencies)"
                  : "Prerequisites (Tasks that must be done first)"}
              </label>
              <p className="text-[11px] text-[#6B635B] mb-2">
                {isEditing
                  ? "Cannot depend on itself or any task that transitively depends on it."
                  : "Cycle prevention is actively enforced to maintain a valid workflow."}
              </p>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#F5F2EB]/60 rounded-xl border border-[#EBE5DC]">
                {selectableTasks.map((t) => {
                  const isChecked = dependencyIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDependencyIds((prev) => [...prev, t.id]);
                          } else {
                            setDependencyIds((prev) => prev.filter((id) => id !== t.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-[#5B1D2E] focus:ring-[#5B1D2E]"
                      />
                      <span className="font-medium text-[#1F1A17]">{t.title}</span>
                      <span className="text-[10px] text-[#6B635B] ml-auto">
                        Due: {t.dueDate}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE5DC]">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEditing ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
