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
}

export default function TaskBoard({
  groupId,
  rubricSections,
  initialTasks,
  members,
  currentUserId,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [createFor, setCreateFor] = useState<string | null>(null);

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
        // Revert on failure
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

  const handleDeleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  }, []);

  return (
    <div className="space-y-6">
      {rubricSections.map((section) => {
        const sectionTasks = tasks.filter(
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
            onCreateTask={() => setCreateFor(section.id)}
            onStatusChange={handleStatusChange}
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
