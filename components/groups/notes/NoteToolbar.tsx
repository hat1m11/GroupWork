"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import ExportMenu from "./ExportMenu";

// ── Save status display ──────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
  onRetry?: () => void;
}

function SaveIndicator({ status, lastSavedAt, onRetry }: SaveIndicatorProps) {
  const [relTime, setRelTime] = useState("just now");

  useEffect(() => {
    if (!lastSavedAt) return;
    function update() {
      if (!lastSavedAt) return;
      const mins = Math.floor((Date.now() - lastSavedAt.getTime()) / 60000);
      setRelTime(mins === 0 ? "just now" : `${mins}m ago`);
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ct-t3)" }}>
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Saving…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="text-xs" style={{ color: "var(--ct-t3)" }}>
        ✓ Saved {relTime}
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span style={{ color: "#F87171" }}>Save failed</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-medium underline"
            style={{ color: "#6E56CF" }}
          >
            Retry
          </button>
        )}
      </span>
    );
  }

  return null;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconBold() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}
function IconItalic() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}
function IconUnderline() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}
function IconStrike() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.4 3.2 6.3 3.2" />
      <path d="M6.7 19.1c2.3.6 4.4 1 6.2.9 2.7 0 5.3-.7 5.3-3.6 0-1.5-1.1-3.2-6.3-3.2" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}
function IconBulletList() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconNumberedList() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 10h2" strokeLinecap="round" />
      <path d="M3 14h1.5a.5.5 0 0 1 0 1H3.5a.5.5 0 0 0 0 1H5" strokeLinecap="round" />
    </svg>
  );
}
function IconTaskList() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="5" width="5" height="5" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5l1 1 1.5-1.5" />
      <rect x="3" y="14" width="5" height="5" rx="1" />
      <line x1="11" y1="7.5" x2="21" y2="7.5" />
      <line x1="11" y1="16.5" x2="21" y2="16.5" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconCode() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
function IconCodeBlock() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <polyline points="8 8 4.5 12 8 16" />
      <polyline points="16 8 19.5 12 16 16" />
      <line x1="12" y1="8" x2="12" y2="16" opacity="0.5" />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-5 flex-shrink-0 mx-0.5" style={{ background: "var(--ct-bd)" }} />;
}

// ── Toolbar button ───────────────────────────────────────────────────────────

interface TBtnProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function TBtn({ active, disabled, onClick, title, children }: TBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 transition-colors"
      style={
        active
          ? { background: "rgba(110,86,207,0.12)", color: "#6E56CF" }
          : { background: "transparent", color: "var(--ct-t2)" }
      }
      onMouseEnter={(e) => {
        if (!active && !disabled) e.currentTarget.style.background = "var(--ct-hi)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? "rgba(110,86,207,0.12)" : "transparent";
      }}
    >
      {children}
    </button>
  );
}

// ── Paragraph style dropdown ─────────────────────────────────────────────────

interface ParaDropdownProps {
  editor: Editor;
}

const PARA_STYLES = [
  { label: "Normal text", action: (e: Editor) => e.chain().focus().setParagraph().run(), isActive: (e: Editor) => e.isActive("paragraph") },
  { label: "Heading 1",   action: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e: Editor) => e.isActive("heading", { level: 1 }) },
  { label: "Heading 2",   action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e: Editor) => e.isActive("heading", { level: 2 }) },
  { label: "Heading 3",   action: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e: Editor) => e.isActive("heading", { level: 3 }) },
];

function ParaDropdown({ editor }: ParaDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const activeStyle = PARA_STYLES.find((s) => s.isActive(editor)) ?? PARA_STYLES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md h-7 min-w-[104px] transition-colors"
        style={
          open
            ? { background: "var(--ct-hi)", color: "var(--ct-t1)" }
            : { background: "transparent", color: "var(--ct-t2)" }
        }
      >
        <span className="flex-1 text-left">{activeStyle.label}</span>
        <IconChevron />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 w-36 rounded-xl border shadow-xl z-50 py-1 overflow-hidden"
          style={{ background: "var(--ct-nav)", borderColor: "var(--ct-bd)" }}
        >
          {PARA_STYLES.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                s.action(editor);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
              style={
                s.isActive(editor)
                  ? { background: "rgba(110,86,207,0.08)", color: "#6E56CF" }
                  : { color: "var(--ct-t1)" }
              }
              onMouseEnter={(e) => {
                if (!s.isActive(editor)) e.currentTarget.style.background = "var(--ct-hi)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = s.isActive(editor)
                  ? "rgba(110,86,207,0.08)"
                  : "transparent";
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Link popover ─────────────────────────────────────────────────────────────

interface LinkPopoverProps {
  editor: Editor;
  onClose: () => void;
}

function LinkPopover({ editor, onClose }: LinkPopoverProps) {
  const existingHref = editor.getAttributes("link").href as string | undefined;
  const [url, setUrl] = useState(existingHref ?? "");
  const [newTab, setNewTab] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose]);

  function applyLink() {
    const href = url.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
    } else {
      const attrs = newTab ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
      editor.chain().focus().setLink(attrs).run();
    }
    onClose();
  }

  function removeLink() {
    editor.chain().focus().unsetLink().run();
    onClose();
  }

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-2 z-50 rounded-xl border shadow-2xl p-3 w-72"
      style={{ background: "var(--ct-nav)", borderColor: "var(--ct-bd)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ct-t3)" }}>
        Insert link
      </p>
      <input
        ref={inputRef}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") applyLink();
          if (e.key === "Escape") onClose();
        }}
        placeholder="https://…"
        className="w-full text-xs px-2.5 py-1.5 rounded-md border outline-none focus:ring-1"
        style={{
          background: "var(--ct-in)",
          borderColor: "var(--ct-bd)",
          color: "var(--ct-t1)",
          // @ts-expect-error CSS custom property
          "--tw-ring-color": "#6E56CF",
        }}
      />
      <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={newTab}
          onChange={(e) => setNewTab(e.target.checked)}
          className="w-3.5 h-3.5 rounded accent-violet-600"
        />
        <span className="text-[11px]" style={{ color: "var(--ct-t2)" }}>
          Open in new tab
        </span>
      </label>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={applyLink}
          className="flex-1 text-xs font-semibold py-1.5 rounded-md text-white"
          style={{ background: "#6E56CF" }}
        >
          Apply
        </button>
        {existingHref && (
          <button
            onClick={removeLink}
            className="text-xs font-medium px-3 py-1.5 rounded-md border"
            style={{ color: "#F87171", borderColor: "rgba(248,113,113,0.3)" }}
          >
            Remove
          </button>
        )}
        <button
          onClick={onClose}
          className="text-xs font-medium px-3 py-1.5 rounded-md"
          style={{ color: "var(--ct-t3)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main toolbar ─────────────────────────────────────────────────────────────

interface Props {
  editor: Editor | null;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  onRetry?: () => void;
}

export default function NoteToolbar({ editor, saveStatus, lastSavedAt, onRetry }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const linkBtnRef = useRef<HTMLDivElement>(null);

  const closeLinkPopover = useCallback(() => setLinkOpen(false), []);

  if (!editor) return null;

  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between px-4 border-b"
      style={{
        background: "var(--ct-nav)",
        borderColor: "var(--ct-bd)",
        height: 44,
        boxShadow: "0 1px 0 var(--ct-bd)",
      }}
    >
      {/* Left cluster: all formatting controls */}
      <div className="flex items-center gap-0.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>

        {/* Paragraph style */}
        <ParaDropdown editor={editor} />
        <Divider />

        {/* Inline formatting */}
        <TBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
          <IconBold />
        </TBtn>
        <TBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
          <IconItalic />
        </TBtn>
        <TBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
          <IconUnderline />
        </TBtn>
        <TBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <IconStrike />
        </TBtn>
        <Divider />

        {/* Lists */}
        <TBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <IconBulletList />
        </TBtn>
        <TBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <IconNumberedList />
        </TBtn>
        <TBtn active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task list">
          <IconTaskList />
        </TBtn>
        <Divider />

        {/* Link + code */}
        <div ref={linkBtnRef} className="relative">
          <TBtn
            active={editor.isActive("link") || linkOpen}
            onClick={() => setLinkOpen((v) => !v)}
            title="Insert link"
          >
            <IconLink />
          </TBtn>
          {linkOpen && <LinkPopover editor={editor} onClose={closeLinkPopover} />}
        </div>
        <TBtn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
          <IconCode />
        </TBtn>
        <TBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
          <IconCodeBlock />
        </TBtn>
      </div>

      {/* Right cluster: export + save status */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} onRetry={onRetry} />
        <ExportMenu editor={editor} />
      </div>
    </div>
  );
}
