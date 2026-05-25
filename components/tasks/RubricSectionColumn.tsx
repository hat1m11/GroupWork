"use client";

import type { RubricSection, Task } from "@/lib/supabase/types";
import TaskCard from "./TaskCard";

interface Member { id: string; full_name: string | null; email: string; }

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

// Violet accent, no pastels — only the top stripe carries colour
const COLUMNS: { label: string; status: Task["status"]; dot: string; accent: string }[] = [
  { label: "To do",        status: "todo",        dot: "bg-slate-400",   accent: "#64748B" },
  { label: "In progress",  status: "in_progress", dot: "bg-violet-400",  accent: "#6E56CF" },
  { label: "Done",         status: "done",        dot: "bg-emerald-500", accent: "#10B981" },
];

function EmptyCol({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2.5">
      <div
        className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center"
        style={{ borderColor: "var(--ct-bd)", opacity: 0.3 }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          style={{ color: "var(--ct-t3)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <p className="text-[11px]" style={{ color: "var(--ct-t3)", opacity: 0.4 }}>
        No {label.toLowerCase()} tasks
      </p>
    </div>
  );
}

export default function RubricSectionColumn({
  section, tasks, members, progress, currentUserId, isOwner = false,
  subtaskCounts, onCreateTask, onStatusChange, onPriorityChange, onReassign, onDeleteTask,
}: Props) {
  const blocked = tasks.filter((t) => t.status === "blocked");
  const columns = COLUMNS.map((col) => ({ ...col, items: tasks.filter((t) => t.status === col.status) }));
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-3">

      {/* ── Section header ── */}
      <div className="flex items-center gap-4 px-0.5">

        {/* Left: title + weight chip */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background: "#6E56CF" }} />
          <h2 className="font-semibold text-sm truncate" style={{ color: "var(--ct-t1)" }}>
            {section.title}
          </h2>
          <span
            className="text-[11px] px-1.5 py-0.5 rounded-[6px] font-medium flex-shrink-0 tabular-nums"
            style={{ background: "var(--ct-hi)", color: "var(--ct-t3)" }}
          >
            {section.weight_pct}%
          </span>
        </div>

        {/* Progress bar + ratio */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-20 rounded-full h-1 overflow-hidden" style={{ background: "var(--ct-bd)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: progress === 100 ? "#10B981" : "#6E56CF" }}
            />
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: "var(--ct-t3)" }}>
            {doneCount} / {tasks.length}
          </span>
        </div>

        <div className="flex-1" />

        {/* Add task */}
        <button
          onClick={onCreateTask}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-[6px] text-white flex-shrink-0 transition-opacity"
          style={{ background: "#6E56CF" }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
      </div>

      {/* ── Blocked alert ── */}
      {blocked.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 border border-red-500/20 space-y-2"
          style={{ background: "rgba(239,68,68,0.04)" }}
        >
          <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-pulse" />
            {blocked.length} blocked — needs attention
          </p>
          <div className="grid grid-cols-3 gap-3">
            {blocked.map((task) => (
              <TaskCard
                key={task.id} task={task} members={members}
                currentUserId={currentUserId} isOwner={isOwner}
                subtaskCount={subtaskCounts[task.id]}
                onStatusChange={onStatusChange} onPriorityChange={onPriorityChange}
                onReassign={onReassign} onDelete={onDeleteTask}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Kanban columns — all same neutral surface, stripe is the differentiator ── */}
      <div className="grid grid-cols-3 gap-4">
        {columns.map(({ label, status, dot, accent, items }) => (
          <div
            key={status}
            className="rounded-xl flex flex-col overflow-hidden border"
            style={{
              background: "var(--ct-surf)",
              borderColor: "var(--ct-bd)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            }}
          >
            {/* Coloured top stripe */}
            <div style={{ height: 3, background: accent, flexShrink: 0 }} />

            {/* Column header — neutral, no tint */}
            <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: "var(--ct-bd)" }}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
              <p className="text-xs font-semibold" style={{ color: accent }}>{label}</p>
              <span
                className="ml-auto text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-[6px]"
                style={{ background: "var(--ct-hi)", color: "var(--ct-t3)" }}
              >
                {items.length}
              </span>
            </div>

            {/* Task list — same neutral, no tint */}
            <div
              className="p-3 space-y-2 flex-1 overflow-y-auto"
              style={{ maxHeight: 520, minHeight: 130 }}
            >
              {items.map((task) => (
                <TaskCard
                  key={task.id} task={task} members={members}
                  currentUserId={currentUserId} isOwner={isOwner}
                  subtaskCount={subtaskCounts[task.id]}
                  onStatusChange={onStatusChange} onPriorityChange={onPriorityChange}
                  onReassign={onReassign} onDelete={onDeleteTask}
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
