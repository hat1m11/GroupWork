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

const COLUMNS: { label: string; status: Task["status"]; textColor: string; dot: string }[] = [
  { label: "To do",       status: "todo",        textColor: "text-gray-500",    dot: "bg-gray-500"    },
  { label: "In progress", status: "in_progress",  textColor: "text-blue-400",    dot: "bg-blue-400"    },
  { label: "Done",        status: "done",         textColor: "text-emerald-400", dot: "bg-emerald-400" },
];

function EmptyCol({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-25">
      <div className="w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center"
        style={{ borderColor: "var(--ct-bd)" }}>
        <span className="text-base leading-none" style={{ color: "var(--ct-t3)" }}>+</span>
      </div>
      <p className="text-xs" style={{ color: "var(--ct-t3)" }}>No {label.toLowerCase()} tasks</p>
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
    <div className="rounded-xl overflow-hidden border" style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}>
      {/* Section header */}
      <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: "var(--ct-bd)" }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm" style={{ color: "var(--ct-t1)" }}>{section.title}</h2>
            <span className="text-xs font-normal" style={{ color: "var(--ct-t3)" }}>
              {section.weight_pct}% of grade
            </span>
          </div>
          <button
            onClick={onCreateTask}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-150"
            style={{ color: "var(--ct-t3)" }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add task
          </button>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: "var(--ct-bd)" }}>
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-medium tabular-nums w-8 text-right" style={{ color: "var(--ct-t3)" }}>
            {progress}%
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--ct-t3)" }}>
          {doneCount} of {tasks.length} done
          {gradeContrib > 0 && <span style={{ color: "var(--ct-t3)" }}> · +{gradeContrib}% to final grade</span>}
        </p>
      </div>

      {/* Blocked band */}
      {blocked.length > 0 && (
        <div className="px-4 py-3 bg-red-500/5 border-b border-red-500/15">
          <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
            {blocked.length} blocked — needs attention
          </p>
          <div className="space-y-2">
            {blocked.map((task) => (
              <TaskCard key={task.id} task={task} members={members} currentUserId={currentUserId}
                isOwner={isOwner} subtaskCount={subtaskCounts[task.id]}
                onStatusChange={onStatusChange} onPriorityChange={onPriorityChange}
                onReassign={onReassign} onDelete={onDeleteTask} />
            ))}
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-3" style={{ borderTop: "none" }}>
        {columns.map(({ label, status, textColor, dot, items }, ci) => (
          <div key={status} className="flex flex-col"
            style={ci > 0 ? { borderLeft: "1px solid var(--ct-bd)" } : {}}>
            {/* Column header */}
            <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 border-b" style={{ borderColor: "var(--ct-bd)" }}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
              <p className={`text-xs font-medium ${textColor}`}>{label}</p>
              <span className="ml-auto text-xs tabular-nums" style={{ color: "var(--ct-t3)" }}>{items.length || ""}</span>
            </div>
            {/* Scrollable column */}
            <div className="p-2.5 space-y-2 overflow-y-auto" style={{ maxHeight: "480px", minHeight: "100px" }}>
              {items.map((task) => (
                <TaskCard key={task.id} task={task} members={members} currentUserId={currentUserId}
                  isOwner={isOwner} subtaskCount={subtaskCounts[task.id]}
                  onStatusChange={onStatusChange} onPriorityChange={onPriorityChange}
                  onReassign={onReassign} onDelete={onDeleteTask} />
              ))}
              {items.length === 0 && <EmptyCol label={label} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
