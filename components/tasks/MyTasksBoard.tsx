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
      <div className="text-center py-20 text-gray-400">
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
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === m
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
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
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {mode === "status" ? STATUS_LABEL[key as Task["status"]] : key}
              <span className="ml-2 text-gray-300 font-normal normal-case">
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
                    className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 shadow-sm ${
                      task.status === "done"
                        ? "border-green-100 opacity-70"
                        : isOverdue
                        ? "border-red-200"
                        : "border-gray-200"
                    }`}
                  >
                    <button
                      onClick={() => cycleStatus(task.id, task.status)}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors ${
                        task.status === "done"
                          ? "bg-green-500 border-green-500"
                          : task.status === "in_progress"
                          ? "border-indigo-400 bg-indigo-100"
                          : "border-gray-300 hover:border-indigo-400"
                      }`}
                      title="Cycle status"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium text-gray-900 truncate ${
                          task.status === "done" ? "line-through text-gray-400" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <PriorityBadge priority={task.priority} />
                        {task.groups && (
                          <Link
                            href={`/groups/${task.groups.id}`}
                            className="text-xs text-indigo-600 hover:underline bg-indigo-50 rounded px-1.5 py-0.5"
                          >
                            {task.groups.course_code} · {task.groups.name}
                          </Link>
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
                      </div>
                    </div>
                    {task.groups && (
                      <Link
                        href={`/groups/${task.groups.id}`}
                        className="text-gray-300 hover:text-indigo-500 transition-colors flex-shrink-0"
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
