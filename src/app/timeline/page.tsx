"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, ChevronDown, Search, X, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getActiveEvent,
  getEventById,
  getAllEvents,
  setActiveEventId,
  getTasksForEvent,
  saveTasksForEvent,
  addTask,
  updateTask,
  deleteTask,
} from "@/lib/storage";
import { generateDeterministicTasks, detectDependencyCycle } from "@/lib/planner-engine";
import { EventData, EventTask, TaskStatus } from "@/types/event";
import { TimelineMetrics } from "@/components/timeline/timeline-metrics";
import { TaskCard } from "@/components/timeline/task-card";
import { TaskModal, TaskFormData } from "@/components/timeline/task-modal";

type FilterTab = "all" | "upcoming" | "overdue" | "completed";

function TimelineTasksContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("event_id");

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [allEvents, setAllEvents] = React.useState<EventData[]>([]);
  const [tasks, setTasks] = React.useState<EventTask[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Filter & Search
  const [activeTab, setActiveTab] = React.useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<EventTask | null>(null);
  const [cycleError, setCycleError] = React.useState<string | null>(null);

  // Load active event & tasks
  const loadData = React.useCallback(() => {
    const events = getAllEvents();
    setAllEvents(events);

    let currentEvent: EventData | null = null;
    if (eventIdParam) {
      currentEvent = getEventById(eventIdParam);
      if (currentEvent) setActiveEventId(currentEvent.id);
    }
    if (!currentEvent) {
      currentEvent = getActiveEvent();
    }

    setEvent(currentEvent);

    if (currentEvent) {
      const taskList = getTasksForEvent(currentEvent.id);
      setTasks(taskList);
    } else {
      setTasks([]);
    }
    setIsLoaded(true);
  }, [eventIdParam]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    const handleStorageChange = () => loadData();
    window.addEventListener("samaroh_storage_change", handleStorageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("samaroh_storage_change", handleStorageChange);
    };
  }, [loadData]);

  // Handle Event switch
  const handleSelectEvent = (id: string) => {
    setActiveEventId(id);
    const selected = getEventById(id);
    if (selected) {
      setEvent(selected);
      setTasks(getTasksForEvent(id));
    }
  };

  // Helper to determine if a task is overdue deterministically
  const isTaskOverdue = React.useCallback((task: EventTask): boolean => {
    if (task.status === "Completed") return false;
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }, []);

  // Helper to determine if task is blocked by incomplete dependencies
  const getIncompleteDependencies = (task: EventTask): EventTask[] => {
    if (!task.dependencyIds || task.dependencyIds.length === 0) return [];
    return task.dependencyIds
      .map((id) => tasks.find((t) => t.id === id))
      .filter((dep): dep is EventTask => Boolean(dep && dep.status !== "Completed"));
  };

  // Deterministic metrics calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t)).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highPriorityPendingCount = tasks.filter(
    (t) => t.priority === "High" && t.status !== "Completed"
  ).length;

  // Filter tasks based on activeTab and searchQuery
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === "completed" && task.status !== "Completed") return false;
      if (activeTab === "overdue" && !isTaskOverdue(task)) return false;
      if (activeTab === "upcoming" && (task.status === "Completed" || isTaskOverdue(task))) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description.toLowerCase().includes(query);
        return matchesTitle || matchesDesc;
      }

      return true;
    });
  }, [tasks, activeTab, searchQuery, isTaskOverdue]);

  // Toggle complete / quick status change
  const handleToggleComplete = (task: EventTask) => {
    const nextStatus: TaskStatus = task.status === "Completed" ? "In Progress" : "Completed";

    // Warn if marking completed but dependencies are incomplete
    if (nextStatus === "Completed") {
      const blockers = getIncompleteDependencies(task);
      if (blockers.length > 0) {
        const blockerNames = blockers.map((b) => `"${b.title}"`).join(", ");
        const proceed = window.confirm(
          `Prerequisite Notice: This task depends on ${blockerNames}, which ${
            blockers.length === 1 ? "is" : "are"
          } not marked completed yet. Do you want to mark this task completed anyway?`
        );
        if (!proceed) return;
      }
    }

    const updated = updateTask(task.id, { status: nextStatus });
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  // Change Task Status
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const updated = updateTask(taskId, { status: newStatus });
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  // Add Task with Cycle Prevention Check
  const handleAddTask = (formData: TaskFormData) => {
    if (!event) return;

    setCycleError(null);

    // Create a temporary ID to test for cycles if dependencies are selected
    const tempId = `temp_${Date.now()}`;
    if (formData.dependencyIds.length > 0) {
      const cycleCheck = detectDependencyCycle(tasks, tempId, formData.dependencyIds);
      if (cycleCheck.hasCycle) {
        setCycleError(cycleCheck.errorMessage || "Circular dependency detected. Please adjust prerequisites.");
        return;
      }
    }

    const added = addTask(event.id, {
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      priority: formData.priority,
      status: formData.status,
      dependencyIds: formData.dependencyIds,
    });

    setTasks((prev) => [...prev, added]);
    setIsAddModalOpen(false);
    setCycleError(null);
  };

  // Edit Task with Cycle Prevention Check
  const handleSaveEdit = (formData: TaskFormData) => {
    if (!editingTask) return;

    setCycleError(null);

    // Cycle check: Ensure task does not create a cycle with its new dependencyIds
    const cycleCheck = detectDependencyCycle(tasks, editingTask.id, formData.dependencyIds);
    if (cycleCheck.hasCycle) {
      setCycleError(cycleCheck.errorMessage || "Circular dependency detected. A task cannot depend on a successor.");
      return;
    }

    const updated = updateTask(editingTask.id, {
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      priority: formData.priority,
      status: formData.status,
      dependencyIds: formData.dependencyIds,
    });

    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
    setEditingTask(null);
    setCycleError(null);
  };

  // Delete Task
  const handleDeleteTask = (id: string, title: string) => {
    if (window.confirm(`Delete task "${title}"? Any dependencies pointing to this task will also be unlinked.`)) {
      deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Reset to AI baseline tasks
  const handleResetToBaseline = () => {
    if (!event) return;
    if (
      window.confirm(
        "Reset timeline to the initial AI recommended tasks and dependencies? Your custom additions will be replaced."
      )
    ) {
      const regenerated = generateDeterministicTasks(event);
      saveTasksForEvent(event.id, regenerated);
      setTasks(regenerated);
    }
  };

  if (!isLoaded) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-sm text-[#6B635B]">
            <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin" />
            Loading Timeline & Tasks...
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <PageHeader
            eyebrow="Milestone Management"
            title="Smart Timeline & Task Manager"
            description="Manage sequential tasks, deadlines, and dependencies for your celebration."
          />
          <EmptyState
            title="No Celebration Selected"
            description="You need to create or select an active celebration to manage your timeline."
            action={
              <Link href="/onboarding">
                <Button variant="primary" size="md">
                  <Plus className="w-4 h-4" />
                  Create Celebration
                </Button>
              </Link>
            }
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Top Header & Event Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EBE5DC]">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="accent">Schedule & Milestones</Badge>
              <span className="text-xs font-semibold text-[#544E47] uppercase tracking-wider">
                Event Date: {event.eventDate || "Date TBD"}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1A17] tracking-tight mt-1">
              Timeline & Task Manager
            </h1>
            <p className="text-sm sm:text-base text-[#544E47] mt-0.5">
              Sequential celebration schedule with milestone and dependency tracking for &ldquo;{event.name}&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {allEvents.length > 1 && (
              <div className="relative">
                <select
                  value={event.id}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="appearance-none bg-white text-xs font-medium text-[#1F1A17] border border-[#EBE5DC] rounded-xl px-3 py-2 pr-8 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                >
                  {allEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.eventDate})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B635B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToBaseline}
              title="Reset to recommended AI task sequence"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Sequence
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCycleError(null);
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Milestone Progress Metrics */}
        <TimelineMetrics
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          inProgressTasks={inProgressTasks}
          overdueTasks={overdueTasks}
          completionPercentage={completionPercentage}
          highPriorityPendingCount={highPriorityPendingCount}
        />

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F5F2EB] rounded-xl border border-[#EBE5DC] overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-[#1F1A17] shadow-xs"
                  : "text-[#6B635B] hover:text-[#1F1A17]"
              }`}
            >
              All Tasks ({totalTasks})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "upcoming"
                  ? "bg-white text-[#1F1A17] shadow-xs"
                  : "text-[#6B635B] hover:text-[#1F1A17]"
              }`}
            >
              Upcoming ({tasks.filter((t) => t.status !== "Completed" && !isTaskOverdue(t)).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("overdue")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "overdue"
                  ? "bg-white text-[#C05621] shadow-xs"
                  : "text-[#6B635B] hover:text-[#C05621]"
              }`}
            >
              Overdue ({overdueTasks})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "completed"
                  ? "bg-white text-[#3F7A56] shadow-xs"
                  : "text-[#6B635B] hover:text-[#3F7A56]"
              }`}
            >
              Completed ({completedTasks})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-[#6B635B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks by title or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-xs text-[#1F1A17] border border-[#EBE5DC] rounded-xl pl-9 pr-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B635B] hover:text-[#1F1A17]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Task Cards List */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No tasks found matching your filter"
            description="Try switching tabs or searching with different keywords."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          <div className="space-y-3.5">
            {filteredTasks.map((task) => {
              const isOverdue = isTaskOverdue(task);
              const dependencyTasks = (task.dependencyIds || [])
                .map((id) => tasks.find((t) => t.id === id))
                .filter((t): t is EventTask => Boolean(t));

              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  isOverdue={isOverdue}
                  dependencyTasks={dependencyTasks}
                  onToggleComplete={handleToggleComplete}
                  onStatusChange={handleStatusChange}
                  onEdit={(t) => {
                    setCycleError(null);
                    setEditingTask(t);
                  }}
                  onDelete={handleDeleteTask}
                />
              );
            })}
          </div>
        )}

        {/* Modal: Add Task */}
        {isAddModalOpen && (
          <TaskModal
            key="add-task"
            isOpen={isAddModalOpen}
            allTasks={tasks}
            cycleError={cycleError}
            onClose={() => {
              setIsAddModalOpen(false);
              setCycleError(null);
            }}
            onSave={handleAddTask}
          />
        )}

        {/* Modal: Edit Task */}
        {editingTask && (
          <TaskModal
            key={`edit-task-${editingTask.id}`}
            isOpen={Boolean(editingTask)}
            task={editingTask}
            allTasks={tasks}
            cycleError={cycleError}
            onClose={() => {
              setEditingTask(null);
              setCycleError(null);
            }}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </AppLayout>
  );
}

export default function TimelineTasksPage() {
  return (
    <React.Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3 text-sm text-[#6B635B]">
              <span className="w-5 h-5 border-2 border-[#5B1D2E] border-t-transparent rounded-full animate-spin" />
              Loading Timeline & Tasks...
            </div>
          </div>
        </AppLayout>
      }
    >
      <TimelineTasksContent />
    </React.Suspense>
  );
}
