"use client";

import { useState } from "react";
import Link from "next/link";
import type { Task, TaskWithGroup } from "@/lib/supabase/types";
import PriorityBadge from "./PriorityBadge";

interface Props {
  tasks: TaskWithGroup[];
  currentUserId: string;
}

type GroupMode = "status" | "date";

const STATUS_CYCLE: Record<Task["status"], Task["status"]> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

const STATUS_LABEL: Record<Task["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

function dateBucket(due: string | null): string {
  if (!due) return "No due date";
  const d = new Date(due);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff <= 7) return "This week";
  return "Later";
}

const DATE_BUCKET_ORDER = ["Overdue", "Today", "This week", "Later", "No due date"];

export default function MyTasksBoard({ tasks: initial, currentUserId }: Props) {
  const [tasks, setTasks] = useState<TaskWithGroup[]>(initial);
  const [mode, setMode] = useState<GroupMode>("status");

  async function cycleStatus(taskId: string, current: Task["status"]) {
    const next = STATUS_CYCLE[current];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: next } : t))
    );
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  const groups: Record<string, TaskWithGroup[]> = {};

  if (mode === "status") {
    for (const s of ["todo", "in_progress", "done"] as Task["status"][]) {
      groups[s] = tasks.filter((t) => t.status === s);
    }
  } else {
    for (const bucket of DATE_BUCKET_ORDER) {
      groups[bucket] = tasks.filter((t) => dateBucket(t.due_date) === bucket);
    }
  }

  const keys =
    mode === "status"
      ? (["todo", "in_progress", "done"] as string[])
      : DATE_BUCKET_ORDER;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No tasks assigned to you yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {(["status", "date"] as GroupMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              mode === m
                ? "bg-blue-500 text-white"
                : "bg-transparent border border-[#1E2A3A] text-gray-400 hover:border-blue-500/50 hover:text-blue-400"
            }`}
          >
            {m === "status" ? "By status" : "By due date"}
          </button>
        ))}
      </div>

      {keys.map((key) => {
        const items = groups[key] ?? [];
        if (items.length === 0) return null;
        return (
          <div key={key}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {mode === "status" ? STATUS_LABEL[key as Task["status"]] : key}
              <span className="ml-2 text-gray-600 font-normal normal-case">
                {items.length}
              </span>
            </h3>
            <div className="space-y-2">
              {items.map((task) => {
                const isOverdue =
                  task.due_date &&
                  task.status !== "done" &&
                  new Date(task.due_date) < new Date();
                return (
                  <div
                    key={task.id}
                    className={`bg-gray-900 rounded-xl border px-4 py-3 flex items-center gap-3 transition-all duration-150 ${
                      task.status === "done"
                        ? "border-[#1E2A3A] opacity-60"
                        : isOverdue
                        ? "border-red-500/30"
                        : "border-[#1E2A3A] hover:border-[#2D3F55]"
                    }`}
                  >
                    <button
                      onClick={() => cycleStatus(task.id, task.status)}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                        task.status === "done"
                          ? "bg-emerald-500 border-emerald-500"
                          : task.status === "in_progress"
                          ? "border-blue-400 bg-blue-500/10"
                          : "border-gray-600 hover:border-blue-400"
                      }`}
                      title="Cycle status"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          task.status === "done" ? "line-through text-gray-500" : "text-gray-100"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <PriorityBadge priority={task.priority} />
                        {task.groups && (
                          <Link
                            href={`/groups/${task.groups.id}`}
                            className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 rounded px-1.5 py-0.5 transition-colors"
                          >
                            {task.groups.course_code} · {task.groups.name}
                          </Link>
                        )}
                        {task.due_date && (
                          <span
                            className={`text-xs rounded-full px-2 py-0.5 ${
                              isOverdue
                                ? "bg-red-500/10 text-red-400"
                                : "bg-gray-800 text-gray-500"
                            }`}
                          >
                            {new Date(task.due_date).toLocaleDateString("en-GB", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.groups && (
                      <Link
                        href={`/groups/${task.groups.id}`}
                        className="text-gray-600 hover:text-blue-400 transition-colors flex-shrink-0"
                        title="Open group"
                      >
                        →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
