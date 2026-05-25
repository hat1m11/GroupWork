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

const COLUMNS: {
  label: string;
  status: Task["status"];
  textColor: string;
  dot: string;
  accent: string;
  headerBg: string;
  badgeBg: string;
  bodyBg: string;
}[] = [
  {
    label: "To do",
    status: "todo",
    textColor: "text-gray-200",
    dot: "bg-gray-400",
    accent: "bg-gray-500/60",
    headerBg: "bg-gray-500/[0.07]",
    badgeBg: "bg-gray-500/25 text-gray-200",
    bodyBg: "",
  },
  {
    label: "In progress",
    status: "in_progress",
    textColor: "text-blue-300",
    dot: "bg-blue-400",
    accent: "bg-blue-500",
    headerBg: "bg-blue-500/[0.1]",
    badgeBg: "bg-blue-500/25 text-blue-200",
    bodyBg: "bg-blue-500/[0.02]",
  },
  {
    label: "Done",
    status: "done",
    textColor: "text-emerald-300",
    dot: "bg-emerald-400",
    accent: "bg-emerald-500",
    headerBg: "bg-emerald-500/[0.1]",
    badgeBg: "bg-emerald-500/25 text-emerald-200",
    bodyBg: "bg-emerald-500/[0.02]",
  },
];

function EmptyCol({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center"
        style={{ borderColor: "var(--ct-bd)", opacity: 0.3 }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          style={{ color: "var(--ct-t3)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <p className="text-xs font-medium" style={{ color: "var(--ct-t3)", opacity: 0.35 }}>
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
  const gradeContrib = Math.round((section.weight_pct * progress) / 100);

  return (
    <div className="space-y-3">

      {/* ── Section header row ── */}
      <div className="flex items-center gap-4 px-0.5">

        {/* Left accent + title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1 h-5 rounded-full bg-blue-500/60 flex-shrink-0" />
          <h2 className="font-semibold text-sm truncate" style={{ color: "var(--ct-t1)" }}>
            {section.title}
          </h2>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ background: "var(--ct-hi)", color: "var(--ct-t3)" }}
          >
            {section.weight_pct}% of grade
          </span>
        </div>

        {/* Progress bar + stats */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-24 rounded-full h-1.5 overflow-hidden" style={{ background: "var(--ct-bd)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: progress === 100
                  ? "rgb(16,185,129)"
                  : progress > 50
                  ? "rgb(59,130,246)"
                  : "rgb(99,102,241)",
              }}
            />
          </div>
          <span className="text-[11px] tabular-nums whitespace-nowrap" style={{ color: "var(--ct-t3)" }}>
            {doneCount}/{tasks.length} done
            {gradeContrib > 0 && (
              <span className="text-emerald-500/70"> · +{gradeContrib}%</span>
            )}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add task */}
        <button
          onClick={onCreateTask}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors duration-150 flex-shrink-0"
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

      {/* ── Kanban columns — each a separate card ── */}
      <div className="grid grid-cols-3 gap-4">
        {columns.map(({ label, status, textColor, dot, accent, headerBg, badgeBg, bodyBg, items }) => (
          <div
            key={status}
            className="rounded-2xl flex flex-col overflow-hidden border"
            style={{
              background: "var(--ct-surf)",
              borderColor: "var(--ct-bd)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {/* Coloured top accent strip */}
            <div className={`h-[3px] w-full ${accent}`} />

            {/* Column header */}
            <div
              className={`px-4 py-3 flex items-center gap-2.5 border-b ${headerBg}`}
              style={{ borderColor: "var(--ct-bd)" }}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
              <p className={`text-xs font-semibold tracking-wide ${textColor}`}>{label}</p>
              <span
                className={`ml-auto text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full ${badgeBg}`}
              >
                {items.length}
              </span>
            </div>

            {/* Task list */}
            <div
              className={`p-3 space-y-2.5 overflow-y-auto flex-1 ${bodyBg}`}
              style={{ maxHeight: "520px", minHeight: "130px" }}
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
