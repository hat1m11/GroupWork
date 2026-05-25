"use client";

import { useState, useEffect } from "react";
import type { RubricSection, Task, MessageWithUser, ResourceWithUser, MeetingWithUser, CalendarEvent } from "@/lib/supabase/types";
import TaskBoard from "@/components/tasks/TaskBoard";
import ChatPanel from "@/components/chat/ChatPanel";
import ResourcesPanel from "./ResourcesPanel";
import MeetingsPanel from "./MeetingsPanel";
import ActivityFeed from "./ActivityFeed";
import WorkloadView from "./WorkloadView";
import CalendarView from "./CalendarView";
import GroupNotes from "./GroupNotes";

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
  isOwner: boolean;
  subtaskCounts: Record<string, { total: number; completed: number }>;
  initialMessages: MessageWithUser[];
  initialResources: ResourceWithUser[];
  initialMeetings: MeetingWithUser[];
  initialCalendarEvents: CalendarEvent[];
  initialTab?: string;
  overdueTasks: Task[];
}

type Tab = "board" | "chat" | "resources" | "meetings" | "calendar" | "workload" | "activity" | "notes";

function TabIcon({ id }: { id: Tab }) {
  const cls = "w-4 h-4 flex-shrink-0";
  const props = { className: cls, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 };
  switch (id) {
    case "board":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
    case "chat":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>;
    case "calendar":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
    case "workload":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
    case "resources":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" /></svg>;
    case "meetings":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>;
    case "activity":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
    case "notes":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
    default:
      return null;
  }
}

const TABS: { id: Tab; label: string }[] = [
  { id: "board",     label: "Board"     },
  { id: "chat",      label: "Chat"      },
  { id: "calendar",  label: "Calendar"  },
  { id: "workload",  label: "Workload"  },
  { id: "resources", label: "Resources" },
  { id: "meetings",  label: "Meetings"  },
  { id: "activity",  label: "Activity"  },
  { id: "notes",     label: "Notes"     },
];

export default function GroupWorkspace({
  groupId, rubricSections, initialTasks, members, currentUserId, isOwner,
  subtaskCounts, initialMessages, initialResources, initialMeetings, initialCalendarEvents, initialTab, overdueTasks,
}: Props) {
  const VALID_TABS: Tab[] = ["board", "chat", "calendar", "workload", "resources", "meetings", "activity", "notes"];
  const [tab, setTab] = useState<Tab>(() =>
    (initialTab && VALID_TABS.includes(initialTab as Tab)) ? (initialTab as Tab) : "board"
  );
  const [dismissed, setDismissed] = useState(false);

  function changeTab(newTab: Tab) {
    setTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    window.history.replaceState(null, "", url.toString());
  }

  useEffect(() => {
    fetch(`/api/groups/${groupId}/presence`, { method: "PATCH" });
  }, [groupId]);

  return (
    <div>
      {overdueTasks.length > 0 && !dismissed && (
        <div className="mb-4 flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <span>⚠ {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? "s" : ""} in this group.</span>
          <button onClick={() => setDismissed(true)} className="ml-4 text-red-500 hover:text-red-300 transition-colors">✕</button>
        </div>
      )}

      {/* Tab bar */}
      <div
        className="flex gap-0 mb-0 border-b overflow-x-auto"
        style={{ borderColor: "var(--ct-bd)", scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTab(t.id)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px whitespace-nowrap flex-shrink-0"
            style={tab === t.id
              ? { borderBottomColor: "#6E56CF", color: "#6E56CF", background: "rgba(110,86,207,0.05)" }
              : { borderBottomColor: "transparent", color: "#71717A" }
            }
          >
            <TabIcon id={t.id} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      {/* 1px divider under tabs — gives the board surface its own floor */}
      <div className="mb-5" />

      {tab === "board" && (
        <TaskBoard
          groupId={groupId}
          rubricSections={rubricSections}
          initialTasks={initialTasks}
          members={members}
          currentUserId={currentUserId}
          isOwner={isOwner}
          subtaskCounts={subtaskCounts}
        />
      )}
      {tab === "chat" && (
        <div className="h-[600px]">
          <ChatPanel
            groupId={groupId}
            currentUserId={currentUserId}
            isOwner={isOwner}
            initialMessages={initialMessages}
            members={members}
          />
        </div>
      )}
      {tab === "calendar" && (
        <CalendarView
          groupId={groupId}
          tasks={initialTasks}
          initialEvents={initialCalendarEvents}
          currentUserId={currentUserId}
        />
      )}
      {tab === "workload" && <WorkloadView tasks={initialTasks} members={members} />}
      {tab === "resources" && (
        <ResourcesPanel
          groupId={groupId}
          initialResources={initialResources}
          currentUserId={currentUserId}
          isOwner={isOwner}
        />
      )}
      {tab === "meetings" && (
        <MeetingsPanel
          groupId={groupId}
          initialMeetings={initialMeetings}
          currentUserId={currentUserId}
          isOwner={isOwner}
        />
      )}
      {tab === "activity" && <ActivityFeed groupId={groupId} />}
      {tab === "notes" && <GroupNotes groupId={groupId} />}
    </div>
  );
}
