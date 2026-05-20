"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
  groupId: string;
}

export default function GroupNotes({ groupId }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/notes`)
      .then((r) => r.json())
      .then((d) => { setContent(d.content ?? ""); setLoading(false); });
  }, [groupId]);

  const save = useCallback(async (text: string) => {
    setSaving(true);
    await fetch(`/api/groups/${groupId}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [groupId]);

  function handleChange(value: string) {
    setContent(value);
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(value), 1500);
  }

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Group Notes</h2>
        <span className="text-xs text-gray-400">
          {saving ? "Saving…" : saved ? "✓ Saved" : "Auto-saves as you type"}
        </span>
      </div>
      <p className="text-xs text-gray-400">
        Shared space for meeting notes, research, the brief — anything the whole group needs.
      </p>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Start typing… paste your brief, meeting notes, research links. Auto-saved."
        className="w-full min-h-[400px] rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y font-mono leading-relaxed"
      />
    </div>
  );
}
