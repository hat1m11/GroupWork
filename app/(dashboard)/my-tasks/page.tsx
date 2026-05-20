import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TaskWithGroup } from "@/lib/supabase/types";
import MyTasksBoard from "@/components/tasks/MyTasksBoard";

export default async function MyTasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: tasks } = await admin
    .from("tasks")
    .select("*, groups(id, name, course_code)")
    .eq("assigned_to", user.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 mt-1 text-sm">All tasks assigned to you across your groups.</p>
      </div>
      <MyTasksBoard
        tasks={(tasks ?? []) as TaskWithGroup[]}
        currentUserId={user.id}
      />
    </div>
  );
}
