"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { RubricSection, Task } from "@/lib/supabase/types";
import RubricSectionColumn from "./RubricSectionColumn";
import CreateTaskModal from "./CreateTaskModal";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  groupId: string;
  rubricSections: RubricSection[];
  initialTasks: Task[];
  members: Member[];
  currentUserId: string;
  isOwner?: boolean;
  subtaskCounts?: Record<string, { total: number; completed: number }>;
}

const PRIORITY_ORDER: Record<Task["priority"], number> = {
  urgent: 0, high: 1, medium: 2, low: 3,
};

const PRIORITY_ACTIVE: Record<Task["priority"], string> = {
  urgent: "bg-red-500/15 text-red-400 border-red-500/30",
  high:   "bg-amber-500/15 text-amber-400 border-amber-500/30",
  medium: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  low:    "bg-gray-500/15 text-gray-300 border-gray-500/30",
};

const ALL_TAGS = ["research", "writing", "review", "design", "code"];

export default function TaskBoard({
  groupId, rubricSections, initialTasks, members, currentUserId,
  isOwner = false, subtaskCounts = {},
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [createFor, setCreateFor] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Task["priority"] | "">("");
  const [filterTag, setFilterTag] = useState("");
  const [hideBlocked, setHideBlocked] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeFilterCount = [filterPriority, filterTag].filter(Boolean).length;
  const hasAnyActive = activeFilterCount > 0 || sortByPriority || hideBlocked;

  function clearAll() {
    setFilterPriority(""); setFilterTag("");
    setSortByPriority(false); setHideBlocked(false);
  }

  const handleTaskCreated = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
    setCreateFor(null);
  }, []);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: Task["status"]) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: tasks.find((x) => x.id === taskId)!.status } : t)));
    }
  }, [tasks]);

  const handlePriorityChange = useCallback(async (taskId: string, newPriority: Task["priority"]) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t)));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: newPriority }),
    });
  }, []);

  const handleReassign = useCallback(async (taskId: string, userId: string | null) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assigned_to: userId } : t)));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: userId }),
    });
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  }, []);

  const visibleTasks = tasks
    .filter((t) => !filterPriority || t.priority === filterPriority)
    .filter((t) => !filterTag || t.tags.includes(filterTag))
    .filter((t) => !hideBlocked || t.status !== "blocked")
    .sort((a, b) => sortByPriority ? PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] : 0);

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2 border" style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}>

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
              activeFilterCount > 0
                ? "border-blue-500/40 text-blue-400 bg-blue-500/10"
                : "border-[#1E2A3A] text-gray-400 hover:text-gray-200 hover:border-[#2D3F55]"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute top-full left-0 mt-1.5 z-40 rounded-xl shadow-2xl p-4 w-64 border" style={{ background: "var(--ct-nav)", borderColor: "var(--ct-bd)" }}>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Priority</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(["urgent", "high", "medium", "low"] as Task["priority"][]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(filterPriority === p ? "" : p)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 border ${
                      filterPriority === p ? PRIORITY_ACTIVE[p] : "border-[#1E2A3A] text-gray-400 hover:text-gray-200 hover:border-[#2D3F55]"
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <div className="h-px mb-3" style={{ background: "var(--ct-bd)" }} />
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Labels</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTag(filterTag === t ? "" : t)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 border ${
                      filterTag === t
                        ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                        : "border-[#1E2A3A] text-gray-400 hover:text-gray-200 hover:border-[#2D3F55]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {filterPriority && (
          <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_ACTIVE[filterPriority]}`}>
            {filterPriority}
            <button onClick={() => setFilterPriority("")} className="hover:opacity-70 leading-none">×</button>
          </span>
        )}
        {filterTag && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {filterTag}
            <button onClick={() => setFilterTag("")} className="hover:opacity-70 leading-none">×</button>
          </span>
        )}

        {/* Right: view controls */}
        <div className="ml-auto flex items-center gap-0.5">
          {hasAnyActive && (
            <>
              <button
                onClick={clearAll}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors px-2 py-1"
              >
                ✕ Clear
              </button>
              <div className="w-px h-4 bg-[#1E2A3A] mx-1" />
            </>
          )}
          <button
            onClick={() => setSortByPriority((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
              sortByPriority ? "text-blue-400 bg-blue-500/10" : "text-gray-500 hover:text-gray-300"
            }`}
            title="Sort by priority within each column"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M10 17h4" />
            </svg>
            Priority sort
          </button>
          <button
            onClick={() => setHideBlocked((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
              hideBlocked ? "text-red-400 bg-red-500/10" : "text-gray-500 hover:text-gray-300"
            }`}
            title="Toggle blocked task visibility"
          >
            {hideBlocked ? "Show blocked" : "Hide blocked"}
          </button>
        </div>
      </div>

      {rubricSections.map((section) => {
        const sectionTasks = visibleTasks.filter((t) => t.rubric_section_id === section.id);
        const doneTasks = sectionTasks.filter((t) => t.status === "done").length;
        const progress = sectionTasks.length > 0 ? Math.round((doneTasks / sectionTasks.length) * 100) : 0;
        return (
          <RubricSectionColumn
            key={section.id}
            section={section}
            tasks={sectionTasks}
            members={members}
            progress={progress}
            currentUserId={currentUserId}
            isOwner={isOwner}
            subtaskCounts={subtaskCounts}
            onCreateTask={() => setCreateFor(section.id)}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onReassign={handleReassign}
            onDeleteTask={handleDeleteTask}
          />
        );
      })}

      {createFor && (
        <CreateTaskModal
          groupId={groupId}
          rubricSectionId={createFor}
          members={members}
          onCreated={handleTaskCreated}
          onClose={() => setCreateFor(null)}
        />
      )}
    </div>
  );
}
