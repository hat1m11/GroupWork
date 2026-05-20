"use client";

import { useState } from "react";
import type { Group, MemberWithPresence } from "@/lib/supabase/types";
import InviteCodeBadge from "./InviteCodeBadge";
import MembersList from "./MembersList";
import EditGroupModal from "./EditGroupModal";

interface Props {
  group: Group;
  members: MemberWithPresence[];
  currentUserId: string;
  isOwner: boolean;
}

export default function GroupHeader({ group: initial, members, currentUserId, isOwner }: Props) {
  const [group, setGroup] = useState(initial);
  const [editOpen, setEditOpen] = useState(false);

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
        <InviteCodeBadge code={group.invite_code} />
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
