import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import CreateGroupButton from "@/components/groups/CreateGroupButton";
import JoinGroupButton from "@/components/groups/JoinGroupButton";
import UpcomingDeadlinesWidget from "@/components/dashboard/UpcomingDeadlinesWidget";
import type { TaskWithGroup } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await admin
    .from("group_members")
    .select("role, groups(id, name, course_code, assignment_name, due_date, invite_code)")
    .eq("user_id", user!.id)
    .order("joined_at", { ascending: false });

  type MembershipRow = {
    role: "owner" | "member";
    groups: { id: string; name: string; course_code: string; assignment_name: string; due_date: string | null; invite_code: string } | null;
  };

  const groups = (memberships as unknown as MembershipRow[])?.map((m) => ({ ...m.groups, role: m.role })) ?? [];
  const groupIds = groups.map((g) => g?.id).filter(Boolean) as string[];

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [upcomingResult, overdueResult] = await Promise.all([
    groupIds.length > 0
      ? admin.from("tasks").select("*, groups(id, name, course_code)").eq("assigned_to", user!.id).neq("status", "done").lte("due_date", sevenDaysFromNow).gte("due_date", today).order("due_date", { ascending: true })
      : Promise.resolve({ data: [] }),
    groupIds.length > 0
      ? admin.from("tasks").select("group_id").in("group_id", groupIds).neq("status", "done").lt("due_date", today).not("due_date", "is", null)
      : Promise.resolve({ data: [] }),
  ]);

  const upcomingTasks = (upcomingResult.data ?? []) as TaskWithGroup[];

  const overdueCountByGroup: Record<string, number> = {};
  for (const row of overdueResult.data ?? []) {
    overdueCountByGroup[row.group_id] = (overdueCountByGroup[row.group_id] ?? 0) + 1;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
          <p className="text-gray-500 mt-1">Manage your project groups</p>
        </div>
        <div className="flex gap-3">
          <JoinGroupButton />
          <CreateGroupButton />
        </div>
      </div>

      <UpcomingDeadlinesWidget tasks={upcomingTasks} />

      {groups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-lg">No groups yet</p>
          <p className="text-gray-400 text-sm mt-1">Create a group or join one with an invite code</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            if (!group?.id) return null;
            const daysLeft = group.due_date
              ? Math.ceil((new Date(group.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const overdueCount = overdueCountByGroup[group.id] ?? 0;

            return (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {group.course_code}
                  </span>
                  <div className="flex items-center gap-2">
                    {overdueCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-medium">
                        {overdueCount} overdue
                      </span>
                    )}
                    {group.role === "owner" && (
                      <span className="text-xs text-gray-400">Owner</span>
                    )}
                  </div>
                </div>
                <h2 className="font-semibold text-gray-900 text-lg leading-tight mb-1">{group.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{group.assignment_name}</p>

                {daysLeft !== null && (
                  <p className={`text-xs font-medium ${daysLeft < 3 ? "text-red-500" : daysLeft < 7 ? "text-amber-500" : "text-gray-400"}`}>
                    {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left` : daysLeft === 0 ? "Due today" : "Overdue"}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
