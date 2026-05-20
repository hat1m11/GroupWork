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
  const [sortByPriority, setSortByPriority] = useState(false);

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
    .sort((a, b) =>
      sortByPriority ? PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] : 0
    );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as Task["priority"] | "")}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none bg-white"
        >
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sortByPriority}
            onChange={(e) => setSortByPriority(e.target.checked)}
            className="rounded"
          />
          Sort by priority
        </label>
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
