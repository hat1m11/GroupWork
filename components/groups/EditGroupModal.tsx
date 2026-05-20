"use client";

import { useState } from "react";
import type { Group } from "@/lib/supabase/types";

interface Props {
  groupId: string;
  group: Pick<Group, "name" | "assignment_name" | "due_date">;
  onUpdated: (g: Partial<Group>) => void;
  onClose: () => void;
}

export default function EditGroupModal({ groupId, group, onUpdated, onClose }: Props) {
  const [name, setName] = useState(group.name);
  const [assignmentName, setAssignmentName] = useState(group.assignment_name);
  const [dueDate, setDueDate] = useState(group.due_date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !assignmentName.trim() || saving) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), assignment_name: assignmentName.trim(), due_date: dueDate || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onUpdated({ name: name.trim(), assignment_name: assignmentName.trim(), due_date: dueDate || null });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment name</label>
            <input value={assignmentName} onChange={(e) => setAssignmentName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date (optional)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
