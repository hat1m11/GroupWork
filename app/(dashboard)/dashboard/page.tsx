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
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-50 tracking-tight">My Groups</h1>
          <p className="text-gray-400 mt-1 text-sm">All your active group projects in one place.</p>
        </div>
        <div className="flex gap-2">
          <JoinGroupButton />
          <CreateGroupButton />
        </div>
      </div>

      <UpcomingDeadlinesWidget tasks={upcomingTasks} />

      {groups.length === 0 ? (
        <div className="text-center py-24 bg-gray-900 border-2 border-dashed border-[#1E2A3A] rounded-xl">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-200 mb-1">No groups yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Create a group for your assignment or join one using an invite code from a teammate.
          </p>
          <div className="flex gap-3 justify-center">
            <JoinGroupButton />
            <CreateGroupButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            if (!group?.id) return null;
            const daysLeft = group.due_date
              ? Math.ceil((new Date(group.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const overdueCount = overdueCountByGroup[group.id] ?? 0;
            const isUrgent = daysLeft !== null && daysLeft < 3;
            const isSoon = daysLeft !== null && daysLeft < 7 && !isUrgent;
            const leftBorder = overdueCount > 0 || isUrgent
              ? "border-l-red-500"
              : isSoon
              ? "border-l-amber-500"
              : "border-l-blue-500";

            return (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className={`group block border border-l-4 ${leftBorder} rounded-xl p-5 transition-all duration-150`}
                style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
                    {group.course_code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {overdueCount > 0 && (
                      <span className="text-xs bg-red-500/10 text-red-400 rounded-full px-2 py-0.5 font-medium">
                        ⚠ {overdueCount} overdue
                      </span>
                    )}
                    {group.role === "owner" && (
                      <span className="text-xs bg-purple-500/10 text-purple-400 rounded-full px-2 py-0.5 font-medium">
                        Owner
                      </span>
                    )}
                  </div>
                </div>

                {/* Group name */}
                <h2 className="font-bold text-gray-100 text-base leading-tight mb-1 group-hover:text-blue-300 transition-colors">
                  {group.name}
                </h2>
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">{group.assignment_name}</p>

                {/* Deadline footer */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--ct-bd)" }}>
                  {daysLeft !== null ? (
                    <span className={`text-xs font-medium flex items-center gap-1 ${
                      isUrgent ? "text-red-400" : isSoon ? "text-amber-400" : "text-gray-500"
                    }`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {daysLeft > 0
                        ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`
                        : daysLeft === 0
                        ? "Due today!"
                        : "Overdue"}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">No deadline set</span>
                  )}
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
