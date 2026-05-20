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

const STATUS_ORDER: Task["status"][] = ["todo", "in_progress", "blocked", "done"];
const STATUS_LABEL: Record<Task["status"], string> = {
  todo: "To do", in_progress: "In progress", blocked: "Blocked", done: "Done",
};
const STATUS_DOT: Record<Task["status"], string> = {
  todo: "bg-gray-500", in_progress: "bg-blue-400", blocked: "bg-red-400", done: "bg-emerald-400",
};
const PRIORITY_OPTIONS: { value: Task["priority"]; label: string }[] = [
  { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
  { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
];
const TAG_COLORS: Record<string, string> = {
  research: "bg-purple-500/10 text-purple-400",
  writing:  "bg-sky-500/10 text-sky-400",
  review:   "bg-amber-500/10 text-amber-400",
  design:   "bg-pink-500/10 text-pink-400",
  code:     "bg-emerald-500/10 text-emerald-400",
};

function cardAge(updatedAt: string): number {
  return (Date.now() - new Date(updatedAt).getTime()) / 86400000;
}
function ageClass(days: number, isDone: boolean): string {
  if (isDone) return "opacity-50";
  if (days < 3) return "";
  if (days < 7) return "opacity-80";
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
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[] | null>(null);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);

  const assignee = members.find((m) => m.id === task.assigned_to);
  const isOverdue = task.due_date && task.status !== "done" &&
    task.due_date < new Date().toISOString().slice(0, 10);
  const isDone = task.status === "done";
  const ageDays = cardAge(task.updated_at);
  const subtaskPct = subtaskCount && subtaskCount.total > 0
    ? Math.round((subtaskCount.completed / subtaskCount.total) * 100) : null;

  async function handleToggleSubtasks() {
    if (!showSubtasks && subtasks === null) {
      setLoadingSubtasks(true);
      try {
        const res = await fetch(`/api/subtasks?task_id=${task.id}`);
        const data = await res.json();
        setSubtasks(data.subtasks ?? []);
      } finally { setLoadingSubtasks(false); }
    }
    setShowSubtasks((v) => !v);
  }

  const visibleTags = task.tags?.slice(0, 2) ?? [];
  const extraTagCount = (task.tags?.length ?? 0) - visibleTags.length;

  const borderColor = task.status === "blocked"
    ? undefined
    : isOverdue
    ? undefined
    : "var(--ct-bd)";

  return (
    <div
      className={`group relative rounded-xl border text-sm transition-all duration-150 ${ageClass(ageDays, isDone)} ${
        task.status === "blocked" ? "border-red-500/20" : isOverdue ? "border-red-500/25" : ""
      }`}
      style={{ background: "var(--ct-card)", ...(borderColor ? { borderColor } : {}) }}
    >
      <div className="p-3">
        {/* Title */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p
            className={`font-medium leading-snug flex-1 text-[13px] ${isDone ? "line-through" : ""}`}
            style={{ color: isDone ? "var(--ct-t3)" : "var(--ct-t1)" }}
          >
            {task.title}
          </p>

          {/* Context menu — shows on card hover */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-6 h-6 flex items-center justify-center rounded-md transition-colors opacity-0 group-hover:opacity-100"
              style={{ color: "var(--ct-t3)" }}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-7 z-20 rounded-xl shadow-2xl py-1.5 min-w-[180px] border"
                  style={{ background: "var(--ct-nav)", borderColor: "var(--ct-bd)" }}
                >
                  {/* Change status */}
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--ct-t3)" }}>
                    Change status
                  </p>
                  {STATUS_ORDER.filter((s) => s !== task.status).map((s) => (
                    <button key={s}
                      onClick={() => { onStatusChange(task.id, s); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors hover:bg-[var(--ct-hi)]"
                      style={{ color: "var(--ct-t2)" }}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[s]}`} />
                      {STATUS_LABEL[s]}
                    </button>
                  ))}

                  <div className="h-px my-1" style={{ background: "var(--ct-bd)" }} />
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--ct-t3)" }}>
                    Set priority
                  </p>
                  {PRIORITY_OPTIONS.filter((p) => p.value !== task.priority).map((p) => (
                    <button key={p.value}
                      onClick={() => { onPriorityChange(task.id, p.value); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-[var(--ct-hi)]"
                      style={{ color: "var(--ct-t2)" }}>
                      {p.label}
                    </button>
                  ))}

                  {isOwner && onReassign && (
                    <>
                      <div className="h-px my-1" style={{ background: "var(--ct-bd)" }} />
                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--ct-t3)" }}>
                        Reassign
                      </p>
                      <button onClick={() => { onReassign(task.id, null); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-[var(--ct-hi)]"
                        style={{ color: "var(--ct-t2)" }}>
                        Unassigned
                      </button>
                      {members.filter((m) => m.id !== task.assigned_to).map((m) => (
                        <button key={m.id}
                          onClick={() => { onReassign(task.id, m.id); setMenuOpen(false); }}
                          className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-[var(--ct-hi)]"
                          style={{ color: "var(--ct-t2)" }}>
                          {m.full_name ?? m.email.split("@")[0]}
                        </button>
                      ))}
                    </>
                  )}

                  <div className="h-px my-1" style={{ background: "var(--ct-bd)" }} />
                  <button onClick={() => { handleToggleSubtasks(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors hover:bg-[var(--ct-hi)]"
                    style={{ color: "var(--ct-t2)" }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {showSubtasks ? "Hide checklist" : "Show checklist"}
                  </button>
                  <button onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {visibleTags.map((tag) => (
              <span key={tag} className={`text-[10px] rounded-full px-2 py-px font-medium ${TAG_COLORS[tag] ?? "bg-gray-500/10 text-gray-400"}`}>
                {tag}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="text-[10px] rounded-full px-2 py-px font-medium" style={{ background: "var(--ct-hi)", color: "var(--ct-t3)" }}>
                +{extraTagCount}
              </span>
            )}
          </div>
        )}

        {/* Subtask progress */}
        {subtaskCount && subtaskCount.total > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-full h-1 overflow-hidden" style={{ background: "var(--ct-bd)" }}>
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${subtaskPct}%` }} />
              </div>
              <button onClick={handleToggleSubtasks} className="text-[10px] whitespace-nowrap transition-colors tabular-nums"
                style={{ color: "var(--ct-t3)" }}>
                {subtaskCount.completed}/{subtaskCount.total}
              </button>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {assignee && (
            <span className="text-[10px] rounded-full px-2 py-px flex items-center gap-1"
              style={{ background: "var(--ct-hi)", color: "var(--ct-t3)" }}>
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {assignee.full_name?.split(" ")[0] ?? assignee.email.split("@")[0]}
            </span>
          )}
          {task.due_date && (
            <span className={`text-[10px] rounded-full px-2 py-px ${isOverdue ? "bg-red-500/10 text-red-400 font-medium" : ""}`}
              style={isOverdue ? {} : { background: "var(--ct-hi)", color: "var(--ct-t3)" }}>
              {isOverdue ? "Overdue · " : ""}
              {new Date(task.due_date).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
            </span>
          )}
          {task.status === "blocked" && (
            <span className="text-[10px] bg-red-500/10 text-red-400 rounded-full px-2 py-px font-medium">Blocked</span>
          )}
        </div>
      </div>

      {/* Subtask checklist */}
      {showSubtasks && (
        <div className="border-t px-3 py-3" style={{ borderColor: "var(--ct-bd)" }}>
          {loadingSubtasks
            ? <p className="text-xs" style={{ color: "var(--ct-t3)" }}>Loading…</p>
            : <SubtaskChecklist taskId={task.id} initialSubtasks={subtasks ?? []} onCountChange={() => {}} />
          }
        </div>
      )}
    </div>
  );
}
