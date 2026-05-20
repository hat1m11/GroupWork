import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { group_id, rubric_section_id, title, assigned_to, due_date, description, priority, tags } = body;

  if (!group_id || !title) {
    return NextResponse.json({ error: "group_id and title are required" }, { status: 400 });
  }

  // Verify user is a group member
  const { data: membership } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  const { data: task, error } = await admin
    .from("tasks")
    .insert({
      group_id,
      rubric_section_id: rubric_section_id ?? null,
      title,
      description: description ?? null,
      assigned_to: assigned_to ?? null,
      due_date: due_date ?? null,
      created_by: user.id,
      status: "todo",
      priority: priority ?? "medium",
      tags: tags ?? [],
    })
    .select()
    .single();

  if (error || !task) {
    return NextResponse.json({ error: error?.message ?? "Failed to create task" }, { status: 500 });
  }

  await admin.from("contribution_logs").insert({
    group_id,
    user_id: user.id,
    action_type: "task_created",
    description: `Created task "${title}"`,
    task_id: task.id,
  });

  return NextResponse.json({ task }, { status: 201 });
}
