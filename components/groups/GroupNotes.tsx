"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NoteEditor, { type SaveStatus } from "./notes/NoteEditor";

interface Props {
  groupId: string;
}

export default function GroupNotes({ groupId }: Props) {
  // null = still loading, "" = loaded (empty), string = loaded content
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef<string>("");

  // Load existing notes on mount
  useEffect(() => {
    fetch(`/api/groups/${groupId}/notes`)
      .then((r) => r.json())
      .then((d) => setRawContent((d.content as string) ?? ""))
      .catch(() => setRawContent(""));
  }, [groupId]);

  // Persist to API (same endpoint and body as before — just now stores JSON)
  const save = useCallback(
    async (content: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/groups/${groupId}/notes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error("save failed");
        setSaveStatus("saved");
        setLastSavedAt(new Date());
      } catch {
        setSaveStatus("error");
      }
    },
    [groupId]
  );

  // Called by NoteEditor on every content change; debounces the actual save
  function handleUpdate(content: string) {
    lastContentRef.current = content;
    setSaveStatus("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(content), 800);
  }

  // Retry button in the toolbar calls this
  function handleRetry() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    save(lastContentRef.current);
  }

  if (rawContent === null) {
    return (
      <div className="flex items-center justify-center py-24 text-sm" style={{ color: "var(--ct-t3)" }}>
        Loading notes…
      </div>
    );
  }

  return (
    <NoteEditor
      initialContent={rawContent}
      onUpdate={handleUpdate}
      saveStatus={saveStatus}
      lastSavedAt={lastSavedAt}
      onRetry={handleRetry}
    />
  );
}
