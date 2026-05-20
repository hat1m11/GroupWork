"use client";

import { useState } from "react";
import Link from "next/link";
import type { TaskWithGroup } from "@/lib/supabase/types";
import PriorityBadge from "@/components/tasks/PriorityBadge";

interface Props {
  tasks: TaskWithGroup[];
}

export default function UpcomingDeadlinesWidget({ tasks }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (tasks.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  function chipClass(due: string | null) {
    if (!due) return "bg-gray-100 text-gray-500";
    if (due <= today) return "bg-red-100 text-red-600";
    if (due <= tomorrow) return "bg-amber-100 text-amber-600";
    return "bg-gray-100 text-gray-500";
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-200 mb-8 overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-amber-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-500">⚠</span>
          <span className="font-semibold text-gray-900 text-sm">
            Upcoming Deadlines
          </span>
          <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} due in 7 days
          </span>
        </div>
        <span className="text-gray-400 text-sm">{collapsed ? "▼" : "▲"}</span>
      </button>

      {!collapsed && (
        <div className="divide-y divide-gray-50 border-t border-amber-100">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                {task.groups && (
                  <Link
                    href={`/groups/${task.groups.id}`}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    {task.groups.course_code} · {task.groups.name}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <PriorityBadge priority={task.priority} />
                {task.due_date && (
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${chipClass(task.due_date)}`}>
                    {new Date(task.due_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
