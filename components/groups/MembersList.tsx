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

// Subtle tints that work in both light and dark
const AVATAR_BG = [
  { bg: "rgba(110,86,207,0.15)", border: "rgba(110,86,207,0.3)", text: "#6E56CF" },
  { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)", text: "#10B981" },
  { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", text: "#F59E0B" },
  { bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.3)", text: "#EC4899" },
  { bg: "rgba(14,165,233,0.15)", border: "rgba(14,165,233,0.3)", text: "#0EA5E9" },
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
    <div className="flex items-center">
      {/* Overlapping avatar stack */}
      <div className="flex items-center">
        {members.map((m, idx) => {
          const displayName = m.users?.full_name ?? m.users?.email?.split("@")[0] ?? "Unknown";
          const lastActive = formatLastActive(m.last_active_at);
          const isOnline = lastActive === "Active now";
          const canRemove = isOwner && m.user_id !== currentUserId;
          const colors = AVATAR_BG[idx % AVATAR_BG.length];
          const initials = getInitials(displayName);

          return (
            <div
              key={m.user_id}
              className="relative group"
              style={{ marginLeft: idx === 0 ? 0 : -8, zIndex: members.length - idx }}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 select-none"
                style={{ background: colors.bg, borderColor: "var(--ct-surf)", outline: `1px solid ${colors.border}` }}
              >
                <span className="text-[11px] font-semibold" style={{ color: colors.text }}>
                  {initials}
                </span>
              </div>

              {/* Online dot */}
              {isOnline && (
                <span
                  className="absolute bottom-0 right-0 w-2 h-2 rounded-full border"
                  style={{ background: "#10B981", borderColor: "var(--ct-surf)" }}
                />
              )}

              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 rounded-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50"
                style={{
                  background: "var(--ct-nav)",
                  color: "var(--ct-t1)",
                  border: "1px solid var(--ct-bd)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}
              >
                <p className="font-semibold">{displayName}</p>
                {m.role === "owner" && (
                  <p className="text-[10px] font-medium mt-px" style={{ color: "#6E56CF" }}>owner</p>
                )}
                {lastActive && (
                  <p className="text-[10px] mt-px" style={{ color: "var(--ct-t3)" }}>{lastActive}</p>
                )}
                {canRemove && (
                  <button
                    onClick={() => handleRemove(m.user_id, displayName)}
                    className="mt-1.5 text-[10px] text-red-400 hover:text-red-300 transition-colors pointer-events-auto block"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* + Invite ghost button */}
      <button
        className="ml-3 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-[6px] border transition-all duration-150"
        style={{ color: "var(--ct-t3)", borderColor: "var(--ct-bd)" }}
        title="Share invite code with a teammate"
        onClick={() => {
          // Trigger the Share button in the header
          const shareBtn = document.querySelector<HTMLButtonElement>("[data-share-trigger]");
          shareBtn?.click();
        }}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Invite
      </button>
    </div>
  );
}
