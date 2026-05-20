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
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 border border-[#1E2A3A] hover:border-[#2D3F55] rounded-lg px-3 py-1.5 transition-all duration-150"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        Share
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 bg-gray-900 border border-[#1E2A3A] rounded-xl shadow-xl p-4 w-56">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Invite code</p>
          <div className="flex items-center gap-2">
            <span className="flex-1 font-mono text-xl font-bold text-gray-50 tracking-widest">{code}</span>
            <button
              onClick={copy}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors flex-shrink-0"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">Share this code with teammates to let them join.</p>
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

  return (
    <div className="mb-5">
      {/* Top utility bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
            {group.course_code}
          </span>
          {daysLeft !== null && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              daysLeft < 0 ? "bg-red-500/10 text-red-400" :
              daysLeft < 3 ? "bg-red-500/10 text-red-400" :
              daysLeft < 7 ? "bg-amber-500/10 text-amber-400" :
              "bg-gray-800 text-gray-500"
            }`}>
              {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? "Due today" : "Overdue"}
            </span>
          )}
          {countdown && (
            <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">
              ⏱ {countdown}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-200 border border-[#1E2A3A] hover:border-[#2D3F55] rounded-lg px-3 py-1.5 transition-all duration-150"
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
      <h1 className="text-3xl font-extrabold text-gray-50 tracking-tight leading-tight">{group.name}</h1>
      <p className="text-sm text-gray-500 mt-1 font-normal">{group.assignment_name}</p>

      {/* Members */}
      <div className="mt-4">
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
