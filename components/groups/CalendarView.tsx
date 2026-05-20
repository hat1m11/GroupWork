"use client";

import { useState } from "react";
import Link from "next/link";
import type { Task } from "@/lib/supabase/types";
import PriorityBadge from "@/components/tasks/PriorityBadge";

interface Props {
  groupId: string;
  tasks: Task[];
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarView({ tasks }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const todayStr = now.toISOString().slice(0, 10);
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function tasksForDay(day: number) {
    const d = dateStr(day);
    return tasks.filter((t) => t.due_date === d && t.status !== "done");
  }

  const selectedTasks = selected ? tasks.filter((t) => t.due_date === selected) : [];

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-100">{MONTHS[month]} {year}</h2>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[#1E2A3A] text-gray-400 hover:text-gray-200 transition-all duration-150">‹</button>
          <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelected(null); }} className="px-3 py-1 text-xs rounded-lg bg-blue-500/10 text-blue-400 font-medium hover:bg-blue-500/20 transition-all duration-150">Today</button>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[#1E2A3A] text-gray-400 hover:text-gray-200 transition-all duration-150">›</button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-[#1E2A3A] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#1E2A3A]">
          {DOW.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-600 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-[#1E2A3A]" />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const ds = dateStr(day);
            const dayTasks = tasksForDay(day);
            const isToday = ds === todayStr;
            const isSelected = ds === selected;

            return (
              <div
                key={day}
                onClick={() => setSelected(isSelected ? null : ds)}
                className={`min-h-[80px] border-b border-r border-[#1E2A3A] p-1.5 cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-500/10" : isToday ? "bg-amber-500/5" : "hover:bg-[#1E2A3A]/50"
                }`}
              >
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday ? "bg-blue-500 text-white" : "text-gray-500"
                }`}>
                  {day}
                </span>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 2).map((t) => (
                    <div key={t.id} className={`text-xs truncate rounded px-1 py-0.5 ${
                      t.priority === "urgent" ? "bg-red-500/10 text-red-400" :
                      t.priority === "high" ? "bg-amber-500/10 text-amber-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <p className="text-xs text-gray-600">+{dayTasks.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && selectedTasks.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-100">
            {new Date(selected).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          {selectedTasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 text-sm">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === "done" ? "bg-emerald-400" : "bg-blue-400"}`} />
              <span className={`flex-1 ${t.status === "done" ? "line-through text-gray-600" : "text-gray-200"}`}>{t.title}</span>
              <PriorityBadge priority={t.priority} />
            </div>
          ))}
        </div>
      )}

      {selected && selectedTasks.length === 0 && (
        <p className="text-sm text-gray-500 text-center">No tasks due on this date.</p>
      )}
    </div>
  );
}
