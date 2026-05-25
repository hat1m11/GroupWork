"use client";

import { useState } from "react";
import type { Task, CalendarEvent } from "@/lib/supabase/types";
import PriorityBadge from "@/components/tasks/PriorityBadge";

interface Props {
  groupId: string;
  tasks: Task[];
  initialEvents: CalendarEvent[];
  currentUserId: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Icons as inline SVG components
function MeetingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
function DeadlineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V8.742m.164-4.078a2.15 2.15 0 011.743-1.342 48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185V19.5M4.664 4.664L19.5 19.5" />
    </svg>
  );
}
function CustomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

const EVENT_META: Record<CalendarEvent["type"], {
  label: string;
  dot: string;
  pill: string;
  activeBorder: string;
  activeText: string;
  activeBg: string;
  Icon: React.FC<{ className?: string }>;
}> = {
  meeting: {
    label: "Meeting",
    dot: "bg-blue-400",
    pill: "bg-blue-500/12 text-blue-300 border-blue-500/25",
    activeBorder: "border-blue-500/50",
    activeText: "text-blue-300",
    activeBg: "bg-blue-500/12",
    Icon: MeetingIcon,
  },
  deadline: {
    label: "Deadline",
    dot: "bg-rose-400",
    pill: "bg-rose-500/12 text-rose-300 border-rose-500/25",
    activeBorder: "border-rose-500/50",
    activeText: "text-rose-300",
    activeBg: "bg-rose-500/12",
    Icon: DeadlineIcon,
  },
  custom: {
    label: "Custom",
    dot: "bg-violet-400",
    pill: "bg-violet-500/12 text-violet-300 border-violet-500/25",
    activeBorder: "border-violet-500/50",
    activeText: "text-violet-300",
    activeBg: "bg-violet-500/12",
    Icon: CustomIcon,
  },
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarView({ groupId, tasks, initialEvents, currentUserId }: Props) {
  const now  = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const [events, setEvents]     = useState<CalendarEvent[]>(initialEvents);

  const [modal, setModal]       = useState<{ date: string } | null>(null);
  const [evtTitle, setEvtTitle] = useState("");
  const [evtType, setEvtType]   = useState<CalendarEvent["type"]>("custom");
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState("");

  const todayStr = now.toISOString().slice(0, 10);
  const days     = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function tasksForDay(day: number) {
    const d = dateStr(day);
    return tasks.filter((t) => t.due_date === d && t.status !== "done");
  }
  function eventsForDay(day: number) {
    const d = dateStr(day);
    return events.filter((e) => e.date === d);
  }

  const selectedTasks  = selected ? tasks.filter((t) => t.due_date === selected) : [];
  const selectedEvents = selected ? events.filter((e) => e.date === selected) : [];

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelected(null);
  }

  function openModal(date: string) {
    setModal({ date });
    setEvtTitle("");
    setEvtType("custom");
    setSaveError("");
  }
  function closeModal() {
    setModal(null);
    setEvtTitle("");
    setSaveError("");
  }

  async function handleSave() {
    if (!modal) return;
    const t = evtTitle.trim().slice(0, 25);
    if (!t) { setSaveError("Title is required."); return; }
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/groups/${groupId}/calendar-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, type: evtType, date: modal.date }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error ?? "Failed to save."); return; }
      setEvents((prev) => [...prev, data.event]);
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    await fetch(`/api/groups/${groupId}/calendar-events/${eventId}`, { method: "DELETE" });
  }

  function formatDate(ds: string) {
    return new Date(ds + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long",
    });
  }

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-100 text-base">{MONTHS[month]} {year}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal(todayStr)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add event
          </button>
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[#1E2A3A] text-gray-400 hover:text-gray-200 transition-all duration-150">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <button
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelected(null); }}
            className="px-3 py-1.5 text-xs rounded-lg bg-blue-500/10 text-blue-400 font-medium hover:bg-blue-500/20 transition-all duration-150"
          >
            Today
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[#1E2A3A] text-gray-400 hover:text-gray-200 transition-all duration-150">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
          </button>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div className="rounded-xl border border-[#1E2A3A] overflow-hidden" style={{ background: "var(--ct-surf)" }}>
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-[#1E2A3A]">
          {DOW.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold tracking-wide text-gray-600 py-2.5 uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="min-h-[92px] border-b border-r border-[#1E2A3A]" />
          ))}

          {Array.from({ length: days }).map((_, i) => {
            const day       = i + 1;
            const ds        = dateStr(day);
            const dayTasks  = tasksForDay(day);
            const dayEvents = eventsForDay(day);
            const total     = dayTasks.length + dayEvents.length;
            const isToday   = ds === todayStr;
            const isSel     = ds === selected;

            const allItems: { key: string; label: string; cls: string }[] = [
              ...dayEvents.map((e) => ({
                key: e.id,
                label: e.title,
                cls: EVENT_META[e.type].pill,
              })),
              ...dayTasks.map((t) => ({
                key: t.id,
                label: t.title,
                cls:
                  t.priority === "urgent" ? "bg-red-500/10 text-red-400 border-transparent" :
                  t.priority === "high"   ? "bg-amber-500/10 text-amber-400 border-transparent" :
                  "bg-blue-500/10 text-blue-400 border-transparent",
              })),
            ];
            const visible  = allItems.slice(0, 2);
            const overflow = total - visible.length;

            return (
              <div
                key={day}
                onClick={() => setSelected(isSel ? null : ds)}
                className={`group/cell relative min-h-[92px] border-b border-r border-[#1E2A3A] p-2 cursor-pointer transition-colors ${
                  isSel ? "bg-blue-500/8" : isToday ? "bg-amber-500/4" : "hover:bg-white/[0.02]"
                }`}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-blue-500 text-white" : "text-gray-500"
                  }`}>
                    {day}
                  </span>

                  {/* Quick-add + on hover */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(ds); }}
                    className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover/cell:opacity-100 hover:bg-blue-500/20 text-gray-600 hover:text-blue-400 transition-all duration-150"
                    title="Add event"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Event + task pills */}
                <div className="space-y-0.5">
                  {visible.map((item) => (
                    <div
                      key={item.key}
                      className={`text-[10px] truncate rounded-md px-1.5 py-0.5 font-medium border ${item.cls}`}
                    >
                      {item.label}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <p className="text-[10px] text-gray-600 px-1">+{overflow} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Day detail panel ── */}
      {selected && (selectedTasks.length > 0 || selectedEvents.length > 0) && (
        <div
          className="rounded-xl border border-[#2D3F55] p-4 space-y-4"
          style={{ background: "var(--ct-surf)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-100">{formatDate(selected)}</h3>
            <button
              onClick={() => openModal(selected)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add event
            </button>
          </div>

          {selectedEvents.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">Events</p>
              {selectedEvents.map((e) => {
                const meta = EVENT_META[e.type];
                return (
                  <div key={e.id} className="flex items-center gap-3 group/item py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                    <span className="flex-1 text-sm text-gray-200">{e.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${meta.pill}`}>
                      {meta.label}
                    </span>
                    {e.created_by === currentUserId && (
                      <button
                        onClick={() => handleDeleteEvent(e.id)}
                        className="opacity-0 group-hover/item:opacity-100 p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedTasks.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">Tasks due</p>
              {selectedTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.status === "done" ? "bg-emerald-400" : "bg-blue-400"}`} />
                  <span className={`flex-1 text-sm ${t.status === "done" ? "line-through text-gray-600" : "text-gray-200"}`}>{t.title}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && selectedTasks.length === 0 && selectedEvents.length === 0 && (
        <div
          className="rounded-xl border border-[#1E2A3A] p-4 flex items-center justify-between"
          style={{ background: "var(--ct-surf)" }}
        >
          <p className="text-sm text-gray-500">{formatDate(selected)} — nothing scheduled</p>
          <button
            onClick={() => openModal(selected)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add event
          </button>
        </div>
      )}

      {/* ── Add Event Modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: "var(--ct-nav)", borderColor: "var(--ct-bd)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--ct-bd)" }}>
              <div>
                <h3 className="font-semibold text-gray-100 text-sm">Add to Calendar</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--ct-t3)" }}>{formatDate(modal.date)}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Type selector */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Event type</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["meeting", "deadline", "custom"] as CalendarEvent["type"][]).map((t) => {
                    const meta   = EVENT_META[t];
                    const active = evtType === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setEvtType(t)}
                        className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl text-xs font-medium border transition-all duration-150 ${
                          active
                            ? `${meta.activeBg} ${meta.activeBorder} ${meta.activeText}`
                            : "border-[#1E2A3A] text-gray-500 hover:text-gray-300 hover:border-[#2D3F55] hover:bg-white/[0.03]"
                        }`}
                      >
                        <meta.Icon className={`w-5 h-5 ${active ? meta.activeText : "text-gray-600"}`} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Title</p>
                  <span className={`text-[11px] tabular-nums font-medium transition-colors ${
                    evtTitle.length >= 25 ? "text-red-400" : evtTitle.length >= 20 ? "text-amber-400" : "text-gray-600"
                  }`}>
                    {evtTitle.length}/25
                  </span>
                </div>
                <input
                  autoFocus
                  type="text"
                  maxLength={25}
                  value={evtTitle}
                  onChange={(e) => { setEvtTitle(e.target.value); setSaveError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") closeModal(); }}
                  placeholder={
                    evtType === "meeting"  ? "e.g. Team sync call" :
                    evtType === "deadline" ? "e.g. Final submission" :
                    "e.g. Review session notes"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-blue-500/50"
                  style={{
                    background: "var(--ct-surf)",
                    border: "1px solid var(--ct-bd)",
                  }}
                />
                {saveError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {saveError}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-white/[0.04]"
                style={{ borderColor: "var(--ct-bd)", color: "var(--ct-t3)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !evtTitle.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Add event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
