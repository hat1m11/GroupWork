"use client";

import { useState, useEffect } from "react";
import type { RubricSection, Task, MessageWithUser, ResourceWithUser, MeetingWithUser } from "@/lib/supabase/types";
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
  overdueTasks: Task[];
}

type Tab = "board" | "chat" | "resources" | "meetings" | "calendar" | "workload" | "activity" | "notes";

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
  subtaskCounts, initialMessages, initialResources, initialMeetings, overdueTasks,
}: Props) {
  const [tab, setTab] = useState<Tab>("board");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/presence`, { method: "PATCH" });
  }, [groupId]);

  return (
    <div>
      {overdueTasks.length > 0 && !dismissed && (
        <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span>⚠ {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? "s" : ""} in this group.</span>
          <button onClick={() => setDismissed(true)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="flex gap-0 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap flex-shrink-0 ${
              tab === t.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
      {tab === "calendar" && <CalendarView groupId={groupId} tasks={initialTasks} />}
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
