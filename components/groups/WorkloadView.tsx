"use client";

import type { Task } from "@/lib/supabase/types";
import PriorityBadge from "@/components/tasks/PriorityBadge";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  tasks: Task[];
  members: Member[];
}

const STATUS_COLOR: Record<Task["status"], string> = {
  todo:        "bg-gray-600",
  in_progress: "bg-blue-400",
  blocked:     "bg-red-400",
  done:        "bg-emerald-400",
};

export default function WorkloadView({ tasks, members }: Props) {
  const unassigned = tasks.filter((t) => !t.assigned_to);
  const maxTasks = Math.max(1, ...members.map((m) => tasks.filter((t) => t.assigned_to === m.id).length));

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-100">Workload</h2>
      <p className="text-xs text-gray-500">Tasks per member — see who needs help or is overloaded.</p>

      <div className="space-y-3">
        {members.map((member) => {
          const memberTasks = tasks.filter((t) => t.assigned_to === member.id);
          const pct = Math.round((memberTasks.length / maxTasks) * 100);
          const overdue = memberTasks.filter((t) => t.status !== "done" && t.due_date && t.due_date < new Date().toISOString().slice(0, 10)).length;

          return (
            <div key={member.id} className="bg-gray-900 rounded-xl border border-[#1E2A3A] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-100">
                    {member.full_name ?? member.email.split("@")[0]}
                  </span>
                  {overdue > 0 && (
                    <span className="text-xs bg-red-500/10 text-red-400 rounded-full px-2 py-0.5">{overdue} overdue</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{memberTasks.length} task{memberTasks.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-[#1E2A3A] mb-3">
                {memberTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex-1 ${STATUS_COLOR[t.status]} min-w-[4px]`}
                    title={`${t.title} (${t.status})`}
                  />
                ))}
                {memberTasks.length === 0 && (
                  <div className="flex-1 bg-[#1E2A3A] rounded-full" />
                )}
              </div>

              {memberTasks.length > 0 && (
                <div className="space-y-1">
                  {memberTasks.slice(0, 4).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[t.status]}`} />
                      <span className="truncate flex-1">{t.title}</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                  ))}
                  {memberTasks.length > 4 && (
                    <p className="text-xs text-gray-500 ml-4">+{memberTasks.length - 4} more</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {unassigned.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-dashed border-[#1E2A3A] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Unassigned</span>
              <span className="text-xs text-gray-500">{unassigned.length} task{unassigned.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-1">
              {unassigned.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[t.status]}`} />
                  <span className="truncate">{t.title}</span>
                </div>
              ))}
              {unassigned.length > 4 && <p className="text-xs text-gray-500 ml-4">+{unassigned.length - 4} more</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {status.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
