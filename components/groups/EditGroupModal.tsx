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
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), assignment_name: assignmentName.trim(), due_date: dueDate || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onUpdated({ name: name.trim(), assignment_name: assignmentName.trim(), due_date: dueDate || null });
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }

  const inputCls = "w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,15,30,0.88)", backdropFilter: "blur(12px)" }}>
      <div className="rounded-xl w-full max-w-md p-6 border" style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--ct-t1)" }}>Edit Group</h2>
          <button onClick={onClose} className="text-2xl leading-none transition-colors" style={{ color: "var(--ct-t3)" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Group name", val: name, set: setName },
            { label: "Assignment name", val: assignmentName, set: setAssignmentName },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>{label}</label>
              <input value={val} onChange={(e) => set(e.target.value)}
                className={inputCls} style={{ background: "var(--ct-in)", borderColor: "var(--ct-bd)", color: "var(--ct-t1)" }} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>Due date (optional)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className={inputCls} style={{ background: "var(--ct-in)", borderColor: "var(--ct-bd)", color: "var(--ct-t1)" }} />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2.5 font-semibold hover:bg-[var(--ct-hi)] active:scale-[0.98] transition-all duration-150"
              style={{ borderColor: "var(--ct-bd)", color: "var(--ct-t2)" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="flex-1 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-[0.98] px-4 py-2.5 text-white font-semibold disabled:opacity-60 transition-all duration-150">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
