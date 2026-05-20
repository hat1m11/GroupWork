import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { taskId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data: existing } = await admin
    .from("tasks")
    .select("group_id, title, status")
    .eq("id", taskId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { data: membership } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", existing.group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  type TaskUpdate = {
    title?: string;
    description?: string | null;
    status?: "todo" | "in_progress" | "done";
    priority?: "low" | "medium" | "high" | "urgent";
    assigned_to?: string | null;
    rubric_section_id?: string | null;
    due_date?: string | null;
  };

  const allowedFields: (keyof TaskUpdate)[] = [
    "title", "description", "status", "priority", "assigned_to", "rubric_section_id", "due_date",
  ];
  const update: TaskUpdate = {};
  for (const field of allowedFields) {
    if (field in body) (update as Record<string, unknown>)[field] = body[field];
  }

  const { data: task, error } = await admin
    .from("tasks")
    .update(update as Database["public"]["Tables"]["tasks"]["Update"])
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.status && body.status !== existing.status) {
    await admin.from("contribution_logs").insert({
      group_id: existing.group_id,
      user_id: user.id,
      action_type: "task_status_changed",
      description: `Marked "${existing.title}" as ${body.status}`,
      task_id: taskId,
    });
  }

  return NextResponse.json({ task });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { taskId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await admin
    .from("tasks")
    .select("group_id, created_by")
    .eq("id", taskId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { data: membership } = await admin
    .from("group_members")
    .select("id, role")
    .eq("group_id", existing.group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const canDelete =
    existing.created_by === user.id || membership.role === "owner";
  if (!canDelete) {
    return NextResponse.json({ error: "Only the task creator or group owner can delete" }, { status: 403 });
  }

  await admin.from("tasks").delete().eq("id", taskId);

  return NextResponse.json({ ok: true });
}
