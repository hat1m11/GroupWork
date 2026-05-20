"use client";

import { useState, useRef } from "react";
import type { Subtask } from "@/lib/supabase/types";

interface Props {
  taskId: string;
  initialSubtasks: Subtask[];
  onCountChange?: (total: number, completed: number) => void;
}

export default function SubtaskChecklist({ taskId, initialSubtasks, onCountChange }: Props) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const completed = subtasks.filter((s) => s.completed).length;
  const pct = subtasks.length > 0 ? Math.round((completed / subtasks.length) * 100) : 0;

  function notify(updated: Subtask[]) {
    onCountChange?.(updated.length, updated.filter((s) => s.completed).length);
  }

  async function handleToggle(subtask: Subtask) {
    const updated = subtasks.map((s) =>
      s.id === subtask.id ? { ...s, completed: !s.completed } : s
    );
    setSubtasks(updated);
    notify(updated);
    await fetch(`/api/subtasks/${subtask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !subtask.completed }),
    });
  }

  async function handleDelete(subtaskId: string) {
    const updated = subtasks.filter((s) => s.id !== subtaskId);
    setSubtasks(updated);
    notify(updated);
    await fetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" });
  }

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, title, sort_order: subtasks.length }),
      });
      const data = await res.json();
      if (res.ok && data.subtask) {
        const updated = [...subtasks, data.subtask];
        setSubtasks(updated);
        notify(updated);
        setNewTitle("");
        inputRef.current?.focus();
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-2">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-16 text-right">
            {completed}/{subtasks.length}
          </span>
        </div>
      )}

      {subtasks.map((s) => (
        <div key={s.id} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={s.completed}
            onChange={() => handleToggle(s)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
          />
          <span
            className={`flex-1 text-xs ${
              s.completed ? "line-through text-gray-400" : "text-gray-700"
            }`}
          >
            {s.title}
          </span>
          <button
            onClick={() => handleDelete(s.id)}
            className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs leading-none"
          >
            ×
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2 mt-2">
        <input
          ref={inputRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
          placeholder="Add subtask…"
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:border-indigo-400 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim() || adding}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
