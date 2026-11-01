import * as React from "react";
import {
  Check,
  Clock,
  AlertCircle,
  GitBranch,
  Calendar,
  Edit2,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { EventTask, TaskStatus } from "@/types/event";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants";

export interface TaskCardProps {
  task: EventTask;
  isOverdue: boolean;
  dependencyTasks: EventTask[];
  onToggleComplete: (task: EventTask) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: EventTask) => void;
  onDelete: (id: string, title: string) => void;
}

export function TaskCard({
  task,
  isOverdue,
  dependencyTasks,
  onToggleComplete,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isCompleted = task.status === "Completed";
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
  const statusConfig = TASK_STATUS_CONFIG[task.status];

  return (
    <Card
      className={`p-5 transition-all border ${
        isCompleted
          ? "bg-[#FAF8F5]/80 border-[#EBE5DC] opacity-80"
          : isOverdue
          ? "bg-white border-[#C05621]/40 shadow-xs"
          : "bg-white border-[#EBE5DC] hover:border-[#C8963E]"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        {/* Checkbox and Task Title */}
        <div className="flex items-start gap-3.5 flex-1">
          <button
            type="button"
            onClick={() => onToggleComplete(task)}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
              isCompleted
                ? "bg-[#3F7A56] border-[#3F7A56] text-white"
                : "border-[#6B635B]/40 hover:border-[#5B1D2E] bg-white"
            }`}
            title={isCompleted ? "Mark incomplete" : "Mark completed"}
          >
            {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
          </button>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`font-semibold text-base ${
                  isCompleted ? "line-through text-[#6B635B]" : "text-[#1F1A17]"
                }`}
              >
                {task.title}
              </h3>

              {/* Priority Badge */}
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: priorityConfig.bg,
                  color: priorityConfig.color,
                  borderColor: priorityConfig.border,
                  borderWidth: "1px",
                }}
              >
                {task.priority}
              </span>

              {/* Status Badge */}
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: statusConfig.bg,
                  color: statusConfig.color,
                }}
              >
                {task.status}
              </span>

              {/* Overdue Badge */}
              {isOverdue && (
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#FFF5F0] text-[#C05621] border border-[#C05621]/30 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Overdue
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-[#6B635B] leading-relaxed max-w-2xl">
                {task.description}
              </p>
            )}

            {/* Dependencies & Blockers Display */}
            {dependencyTasks.length > 0 && (
              <div className="pt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-medium text-[#6B635B] flex items-center gap-1">
                  <GitBranch className="w-3 h-3" /> Depends on:
                </span>
                {dependencyTasks.map((dep) => (
                  <span
                    key={dep.id}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium border flex items-center gap-1 ${
                      dep.status === "Completed"
                        ? "bg-[#F0F7F3] text-[#3F7A56] border-[#3F7A56]/20"
                        : "bg-[#FFF5F0] text-[#C05621] border-[#C05621]/30"
                    }`}
                    title={
                      dep.status === "Completed"
                        ? "Prerequisite fulfilled"
                        : "Prerequisite not completed"
                    }
                  >
                    {dep.status === "Completed" ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <Clock className="w-2.5 h-2.5" />
                    )}
                    {dep.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deadline & Actions */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EBE5DC]">
          <div className="flex items-center gap-1.5 text-xs text-[#6B635B] font-mono">
            <Calendar className="w-3.5 h-3.5" />
            <span>Due: {task.dueDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Status Dropdown */}
            <select
              value={task.status}
              onChange={(e) =>
                onStatusChange(task.id, e.target.value as TaskStatus)
              }
              className="bg-white border border-[#EBE5DC] text-xs font-medium text-[#1F1A17] rounded-lg px-2 py-1 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#5B1D2E]"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>

            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-[#6B635B] hover:text-[#5B1D2E] hover:bg-[#F5F2EB] transition-colors"
              title="Edit Task"
              aria-label={`Edit task ${task.title}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id, task.title)}
              className="p-1.5 rounded-lg text-[#6B635B] hover:text-[#C05621] hover:bg-[#F5F2EB] transition-colors"
              title="Delete Task"
              aria-label={`Delete task ${task.title}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
