import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TaskBoard from "@/components/tasks/TaskBoard";
import InviteCodeBadge from "@/components/groups/InviteCodeBadge";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: Props) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) notFound();

  // Fetch group details
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  // Fetch rubric sections
  const { data: rubricSections } = await supabase
    .from("rubric_sections")
    .select("*")
    .eq("group_id", groupId)
    .order("sort_order");

  // Fetch tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at");

  type MemberRow = {
    role: "owner" | "member";
    user_id: string;
    users: { id: string; full_name: string | null; email: string } | null;
  };

  // Fetch members with user info
  const { data: rawMembers } = await supabase
    .from("group_members")
    .select(`
      role,
      user_id,
      users (
        id,
        full_name,
        email
      )
    `)
    .eq("group_id", groupId);

  const members = rawMembers as unknown as MemberRow[] | null;

  const daysLeft = group.due_date
    ? Math.ceil(
        (new Date(group.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div>
      {/* Group header */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-0.5 rounded-full">
                {group.course_code}
              </span>
              {daysLeft !== null && (
                <span
                  className={`text-sm font-medium ${
                    daysLeft < 3
                      ? "text-red-500"
                      : daysLeft < 7
                      ? "text-amber-500"
                      : "text-gray-500"
                  }`}
                >
                  {daysLeft > 0
                    ? `${daysLeft}d left`
                    : daysLeft === 0
                    ? "Due today"
                    : "Overdue"}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-500 mt-0.5">{group.assignment_name}</p>
          </div>
          <InviteCodeBadge code={group.invite_code} />
        </div>

        {/* Members row */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">Members:</span>
          <div className="flex gap-1.5 flex-wrap">
            {members?.map((m) => (
              <span
                key={m.user_id}
                className="text-xs bg-gray-100 text-gray-700 rounded-full px-3 py-1"
              >
                {m.users?.full_name ?? m.users?.email ?? "Unknown"}
                {m.role === "owner" && (
                  <span className="ml-1 text-gray-400">(owner)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Task board */}
      <TaskBoard
        groupId={groupId}
        rubricSections={rubricSections ?? []}
        initialTasks={tasks ?? []}
        members={
          members?.map((m) => ({
            id: m.user_id,
            full_name: m.users?.full_name ?? null,
            email: m.users?.email ?? "",
          })) ?? []
        }
        currentUserId={user.id}
      />
    </div>
  );
}
