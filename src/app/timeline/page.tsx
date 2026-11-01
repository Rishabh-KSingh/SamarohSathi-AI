"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  Search,
  GitBranch,
  Calendar,
  X,
  Check,
  RefreshCw,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { EventData, EventTask, TaskPriority, TaskStatus } from "@/types/event";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants";

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

  // Form states for Add Task
  const [newTitle, setNewTitle] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newStartDate, setNewStartDate] = React.useState("");
  const [newDueDate, setNewDueDate] = React.useState("");
  const [newPriority, setNewPriority] = React.useState<TaskPriority>("Medium");
  const [newStatus, setNewStatus] = React.useState<TaskStatus>("Not Started");
  const [newDependencies, setNewDependencies] = React.useState<string[]>([]);

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
  const isTaskOverdue = (task: EventTask): boolean => {
    if (task.status === "Completed") return false;
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

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
  }, [tasks, activeTab, searchQuery]);

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
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !newTitle.trim() || !newDueDate) return;

    setCycleError(null);

    // Create a temporary ID to test for cycles if dependencies are selected
    const tempId = `temp_${Date.now()}`;
    if (newDependencies.length > 0) {
      const cycleCheck = detectDependencyCycle(tasks, tempId, newDependencies);
      if (cycleCheck.hasCycle) {
        setCycleError(cycleCheck.errorMessage || "Circular dependency detected. Please adjust prerequisites.");
        return;
      }
    }

    const added = addTask(event.id, {
      title: newTitle.trim(),
      description: newDescription.trim(),
      startDate: newStartDate || undefined,
      dueDate: newDueDate,
      priority: newPriority,
      status: newStatus,
      dependencyIds: newDependencies,
    });

    setTasks((prev) => [...prev, added]);
    setIsAddModalOpen(false);

    // Reset form
    setNewTitle("");
    setNewDescription("");
    setNewStartDate("");
    setNewDueDate("");
    setNewPriority("Medium");
    setNewStatus("Not Started");
    setNewDependencies([]);
    setCycleError(null);
  };

  // Edit Task with Cycle Prevention Check
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim() || !editingTask.dueDate) return;

    setCycleError(null);

    // Cycle check: Ensure task does not create a cycle with its new dependencyIds
    const cycleCheck = detectDependencyCycle(tasks, editingTask.id, editingTask.dependencyIds);
    if (cycleCheck.hasCycle) {
      setCycleError(cycleCheck.errorMessage || "Circular dependency detected. A task cannot depend on a successor.");
      return;
    }

    const updated = updateTask(editingTask.id, {
      title: editingTask.title.trim(),
      description: editingTask.description.trim(),
      startDate: editingTask.startDate || undefined,
      dueDate: editingTask.dueDate,
      priority: editingTask.priority,
      status: editingTask.status,
      dependencyIds: editingTask.dependencyIds,
    });

    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
    setEditingTask(null);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Overall Completion */}
          <Card className="p-5 border-[#EBE5DC]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
                Task Completion
              </span>
              <span className="text-[11px] font-semibold text-[#3F7A56] bg-[#F0F7F3] px-2 py-0.5 rounded-full">
                {completionPercentage}% Done
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-serif text-2xl font-bold text-[#1F1A17]">
                {completedTasks}
              </span>
              <span className="text-sm text-[#6B635B]">/ {totalTasks} Tasks</span>
            </div>
            <div className="w-full h-2 bg-[#EBE5DC] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#3F7A56] transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </Card>

          {/* Card 2: In Progress */}
          <Card className="p-5 border-[#EBE5DC]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
              In Progress
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-serif text-2xl font-bold text-[#C8963E]">
                {inProgressTasks}
              </span>
              <span className="text-sm text-[#6B635B]">Active milestones</span>
            </div>
            <p className="text-[11px] text-[#6B635B] mt-1">
              Tasks currently being coordinated with vendors
            </p>
          </Card>

          {/* Card 3: Overdue Tasks */}
          <Card className="p-5 border-[#EBE5DC]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
                Overdue Deadlines
              </span>
              {overdueTasks > 0 && (
                <span className="text-[11px] font-semibold text-[#C05621] bg-[#FFF5F0] px-2 py-0.5 rounded-full animate-pulse">
                  Attention Needed
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`font-serif text-2xl font-bold ${
                  overdueTasks > 0 ? "text-[#C05621]" : "text-[#1F1A17]"
                }`}
              >
                {overdueTasks}
              </span>
              <span className="text-sm text-[#6B635B]">Tasks past due</span>
            </div>
            <p className="text-[11px] text-[#6B635B] mt-1">
              {overdueTasks > 0 ? "Requires date revision or vendor push" : "All deadlines currently on track"}
            </p>
          </Card>

          {/* Card 4: High Priority Pending */}
          <Card className="p-5 border-[#EBE5DC]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B635B]">
              Critical High Priority
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-serif text-2xl font-bold text-[#5B1D2E]">
                {tasks.filter((t) => t.priority === "High" && t.status !== "Completed").length}
              </span>
              <span className="text-sm text-[#6B635B]">Pending high-stakes</span>
            </div>
            <p className="text-[11px] text-[#6B635B] mt-1">
              Essential for core celebration execution
            </p>
          </Card>
        </div>

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
              const isCompleted = task.status === "Completed";
              const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
              const statusConfig = TASK_STATUS_CONFIG[task.status];

              // Prerequisite names
              const dependencyTasks = (task.dependencyIds || [])
                .map((id) => tasks.find((t) => t.id === id))
                .filter((t): t is EventTask => Boolean(t));

              return (
                <Card
                  key={task.id}
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
                        onClick={() => handleToggleComplete(task)}
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
                              isCompleted
                                ? "line-through text-[#6B635B]"
                                : "text-[#1F1A17]"
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
                                title={dep.status === "Completed" ? "Prerequisite fulfilled" : "Prerequisite not completed"}
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
                            handleStatusChange(task.id, e.target.value as TaskStatus)
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
                          onClick={() => {
                            setCycleError(null);
                            setEditingTask(task);
                          }}
                          className="p-1.5 rounded-lg text-[#6B635B] hover:text-[#5B1D2E] hover:bg-[#F5F2EB] transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="p-1.5 rounded-lg text-[#6B635B] hover:text-[#C05621] hover:bg-[#F5F2EB] transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Add Task */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#EBE5DC] space-y-5 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
                <h3 className="font-serif text-xl font-bold text-[#1F1A17]">
                  Add Celebration Task
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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

              <form onSubmit={handleAddTaskSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Task Title *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Schedule Pandit Ji for Muhurat Pooja"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Description & Instructions
                  </label>
                  <Textarea
                    placeholder="Details, key contacts, or specific checklist items..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
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
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Deadline (Due Date) *
                    </label>
                    <Input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Priority Level
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                      className="w-full bg-white border border-[#EBE5DC] rounded-xl px-3 py-2 text-sm text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Initial Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
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
                {tasks.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Prerequisites (Tasks that must be done first)
                    </label>
                    <p className="text-[11px] text-[#6B635B] mb-2">
                      Cycle prevention is actively enforced to maintain a valid workflow.
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#F5F2EB]/60 rounded-xl border border-[#EBE5DC]">
                      {tasks.map((t) => {
                        const isChecked = newDependencies.includes(t.id);
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
                                  setNewDependencies((prev) => [...prev, t.id]);
                                } else {
                                  setNewDependencies((prev) =>
                                    prev.filter((id) => id !== t.id)
                                  );
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create Task
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Task */}
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#EBE5DC] space-y-5 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
                <h3 className="font-serif text-xl font-bold text-[#1F1A17]">
                  Edit Task & Dependencies
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
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

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Task Title *
                  </label>
                  <Input
                    type="text"
                    required
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Description & Instructions
                  </label>
                  <Textarea
                    value={editingTask.description}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, description: e.target.value })
                    }
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
                      value={editingTask.startDate || ""}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Deadline (Due Date) *
                    </label>
                    <Input
                      type="date"
                      required
                      value={editingTask.dueDate}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Priority Level
                    </label>
                    <select
                      value={editingTask.priority}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          priority: e.target.value as TaskPriority,
                        })
                      }
                      className="w-full bg-white border border-[#EBE5DC] rounded-xl px-3 py-2 text-sm text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                      Current Status
                    </label>
                    <select
                      value={editingTask.status}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          status: e.target.value as TaskStatus,
                        })
                      }
                      className="w-full bg-white border border-[#EBE5DC] rounded-xl px-3 py-2 text-sm text-[#1F1A17] focus:outline-none focus:ring-2 focus:ring-[#5B1D2E]"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>
                </div>

                {/* Prerequisites Multi-select */}
                <div>
                  <label className="block text-xs font-semibold text-[#1F1A17] mb-1">
                    Prerequisites (Dependencies)
                  </label>
                  <p className="text-[11px] text-[#6B635B] mb-2">
                    Cannot depend on itself or any task that transitively depends on it.
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#F5F2EB]/60 rounded-xl border border-[#EBE5DC]">
                    {tasks
                      .filter((t) => t.id !== editingTask.id)
                      .map((t) => {
                        const isChecked = editingTask.dependencyIds.includes(t.id);
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
                                  setEditingTask({
                                    ...editingTask,
                                    dependencyIds: [...editingTask.dependencyIds, t.id],
                                  });
                                } else {
                                  setEditingTask({
                                    ...editingTask,
                                    dependencyIds: editingTask.dependencyIds.filter(
                                      (id) => id !== t.id
                                    ),
                                  });
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

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE5DC]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Update Task
                  </Button>
                </div>
              </form>
            </div>
          </div>
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
