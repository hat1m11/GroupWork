"use client";

import { useState } from "react";
import type { Task, Subtask } from "@/lib/supabase/types";
import PriorityBadge from "./PriorityBadge";
import SubtaskChecklist from "./SubtaskChecklist";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}

const STATUS_OPTIONS: { value: Task["status"]; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: Task["priority"]; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

interface Props {
  task: Task;
  members: Member[];
  currentUserId: string;
  subtaskCount?: { total: number; completed: number };
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  onPriorityChange: (taskId: string, priority: Task["priority"]) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({
  task,
  members,
  currentUserId,
  subtaskCount,
  onStatusChange,
  onPriorityChange,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[] | null>(null);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);

  const assignee = members.find((m) => m.id === task.assigned_to);

  const isOverdue =
    task.due_date &&
    task.status !== "done" &&
    new Date(task.due_date) < new Date();

  async function handleToggleSubtasks() {
    if (!showSubtasks && subtasks === null) {
      setLoadingSubtasks(true);
      try {
        const res = await fetch(`/api/subtasks?task_id=${task.id}`);
        const data = await res.json();
        setSubtasks(data.subtasks ?? []);
      } finally {
        setLoadingSubtasks(false);
      }
    }
    setShowSubtasks((v) => !v);
  }

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm p-3 text-sm ${
        task.status === "done"
          ? "border-green-100 opacity-75"
          : isOverdue
          ? "border-red-200"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p
          className={`font-medium text-gray-900 leading-snug flex-1 ${
            task.status === "done" ? "line-through text-gray-400" : ""
          }`}
        >
          {task.title}
        </p>

        <button
          onClick={() => {
            const next =
              task.status === "todo"
                ? "in_progress"
                : task.status === "in_progress"
                ? "done"
                : "todo";
            onStatusChange(task.id, next as Task["status"]);
          }}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors ${
            task.status === "done"
              ? "bg-green-500 border-green-500"
              : task.status === "in_progress"
              ? "border-indigo-400 bg-indigo-100"
              : "border-gray-300 hover:border-indigo-400"
          }`}
          title="Cycle status"
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {assignee && (
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {assignee.full_name ?? assignee.email.split("@")[0]}
            </span>
          )}
          {task.due_date && (
            <span
              className={`text-xs rounded-full px-2 py-0.5 ${
                isOverdue
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {new Date(task.due_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          {subtaskCount && subtaskCount.total > 0 && (
            <button
              onClick={handleToggleSubtasks}
              className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              {subtaskCount.completed}/{subtaskCount.total} done
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-gray-300 hover:text-gray-600 text-lg leading-none px-1"
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Move to</p>
                {STATUS_OPTIONS.filter((s) => s.value !== task.status).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { onStatusChange(task.id, s.value); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {s.label}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Priority</p>
                  {PRIORITY_OPTIONS.filter((p) => p.value !== task.priority).map((p) => (
                    <button
                      key={p.value}
                      onClick={() => { onPriorityChange(task.id, p.value); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { handleToggleSubtasks(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {showSubtasks ? "Hide subtasks" : "Show subtasks"}
                  </button>
                  <button
                    onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showSubtasks && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          {loadingSubtasks ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : (
            <SubtaskChecklist
              taskId={task.id}
              initialSubtasks={subtasks ?? []}
              onCountChange={(total, completed) => {
                setSubtasks((prev) =>
                  prev
                    ? prev
                    : Array.from({ length: total }, (_, i) => ({
                        id: String(i),
                        task_id: task.id,
                        title: "",
                        completed: i < completed,
                        sort_order: i,
                        created_at: "",
                      }))
                );
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
