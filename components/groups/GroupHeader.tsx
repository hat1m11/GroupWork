"use client";

import { useState, useEffect, useRef } from "react";
import type { Group, MemberWithPresence } from "@/lib/supabase/types";
import MembersList from "./MembersList";
import EditGroupModal from "./EditGroupModal";

function useCountdown(dueDate: string | null) {
  const [remaining, setRemaining] = useState<string | null>(null);
  useEffect(() => {
    if (!dueDate) return;
    const target = new Date(dueDate).getTime() + 86400000;
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) { setRemaining("Deadline passed"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 7) { setRemaining(null); return; }
      setRemaining(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dueDate]);
  return remaining;
}

function ShareButton({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        data-share-trigger
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-[6px] border transition-all duration-150"
        style={{ color: "var(--ct-t3)", borderColor: "var(--ct-bd)" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        Share
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 rounded-xl shadow-xl p-4 w-56 border"
          style={{ background: "var(--ct-nav)", borderColor: "var(--ct-bd)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--ct-t3)" }}>Invite code</p>
          <div className="flex items-center gap-2">
            <span className="flex-1 font-mono text-xl font-bold tracking-widest" style={{ color: "var(--ct-t1)" }}>{code}</span>
            <button
              onClick={copy}
              className="text-xs font-semibold transition-colors flex-shrink-0"
              style={{ color: "#6E56CF" }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--ct-t3)" }}>Share this code with teammates to let them join.</p>
        </div>
      )}
    </div>
  );
}

interface Props {
  group: Group;
  members: MemberWithPresence[];
  currentUserId: string;
  isOwner: boolean;
}

export default function GroupHeader({ group: initial, members, currentUserId, isOwner }: Props) {
  const [group, setGroup] = useState(initial);
  const [editOpen, setEditOpen] = useState(false);
  const countdown = useCountdown(group.due_date);

  const daysLeft = group.due_date
    ? Math.ceil((new Date(group.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // ONE merged deadline chip
  const deadlineChip = (() => {
    if (daysLeft === null) return null;
    if (daysLeft < 0) return { label: "Overdue", style: { background: "rgba(239,68,68,0.1)", color: "#F87171" } };
    if (daysLeft === 0 || (countdown && !countdown.startsWith("0d"))) {
      // < 24h — precise countdown, red
      const isUrgent = daysLeft === 0;
      return {
        label: countdown ?? "Due today",
        style: isUrgent
          ? { background: "rgba(239,68,68,0.1)", color: "#F87171" }
          : { background: "rgba(245,158,11,0.1)", color: "#FBBF24" },
      };
    }
    if (countdown) {
      // ≤ 7d — show countdown, amber
      return { label: countdown, style: { background: "rgba(245,158,11,0.1)", color: "#FBBF24" } };
    }
    // > 7d — show days, neutral
    return { label: `${daysLeft}d left`, style: { background: "var(--ct-hi)", color: "var(--ct-t3)" } };
  })();

  return (
    <div className="mb-4">
      {/* Top utility bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-[6px]"
            style={{ background: "rgba(110,86,207,0.1)", color: "#6E56CF" }}
          >
            {group.course_code}
          </span>
          {deadlineChip && (
            <span className="text-xs font-medium font-mono px-2.5 py-1 rounded-[6px]" style={deadlineChip.style}>
              {deadlineChip.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-[6px] border transition-all duration-150"
              style={{ color: "var(--ct-t3)", borderColor: "var(--ct-bd)" }}
              title="Edit group"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </button>
          )}
          <ShareButton code={group.invite_code} />
        </div>
      </div>

      {/* Group title */}
      <h1 className="text-2xl font-bold tracking-tight leading-tight" style={{ color: "var(--ct-t1)" }}>
        {group.name}
      </h1>
      {group.assignment_name && (
        <p className="text-sm mt-0.5" style={{ color: "var(--ct-t3)" }}>{group.assignment_name}</p>
      )}

      {/* Members */}
      <div className="mt-3">
        <MembersList
          groupId={group.id}
          members={members}
          currentUserId={currentUserId}
          isOwner={isOwner}
        />
      </div>

      {editOpen && (
        <EditGroupModal
          groupId={group.id}
          group={group}
          onUpdated={(updated) => setGroup((g) => ({ ...g, ...updated }))}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
