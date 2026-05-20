import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CreateGroupButton from "@/components/groups/CreateGroupButton";
import JoinGroupButton from "@/components/groups/JoinGroupButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("group_members")
    .select(`
      role,
      groups (
        id,
        name,
        course_code,
        assignment_name,
        due_date,
        invite_code
      )
    `)
    .eq("user_id", user!.id)
    .order("joined_at", { ascending: false });

  type MembershipRow = {
    role: "owner" | "member";
    groups: {
      id: string;
      name: string;
      course_code: string;
      assignment_name: string;
      due_date: string | null;
      invite_code: string;
    } | null;
  };
  const groups =
    (memberships as unknown as MembershipRow[])?.map((m) => ({
      ...m.groups,
      role: m.role,
    })) ?? [];

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

      {groups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-lg">No groups yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Create a group or join one with an invite code
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            if (!group) return null;
            const daysLeft = group.due_date
              ? Math.ceil(
                  (new Date(group.due_date).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

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
                  {group.role === "owner" && (
                    <span className="text-xs text-gray-400">Owner</span>
                  )}
                </div>
                <h2 className="font-semibold text-gray-900 text-lg leading-tight mb-1">
                  {group.name}
                </h2>
                <p className="text-sm text-gray-500 mb-4">{group.assignment_name}</p>

                {daysLeft !== null && (
                  <p
                    className={`text-xs font-medium ${
                      daysLeft < 3
                        ? "text-red-500"
                        : daysLeft < 7
                        ? "text-amber-500"
                        : "text-gray-400"
                    }`}
                  >
                    {daysLeft > 0
                      ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`
                      : daysLeft === 0
                      ? "Due today"
                      : "Overdue"}
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
