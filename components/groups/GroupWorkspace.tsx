"use client";

import { useState } from "react";
import type { RubricSection, Task, MessageWithUser } from "@/lib/supabase/types";
import TaskBoard from "@/components/tasks/TaskBoard";
import ChatPanel from "@/components/chat/ChatPanel";

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
  subtaskCounts: Record<string, { total: number; completed: number }>;
  initialMessages: MessageWithUser[];
}

export default function GroupWorkspace({
  groupId,
  rubricSections,
  initialTasks,
  members,
  currentUserId,
  subtaskCounts,
  initialMessages,
}: Props) {
  const [tab, setTab] = useState<"board" | "chat">("board");

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["board", "chat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "board" ? "Task Board" : "Chat"}
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
          subtaskCounts={subtaskCounts}
        />
      )}

      {tab === "chat" && (
        <div className="h-[600px]">
          <ChatPanel
            groupId={groupId}
            currentUserId={currentUserId}
            initialMessages={initialMessages}
            members={members}
          />
        </div>
      )}
    </div>
  );
}
