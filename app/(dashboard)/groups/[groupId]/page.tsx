import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import GroupHeader from "@/components/groups/GroupHeader";
import GroupWorkspace from "@/components/groups/GroupWorkspace";
import type { MessageWithUser, MemberWithPresence, ResourceWithUser, MeetingWithUser, CalendarEvent } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string>>;
}

const VALID_TABS = ["board","chat","calendar","workload","resources","meetings","activity","notes"] as const;
type Tab = typeof VALID_TABS[number];

export default async function GroupPage({ params, searchParams }: Props) {
  const { groupId } = await params;
  const { tab: tabParam } = await searchParams;
  const initialTab: Tab = VALID_TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "board";
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await admin
    .from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  if (!membership) notFound();

  const { data: group } = await admin.from("groups").select("*").eq("id", groupId).single();
  if (!group) notFound();

  const isOwner = membership.role === "owner";

  const [
    { data: rubricSections },
    { data: tasks },
    { data: rawMembers },
    { data: rawMessages },
    { data: rawResources },
    { data: rawMeetings },
    { data: rawCalendarEvents },
  ] = await Promise.all([
    admin.from("rubric_sections").select("*").eq("group_id", groupId).order("sort_order"),
    admin.from("tasks").select("*").eq("group_id", groupId).order("created_at"),
    admin.from("group_members").select("role, user_id, joined_at, last_active_at, users(id, full_name, email)").eq("group_id", groupId),
    admin.from("messages").select("*, users(full_name, email)").eq("group_id", groupId).order("created_at", { ascending: true }).limit(50),
    admin.from("resources").select("*, users(full_name, email)").eq("group_id", groupId).order("created_at", { ascending: false }),
    admin.from("meetings").select("*, users(full_name, email)").eq("group_id", groupId).order("scheduled_at", { ascending: true }),
    admin.from("calendar_events").select("*").eq("group_id", groupId).order("date", { ascending: true }),
  ]);

  const members = rawMembers as unknown as MemberWithPresence[] | null;

  const memberList = members?.map((m) => ({
    id: m.user_id,
    full_name: m.users?.full_name ?? null,
    email: m.users?.email ?? "",
  })) ?? [];

  // Aggregate subtask counts
  const taskIds = (tasks ?? []).map((t) => t.id);
  const subtaskCounts: Record<string, { total: number; completed: number }> = {};

  if (taskIds.length > 0) {
    const { data: subtaskRows } = await admin
      .from("subtasks").select("task_id, completed").in("task_id", taskIds);

    for (const row of subtaskRows ?? []) {
      if (!subtaskCounts[row.task_id]) subtaskCounts[row.task_id] = { total: 0, completed: 0 };
      subtaskCounts[row.task_id].total++;
      if (row.completed) subtaskCounts[row.task_id].completed++;
    }
  }

  // Compute overdue tasks server-side
  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = (tasks ?? []).filter(
    (t) => t.status !== "done" && t.due_date !== null && t.due_date < today
  );

  return (
    <div>
      <GroupHeader
        group={group}
        members={members ?? []}
        currentUserId={user.id}
        isOwner={isOwner}
      />

      <GroupWorkspace
        groupId={groupId}
        initialTab={initialTab}
        rubricSections={rubricSections ?? []}
        initialTasks={tasks ?? []}
        members={memberList}
        currentUserId={user.id}
        isOwner={isOwner}
        subtaskCounts={subtaskCounts}
        initialMessages={(rawMessages ?? []) as MessageWithUser[]}
        initialResources={(rawResources ?? []) as ResourceWithUser[]}
        initialMeetings={(rawMeetings ?? []) as MeetingWithUser[]}
        initialCalendarEvents={(rawCalendarEvents ?? []) as CalendarEvent[]}
        overdueTasks={overdueTasks}
      />
    </div>
  );
}
