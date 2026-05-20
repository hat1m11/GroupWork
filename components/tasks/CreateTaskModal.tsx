"use client";

import { useState } from "react";
import type { Task } from "@/lib/supabase/types";
import PrioritySelect from "./PrioritySelect";

interface Member { id: string; full_name: string | null; email: string; }

interface Props {
  groupId: string;
  rubricSectionId: string;
  members: Member[];
  onCreated: (task: Task) => void;
  onClose: () => void;
}

const ALL_TAGS = ["research", "writing", "review", "design", "code"];

export default function CreateTaskModal({ groupId, rubricSectionId, members, onCreated, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId, rubric_section_id: rubricSectionId,
          title: title.trim(), description: description.trim() || null,
          assigned_to: assignedTo || null, due_date: dueDate || null, priority, tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create task");
      onCreated(data.task);
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); setLoading(false); }
  }

  const inputCls = "w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all";
  const inputStyle: React.CSSProperties = { background: "var(--ct-in)", borderColor: "var(--ct-bd)", color: "var(--ct-t1)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,15,30,0.88)", backdropFilter: "blur(12px)" }}>
      <div className="rounded-xl w-full max-w-md p-6 border" style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--ct-t1)" }}>New Task</h2>
          <button onClick={onClose} className="text-2xl leading-none transition-colors" style={{ color: "var(--ct-t3)" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>Title *</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Optional details…" className={`${inputCls} resize-none`} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>Assign to</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                style={inputStyle}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>Priority</label>
            <PrioritySelect value={priority} onChange={setPriority} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>Labels</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <button key={tag} type="button"
                  onClick={() => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                  className={`text-xs rounded-full px-2.5 py-1 font-medium transition-all duration-150 border ${
                    tags.includes(tag) ? "bg-blue-500 text-white border-blue-500" : ""
                  }`}
                  style={tags.includes(tag) ? {} : { borderColor: "var(--ct-bd)", color: "var(--ct-t3)" }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2.5 font-semibold hover:bg-[var(--ct-hi)] active:scale-[0.98] transition-all duration-150"
              style={{ borderColor: "var(--ct-bd)", color: "var(--ct-t2)" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()}
              className="flex-1 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-[0.98] px-4 py-2.5 text-white font-semibold disabled:opacity-60 transition-all duration-150">
              {loading ? "Adding…" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
