"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import NoteToolbar from "./NoteToolbar";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface Props {
  initialContent: string;
  onUpdate: (jsonContent: string) => void;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  onRetry?: () => void;
}

/**
 * Parse the stored content string into a Tiptap-compatible format.
 * Handles three cases:
 *  1. Empty string → new doc
 *  2. JSON string with type:"doc" → existing Tiptap content
 *  3. Legacy plain text → wrap each line in a paragraph node
 */
function parseContent(raw: string): object | undefined {
  if (!raw.trim()) return undefined;

  try {
    const parsed = JSON.parse(raw) as { type?: string };
    if (parsed?.type === "doc") return parsed;
  } catch {
    // Not JSON — fall through to plain-text conversion
  }

  // Legacy plain text: split by newline, create paragraph nodes
  const lines = raw.split("\n");
  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

export default function NoteEditor({ initialContent, onUpdate, saveStatus, lastSavedAt, onRetry }: Props) {
  // Prevent SSR/hydration mismatch — Tiptap is purely client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          // Disable default heading shortcut that conflicts with our dropdown
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        TaskList,
        TaskItem.configure({ nested: true }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            target: "_blank",
            rel: "noopener noreferrer",
          },
          autolink: true,
          linkOnPaste: true,
        }),
        Placeholder.configure({
          placeholder: "Start writing — use the toolbar above for formatting",
          emptyEditorClass: "is-editor-empty",
        }),
      ],
      content: parseContent(initialContent),
      onUpdate: ({ editor: e }) => {
        onUpdate(JSON.stringify(e.getJSON()));
      },
      editorProps: {
        attributes: {
          // note-print-content is used by the @media print CSS to isolate this element
          class: "note-print-content prose-notes focus:outline-none",
        },
      },
    },
    [/* only initialise once */]
  );

  // Skeleton shown while JS loads (avoids layout shift)
  if (!mounted) {
    return (
      <div>
        <div
          className="border-b"
          style={{ height: 44, background: "var(--ct-nav)", borderColor: "var(--ct-bd)" }}
        />
        <div className="mt-6 mb-12">
          <div
            className="mx-auto rounded-sm"
            style={{
              maxWidth: 860,
              minHeight: 600,
              background: "var(--ct-surf)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Sticky formatting toolbar */}
      <NoteToolbar
        editor={editor}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onRetry={onRetry}
      />

      {/* Document card — floats on page background */}
      <div className="mt-6 mb-12">
        <div
          className="note-page mx-auto rounded-sm"
          style={{
            maxWidth: 860,
            background: "var(--ct-surf)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
            padding: "48px 72px",
            minHeight: 600,
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
