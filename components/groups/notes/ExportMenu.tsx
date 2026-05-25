"use client";

import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { editorJsonToMarkdown } from "./markdownSerializer";
import { exportToDocx } from "./exportDocx";

interface Props {
  editor: Editor | null;
}

type CopyState = "idle" | "copied";

function ChevronDown() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ExportMenu({ editor }: Props) {
  const [open, setOpen] = useState(false);
  const [copyMdState, setCopyMdState] = useState<CopyState>("idle");
  const [copyTxtState, setCopyTxtState] = useState<CopyState>("idle");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const date = new Date().toISOString().slice(0, 10);

  async function handlePDF() {
    setOpen(false);
    window.print();
  }

  async function handleDocx() {
    if (!editor) return;
    setOpen(false);
    await exportToDocx(editor.getJSON(), `group-notes-${date}.docx`);
  }

  async function handleCopyMarkdown() {
    if (!editor) return;
    const md = editorJsonToMarkdown(editor.getJSON());
    await navigator.clipboard.writeText(md);
    setCopyMdState("copied");
    setTimeout(() => {
      setCopyMdState("idle");
      setOpen(false);
    }, 1500);
  }

  async function handleCopyPlain() {
    if (!editor) return;
    await navigator.clipboard.writeText(editor.getText());
    setCopyTxtState("copied");
    setTimeout(() => {
      setCopyTxtState("idle");
      setOpen(false);
    }, 1500);
  }

  const items = [
    {
      label: "Export as PDF",
      sublabel: "Opens print dialog",
      action: handlePDF,
      icon: (
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      label: "Export as DOCX",
      sublabel: "Microsoft Word format",
      action: handleDocx,
      icon: (
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      ),
    },
    {
      label: copyMdState === "copied" ? "✓ Copied!" : "Copy as Markdown",
      sublabel: "Raw .md to clipboard",
      action: handleCopyMarkdown,
      icon: (
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9 3.664A2.251 2.251 0 0115 9.75H9a2.25 2.25 0 00-2.15 1.586m11.9 3.664H5.25" />
        </svg>
      ),
    },
    {
      label: copyTxtState === "copied" ? "✓ Copied!" : "Copy as Plain text",
      sublabel: "Strips all formatting",
      action: handleCopyPlain,
      icon: (
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      ),
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors"
        style={{
          color: "var(--ct-t2)",
          borderColor: "var(--ct-bd)",
          background: open ? "var(--ct-hi)" : "transparent",
        }}
      >
        Export
        <ChevronDown />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-2xl z-50 overflow-hidden py-1"
          style={{ background: "var(--ct-nav)", borderColor: "var(--ct-bd)" }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full text-left px-3 py-2.5 flex items-start gap-2.5 group transition-colors"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--ct-hi)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span className="mt-0.5" style={{ color: "var(--ct-t3)" }}>
                {item.icon}
              </span>
              <div>
                <p className="text-xs font-medium leading-none" style={{ color: "var(--ct-t1)" }}>
                  {item.label}
                </p>
                <p className="text-[10px] mt-1" style={{ color: "var(--ct-t3)" }}>
                  {item.sublabel}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
