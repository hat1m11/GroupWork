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

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "bg-blue-500/20 border-blue-500/30 text-blue-400",
  "bg-purple-500/20 border-purple-500/30 text-purple-400",
  "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
  "bg-amber-500/20 border-amber-500/30 text-amber-400",
  "bg-pink-500/20 border-pink-500/30 text-pink-400",
];

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
    <div className="flex items-center gap-3 flex-wrap">
      {members.map((m, idx) => {
        const displayName = m.users?.full_name ?? m.users?.email?.split("@")[0] ?? "Unknown";
        const lastActive = formatLastActive(m.last_active_at);
        const canRemove = isOwner && m.user_id !== currentUserId;
        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
        const initials = getInitials(displayName);

        return (
          <div key={m.user_id} className="flex items-center gap-2 group">
            <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${avatarColor}`}>
              <span className="text-xs font-semibold">{initials}</span>
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-300">{displayName}</span>
                {m.role === "owner" && (
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 rounded-full px-1.5 py-px font-medium leading-none">
                    owner
                  </span>
                )}
              </div>
              {lastActive && (
                <span className="text-[10px] text-gray-600">{lastActive}</span>
              )}
            </div>
            {canRemove && (
              <button
                onClick={() => handleRemove(m.user_id, displayName)}
                className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm leading-none"
                title={`Remove ${displayName}`}
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
