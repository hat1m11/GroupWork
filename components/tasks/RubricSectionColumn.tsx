"use client";

import type { RubricSection, Task } from "@/lib/supabase/types";
import TaskCard from "./TaskCard";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  section: RubricSection;
  tasks: Task[];
  members: Member[];
  progress: number;
  currentUserId: string;
  onCreateTask: () => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function RubricSectionColumn({
  section,
  tasks,
  members,
  progress,
  currentUserId,
  onCreateTask,
  onStatusChange,
  onDeleteTask,
}: Props) {
  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Section header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-900 text-lg">{section.title}</h2>
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {section.weight_pct}%
            </span>
          </div>
          <button
            onClick={onCreateTask}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            + Add task
          </button>
        </div>

        {/* Weighted progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium w-10 text-right">
            {progress}%
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-1">
          {tasks.filter((t) => t.status === "done").length}/{tasks.length} tasks done
          &nbsp;·&nbsp;weighted contribution:{" "}
          <span className="font-medium text-gray-500">
            {((section.weight_pct * progress) / 100).toFixed(1)}%
          </span>
        </p>
      </div>

      {/* Task columns */}
      <div className="grid grid-cols-3 gap-px bg-gray-100 border-t border-gray-100">
        {[
          { label: "To do", items: todo, status: "todo" as const },
          { label: "In progress", items: inProgress, status: "in_progress" as const },
          { label: "Done", items: done, status: "done" as const },
        ].map(({ label, items, status }) => (
          <div key={status} className="bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {label}
            </p>
            <div className="space-y-2">
              {items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  members={members}
                  currentUserId={currentUserId}
                  onStatusChange={onStatusChange}
                  onDelete={onDeleteTask}
                />
              ))}
              {items.length === 0 && (
                <p className="text-xs text-gray-300 text-center py-4">Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
