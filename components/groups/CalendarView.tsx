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
        <h2 className="font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">‹</button>
          <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelected(null); }} className="px-3 py-1 text-xs rounded-lg bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 transition-colors">Today</button>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">›</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DOW.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50" />
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
                className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 cursor-pointer transition-colors ${
                  isSelected ? "bg-indigo-50" : isToday ? "bg-amber-50/50" : "hover:bg-gray-50"
                }`}
              >
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday ? "bg-indigo-600 text-white" : "text-gray-700"
                }`}>
                  {day}
                </span>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 2).map((t) => (
                    <div key={t.id} className={`text-xs truncate rounded px-1 py-0.5 ${
                      t.priority === "urgent" ? "bg-red-100 text-red-700" :
                      t.priority === "high" ? "bg-amber-100 text-amber-700" :
                      "bg-indigo-100 text-indigo-700"
                    }`}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <p className="text-xs text-gray-400">+{dayTasks.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && selectedTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-indigo-200 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {new Date(selected).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          {selectedTasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 text-sm">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === "done" ? "bg-green-400" : "bg-indigo-400"}`} />
              <span className={`flex-1 ${t.status === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>{t.title}</span>
              <PriorityBadge priority={t.priority} />
            </div>
          ))}
        </div>
      )}

      {selected && selectedTasks.length === 0 && (
        <p className="text-sm text-gray-400 text-center">No tasks due on this date.</p>
      )}
    </div>
  );
}
