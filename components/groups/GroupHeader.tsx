"use client";

import { useState, useEffect } from "react";
import type { Group, MemberWithPresence } from "@/lib/supabase/types";
import InviteCodeBadge from "./InviteCodeBadge";
import MembersList from "./MembersList";
import EditGroupModal from "./EditGroupModal";

function useCountdown(dueDate: string | null) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!dueDate) return;
    const target = new Date(dueDate).getTime() + 86400000; // end of due day
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
    <div className="mb-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-0.5 rounded-full">
              {group.course_code}
            </span>
            {daysLeft !== null && (
              <span className={`text-sm font-medium ${daysLeft < 3 ? "text-red-500" : daysLeft < 7 ? "text-amber-500" : "text-gray-500"}`}>
                {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? "Due today" : "Overdue"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {isOwner && (
              <button
                onClick={() => setEditOpen(true)}
                className="text-gray-400 hover:text-indigo-600 transition-colors text-sm"
                title="Edit group"
              >
                ✎
              </button>
            )}
          </div>
          <p className="text-gray-500 mt-0.5">{group.assignment_name}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {countdown && (
            <div className="text-center bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              <p className="text-xs text-red-500 font-medium uppercase tracking-wide">Deadline</p>
              <p className="text-lg font-bold text-red-600 font-mono leading-none mt-0.5">{countdown}</p>
            </div>
          )}
          <InviteCodeBadge code={group.invite_code} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-gray-500 flex-shrink-0">Members:</span>
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
