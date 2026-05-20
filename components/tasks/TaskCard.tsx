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
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: Task["priority"]; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TAG_COLORS: Record<string, string> = {
  research: "bg-purple-100 text-purple-700",
  writing:  "bg-blue-100 text-blue-700",
  review:   "bg-yellow-100 text-yellow-700",
  design:   "bg-pink-100 text-pink-700",
  code:     "bg-green-100 text-green-700",
};

function cardAge(updatedAt: string): number {
  return (Date.now() - new Date(updatedAt).getTime()) / 86400000;
}

function ageOpacity(days: number): string {
  if (days < 1) return "opacity-100";
  if (days < 3) return "opacity-90";
  if (days < 7) return "opacity-75";
  return "opacity-60";
}

interface Props {
  task: Task;
  members: Member[];
  currentUserId: string;
  isOwner?: boolean;
  subtaskCount?: { total: number; completed: number };
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  onPriorityChange: (taskId: string, priority: Task["priority"]) => void;
  onReassign?: (taskId: string, userId: string | null) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({
  task,
  members,
  currentUserId,
  isOwner = false,
  subtaskCount,
  onStatusChange,
  onPriorityChange,
  onReassign,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[] | null>(null);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);

  const assignee = members.find((m) => m.id === task.assigned_to);
  const isOverdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  const isBlocked = task.status === "blocked";
  const ageDays = cardAge(task.updated_at);
  const opacity = task.status === "done" ? "opacity-75" : ageOpacity(ageDays);

  const subtaskPct = subtaskCount && subtaskCount.total > 0
    ? Math.round((subtaskCount.completed / subtaskCount.total) * 100)
    : null;

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

  function cycleStatus() {
    const cycle: Record<Task["status"], Task["status"]> = {
      todo: "in_progress",
      in_progress: "done",
      done: "todo",
      blocked: "todo",
    };
    onStatusChange(task.id, cycle[task.status]);
  }

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm p-3 text-sm transition-opacity ${opacity} ${
        task.status === "done"
          ? "border-green-100"
          : isBlocked
          ? "border-orange-300 bg-orange-50/30"
          : isOverdue
          ? "border-red-200"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className={`font-medium text-gray-900 leading-snug flex-1 ${task.status === "done" ? "line-through text-gray-400" : ""}`}>
          {isBlocked && <span className="text-orange-500 mr-1">⛔</span>}
          {task.title}
        </p>
        <button
          onClick={cycleStatus}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors ${
            task.status === "done"
              ? "bg-green-500 border-green-500"
              : task.status === "in_progress"
              ? "border-indigo-400 bg-indigo-100"
              : isBlocked
              ? "border-orange-400 bg-orange-100"
              : "border-gray-300 hover:border-indigo-400"
          }`}
          title="Cycle status"
        />
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {task.tags.map((tag) => (
            <span key={tag} className={`text-xs rounded px-1.5 py-0.5 font-medium ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600"}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtask progress bar */}
      {subtaskCount && subtaskCount.total > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all"
              style={{ width: `${subtaskPct}%` }}
            />
          </div>
          <button
            onClick={handleToggleSubtasks}
            className="text-xs text-gray-400 hover:text-indigo-600 whitespace-nowrap transition-colors"
          >
            {subtaskCount.completed}/{subtaskCount.total}
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {assignee && (
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {assignee.full_name ?? assignee.email.split("@")[0]}
            </span>
          )}
          {task.due_date && (
            <span className={`text-xs rounded-full px-2 py-0.5 ${isOverdue ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
              {new Date(task.due_date).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
            </span>
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
                  <button key={s.value} onClick={() => { onStatusChange(task.id, s.value); setMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                    {s.label}
                  </button>
                ))}

                {isOwner && onReassign && (
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Reassign to</p>
                    <button onClick={() => { onReassign(task.id, null); setMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                      Unassigned
                    </button>
                    {members.filter((m) => m.id !== task.assigned_to).map((m) => (
                      <button key={m.id} onClick={() => { onReassign(task.id, m.id); setMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                        {m.full_name ?? m.email.split("@")[0]}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Priority</p>
                  {PRIORITY_OPTIONS.filter((p) => p.value !== task.priority).map((p) => (
                    <button key={p.value} onClick={() => { onPriorityChange(task.id, p.value); setMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button onClick={() => { handleToggleSubtasks(); setMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                    {showSubtasks ? "Hide subtasks" : "Show subtasks"}
                  </button>
                  <button onClick={() => { onDelete(task.id); setMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50">
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
              onCountChange={() => {}}
            />
          )}
        </div>
      )}
    </div>
  );
}
