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

const STATUS_CONFIG: Record<Task["status"], { label: string; dot: string; text: string; bg: string }> = {
  todo:        { label: "To do",       dot: "bg-gray-300",    text: "text-gray-600",   bg: "bg-gray-50 hover:bg-gray-100"    },
  in_progress: { label: "In progress", dot: "bg-indigo-400",  text: "text-indigo-700", bg: "bg-indigo-50 hover:bg-indigo-100" },
  done:        { label: "Done",        dot: "bg-green-400",   text: "text-green-700",  bg: "bg-green-50 hover:bg-green-100"   },
  blocked:     { label: "Blocked",     dot: "bg-orange-400",  text: "text-orange-700", bg: "bg-orange-50 hover:bg-orange-100" },
};

const STATUS_ORDER: Task["status"][] = ["todo", "in_progress", "blocked", "done"];

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

function ageClass(days: number, isDone: boolean): string {
  if (isDone) return "opacity-60";
  if (days < 1) return "";
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
  task, members, currentUserId, isOwner = false,
  subtaskCount, onStatusChange, onPriorityChange, onReassign, onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[] | null>(null);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);

  const assignee = members.find((m) => m.id === task.assigned_to);
  const isOverdue = task.due_date && task.status !== "done" && task.due_date < new Date().toISOString().slice(0, 10);
  const ageDays = cardAge(task.updated_at);
  const cfg = STATUS_CONFIG[task.status];
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

  return (
    <div className={`bg-white rounded-xl border shadow-sm text-sm transition-all ${ageClass(ageDays, task.status === "done")} ${
      task.status === "done" ? "border-green-100"
      : task.status === "blocked" ? "border-orange-200 bg-orange-50/20"
      : isOverdue ? "border-red-200"
      : "border-gray-200 hover:border-gray-300"
    }`}>
      <div className="p-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className={`font-medium leading-snug flex-1 ${
            task.status === "done" ? "line-through text-gray-400" : "text-gray-900"
          }`}>
            {task.title}
          </p>
          {/* Context menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="More options"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 min-w-[175px]">
                  {/* Move status */}
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Change status</p>
                  {STATUS_ORDER.filter((s) => s !== task.status).map((s) => {
                    const c = STATUS_CONFIG[s];
                    return (
                      <button key={s} onClick={() => { onStatusChange(task.id, s); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                        {c.label}
                      </button>
                    );
                  })}

                  {/* Priority */}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Set priority</p>
                    {PRIORITY_OPTIONS.filter((p) => p.value !== task.priority).map((p) => (
                      <button key={p.value} onClick={() => { onPriorityChange(task.id, p.value); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Reassign (owner only) */}
                  {isOwner && onReassign && (
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Reassign</p>
                      <button onClick={() => { onReassign(task.id, null); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                        Unassigned
                      </button>
                      {members.filter((m) => m.id !== task.assigned_to).map((m) => (
                        <button key={m.id} onClick={() => { onReassign(task.id, m.id); setMenuOpen(false); }}
                          className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                          {m.full_name ?? m.email.split("@")[0]}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Subtasks + Delete */}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={() => { handleToggleSubtasks(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      {showSubtasks ? "Hide checklist" : "Show checklist"}
                    </button>
                    <button onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete task
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.map((tag) => (
              <span key={tag} className={`text-xs rounded px-1.5 py-0.5 font-medium ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600"}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Subtask progress bar */}
        {subtaskCount && subtaskCount.total > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${subtaskPct}%` }} />
              </div>
              <button
                onClick={handleToggleSubtasks}
                className="text-xs text-gray-400 hover:text-indigo-600 whitespace-nowrap transition-colors font-medium"
                title="Show/hide checklist"
              >
                {subtaskCount.completed}/{subtaskCount.total} done
              </button>
            </div>
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {assignee && (
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {assignee.full_name ?? assignee.email.split("@")[0]}
            </span>
          )}
          {task.due_date && (
            <span className={`text-xs rounded-full px-2 py-0.5 flex items-center gap-1 ${
              isOverdue ? "bg-red-100 text-red-600 font-semibold" : "bg-gray-100 text-gray-500"
            }`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isOverdue ? "Overdue · " : ""}
              {new Date(task.due_date).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Status badge — bottom of card, tappable */}
      <div className="px-3 pb-3 relative">
        <button
          onClick={() => setStatusOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors w-full justify-between ${cfg.bg} ${cfg.text}`}
          title="Click to change status"
        >
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {statusOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
            <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
              {STATUS_ORDER.map((s) => {
                const c = STATUS_CONFIG[s];
                const isCurrent = s === task.status;
                return (
                  <button
                    key={s}
                    onClick={() => { if (!isCurrent) onStatusChange(task.id, s); setStatusOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                      isCurrent ? "bg-gray-50 font-semibold" : "hover:bg-gray-50"
                    } ${c.text}`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                    {c.label}
                    {isCurrent && <span className="ml-auto text-gray-300">✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Subtask checklist */}
      {showSubtasks && (
        <div className="border-t border-gray-100 px-3 py-3">
          {loadingSubtasks ? (
            <p className="text-xs text-gray-400">Loading checklist…</p>
          ) : (
            <SubtaskChecklist taskId={task.id} initialSubtasks={subtasks ?? []} onCountChange={() => {}} />
          )}
        </div>
      )}
    </div>
  );
}
