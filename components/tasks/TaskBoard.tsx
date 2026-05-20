"use client";

import { useState, useCallback } from "react";
import type { RubricSection, Task } from "@/lib/supabase/types";
import RubricSectionColumn from "./RubricSectionColumn";
import CreateTaskModal from "./CreateTaskModal";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  groupId: string;
  rubricSections: RubricSection[];
  initialTasks: Task[];
  members: Member[];
  currentUserId: string;
  isOwner?: boolean;
  subtaskCounts?: Record<string, { total: number; completed: number }>;
}

const PRIORITY_ORDER: Record<Task["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function TaskBoard({
  groupId,
  rubricSections,
  initialTasks,
  members,
  currentUserId,
  isOwner = false,
  subtaskCounts = {},
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [createFor, setCreateFor] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Task["priority"] | "">("");
  const [filterTag, setFilterTag] = useState("");
  const [hideBlocked, setHideBlocked] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(false);
  const ALL_TAGS = ["research", "writing", "review", "design", "code"];

  const handleTaskCreated = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
    setCreateFor(null);
  }, []);

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: Task["status"]) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: tasks.find((x) => x.id === taskId)!.status }
              : t
          )
        );
      }
    },
    [tasks]
  );

  const handlePriorityChange = useCallback(
    async (taskId: string, newPriority: Task["priority"]) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t))
      );
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
    },
    []
  );

  const handleReassign = useCallback(async (taskId: string, userId: string | null) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assigned_to: userId } : t)));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: userId }),
    });
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  }, []);

  const visibleTasks = tasks
    .filter((t) => !filterPriority || t.priority === filterPriority)
    .filter((t) => !filterTag || t.tags.includes(filterTag))
    .filter((t) => !hideBlocked || t.status !== "blocked")
    .sort((a, b) =>
      sortByPriority ? PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] : 0
    );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap bg-white border border-gray-200 rounded-xl px-3 py-2.5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Filter:</span>

        {/* Priority pills */}
        {(["", "urgent", "high", "medium", "low"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p as Task["priority"] | "")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
              filterPriority === p
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {p === "" ? "All priorities" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Tag pills */}
        {ALL_TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setFilterTag(filterTag === t ? "" : t)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
              filterTag === t
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {t}
          </button>
        ))}

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <button
          onClick={() => setSortByPriority((v) => !v)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
            sortByPriority
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
          }`}
          title="Sort tasks by priority within each column"
        >
          ↑ Priority order
        </button>
        <button
          onClick={() => setHideBlocked((v) => !v)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
            hideBlocked
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
          }`}
          title="Hide blocked tasks from the board"
        >
          ⛔ Hide blocked
        </button>

        {(filterPriority !== "" || filterTag !== "" || sortByPriority || hideBlocked) && (
          <button
            onClick={() => { setFilterPriority(""); setFilterTag(""); setSortByPriority(false); setHideBlocked(false); }}
            className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
            title="Clear all filters"
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {rubricSections.map((section) => {
        const sectionTasks = visibleTasks.filter(
          (t) => t.rubric_section_id === section.id
        );
        const doneTasks = sectionTasks.filter((t) => t.status === "done").length;
        const progress =
          sectionTasks.length > 0
            ? Math.round((doneTasks / sectionTasks.length) * 100)
            : 0;

        return (
          <RubricSectionColumn
            key={section.id}
            section={section}
            tasks={sectionTasks}
            members={members}
            progress={progress}
            currentUserId={currentUserId}
            isOwner={isOwner}
            subtaskCounts={subtaskCounts}
            onCreateTask={() => setCreateFor(section.id)}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onReassign={handleReassign}
            onDeleteTask={handleDeleteTask}
          />
        );
      })}

      {rubricSections.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No rubric sections defined for this group.
        </div>
      )}

      {createFor && (
        <CreateTaskModal
          groupId={groupId}
          rubricSectionId={createFor}
          members={members}
          onCreated={handleTaskCreated}
          onClose={() => setCreateFor(null)}
        />
      )}
    </div>
  );
}
