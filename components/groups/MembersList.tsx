"use client";

import { useState } from "react";
import type { MemberWithPresence } from "@/lib/supabase/types";

function formatLastActive(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 10) return "Active now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  if (h < 48) return "Yesterday";
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  groupId: string;
  members: MemberWithPresence[];
  currentUserId: string;
  isOwner: boolean;
}

export default function MembersList({ groupId, members: initial, currentUserId, isOwner }: Props) {
  const [members, setMembers] = useState<MemberWithPresence[]>(initial);

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this group? Their tasks will be unassigned.`)) return;
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {members.map((m) => {
        const name = m.users?.full_name ?? m.users?.email ?? "Unknown";
        const lastActive = formatLastActive(m.last_active_at);
        const canRemove = isOwner && m.user_id !== currentUserId;

        return (
          <div key={m.user_id} className="flex items-center gap-1 group">
            <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-3 py-1 flex items-center gap-1.5">
              {name}
              {m.role === "owner" && <span className="text-gray-400">(owner)</span>}
              {lastActive && (
                <span className="text-gray-400 hidden sm:inline">· {lastActive}</span>
              )}
            </span>
            {canRemove && (
              <button
                onClick={() => handleRemove(m.user_id, name)}
                className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm leading-none -ml-1"
                title={`Remove ${name}`}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
