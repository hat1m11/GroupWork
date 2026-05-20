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
  isOwner?: boolean;
  subtaskCounts: Record<string, { total: number; completed: number }>;
  onCreateTask: () => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  onPriorityChange: (taskId: string, priority: Task["priority"]) => void;
  onReassign?: (taskId: string, userId: string | null) => void;
  onDeleteTask: (taskId: string) => void;
}

const COLUMNS = [
  { label: "To do",       status: "todo"        as const, color: "text-gray-500",   dot: "bg-gray-300"    },
  { label: "In progress", status: "in_progress" as const, color: "text-indigo-600", dot: "bg-indigo-400"  },
  { label: "Done",        status: "done"        as const, color: "text-green-600",  dot: "bg-green-400"   },
];

function EmptyCol({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-40">
      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
        <span className="text-gray-300 text-lg leading-none">+</span>
      </div>
      <p className="text-xs text-gray-400">No {label.toLowerCase()} tasks</p>
    </div>
  );
}

export default function RubricSectionColumn({
  section, tasks, members, progress, currentUserId, isOwner = false,
  subtaskCounts, onCreateTask, onStatusChange, onPriorityChange, onReassign, onDeleteTask,
}: Props) {
  const blocked = tasks.filter((t) => t.status === "blocked");
  const columns = COLUMNS.map((col) => ({
    ...col,
    items: tasks.filter((t) => t.status === col.status),
  }));
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Section header */}
      <div className="px-5 pt-5 pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-gray-900">{section.title}</h2>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              {section.weight_pct}% weight
            </span>
          </div>
          <button
            onClick={onCreateTask}
            className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 font-medium px-3 py-1.5 rounded-lg transition-colors"
            title="Add a new task to this section"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add task
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress === 100 ? "bg-green-500" : progress > 50 ? "bg-indigo-500" : "bg-indigo-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 w-8 text-right">{progress}%</span>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {doneCount} of {tasks.length} tasks complete · contributes{" "}
          <span className="font-semibold text-gray-500">{((section.weight_pct * progress) / 100).toFixed(1)}%</span> to final grade
        </p>
      </div>

      {/* Blocked tasks - shown above the kanban if any */}
      {blocked.length > 0 && (
        <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            ⛔ Blocked ({blocked.length}) — needs attention
          </p>
          <div className="space-y-2">
            {blocked.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                members={members}
                currentUserId={currentUserId}
                isOwner={isOwner}
                subtaskCount={subtaskCounts[task.id]}
                onStatusChange={onStatusChange}
                onPriorityChange={onPriorityChange}
                onReassign={onReassign}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        {columns.map(({ label, status, color, dot, items }) => (
          <div key={status} className="flex flex-col min-h-[160px]">
            <div className="px-3 pt-3 pb-2 flex items-center gap-1.5 border-b border-gray-50">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
              <p className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</p>
              <span className="ml-auto text-xs text-gray-300 font-medium">{items.length}</span>
            </div>
            <div className="flex-1 p-2.5 space-y-2">
              {items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  members={members}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                  subtaskCount={subtaskCounts[task.id]}
                  onStatusChange={onStatusChange}
                  onPriorityChange={onPriorityChange}
                  onReassign={onReassign}
                  onDelete={onDeleteTask}
                />
              ))}
              {items.length === 0 && <EmptyCol label={label} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
