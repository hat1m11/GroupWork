"use client";

import { useState } from "react";
import type { Meeting, MeetingWithUser } from "@/lib/supabase/types";

const PLATFORM_BADGE: Record<NonNullable<Meeting["platform"]>, { label: string; color: string }> = {
  zoom:  { label: "Zoom",  color: "bg-blue-500/10 text-blue-400"     },
  meet:  { label: "Meet",  color: "bg-emerald-500/10 text-emerald-400" },
  teams: { label: "Teams", color: "bg-purple-500/10 text-purple-400"  },
  other: { label: "Call",  color: "bg-gray-500/10 text-gray-400"      },
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  groupId: string;
  initialMeetings: MeetingWithUser[];
  currentUserId: string;
  isOwner: boolean;
}

export default function MeetingsPanel({ groupId, initialMeetings, currentUserId, isOwner }: Props) {
  const [meetings, setMeetings] = useState<MeetingWithUser[]>(initialMeetings);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [callLink, setCallLink] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date().toISOString();
  const upcoming = meetings.filter((m) => m.scheduled_at >= now);
  const past = meetings.filter((m) => m.scheduled_at < now);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scheduledAt || adding) return;
    setAdding(true); setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), scheduled_at: new Date(scheduledAt).toISOString(), duration_minutes: parseInt(duration) || 60, call_link: callLink.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMeetings((prev) => [...prev, data.meeting].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)));
      setTitle(""); setScheduledAt(""); setDuration("60"); setCallLink(""); setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(meetingId: string) {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    await fetch(`/api/groups/${groupId}/meetings/${meetingId}`, { method: "DELETE" });
  }

  function MeetingCard({ meeting, dim }: { meeting: MeetingWithUser; dim?: boolean }) {
    const canDelete = meeting.created_by === currentUserId || isOwner;
    const badge = meeting.platform ? PLATFORM_BADGE[meeting.platform] : null;
    return (
      <div className={`flex items-start gap-3 bg-gray-900 rounded-xl border border-[#1E2A3A] px-4 py-3 group ${dim ? "opacity-40" : "hover:border-[#2D3F55]"} transition-all duration-150`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-100">{meeting.title}</p>
            {badge && <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${badge.color}`}>{badge.label}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(meeting.scheduled_at)} · {meeting.duration_minutes}min</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {meeting.users?.full_name ?? meeting.users?.email?.split("@")[0] ?? "Unknown"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {meeting.call_link && !dim && (
            <a
              href={meeting.call_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-all duration-150 font-medium"
            >
              Join
            </a>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(meeting.id)}
              className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-100">Meetings</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ Schedule meeting"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-900 rounded-xl border border-[#1E2A3A] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Title *</label>
              <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly sync" className="w-full rounded-lg bg-[#0D1424] border border-[#1E2A3A] px-3 py-2 text-sm text-gray-50 placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Date & Time *</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-lg bg-[#0D1424] border border-[#1E2A3A] px-3 py-2 text-sm text-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Duration (min)</label>
              <input type="number" min="1" max="1440" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-lg bg-[#0D1424] border border-[#1E2A3A] px-3 py-2 text-sm text-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Call link (optional)</label>
              <input value={callLink} onChange={(e) => setCallLink(e.target.value)} placeholder="https://zoom.us/j/..." type="url" className="w-full rounded-lg bg-[#0D1424] border border-[#1E2A3A] px-3 py-2 text-sm text-gray-50 placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all" />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={!title.trim() || !scheduledAt || adding} className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-[0.98] py-2 text-sm text-white font-medium disabled:opacity-50 transition-all duration-150">
            {adding ? "Scheduling…" : "Schedule Meeting"}
          </button>
        </form>
      )}

      {upcoming.length === 0 && past.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-500 text-sm">No meetings scheduled yet.</div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upcoming</p>
          {upcoming.map((m) => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">Past</p>
          {past.map((m) => <MeetingCard key={m.id} meeting={m} dim />)}
        </div>
      )}
    </div>
  );
}
