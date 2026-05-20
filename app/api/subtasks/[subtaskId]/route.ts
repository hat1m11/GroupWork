import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getSubtaskGroupId(subtaskId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: subtask } = await admin.from("subtasks").select("task_id").eq("id", subtaskId).single();
  if (!subtask) return null;
  const { data: task } = await admin.from("tasks").select("group_id").eq("id", subtask.task_id).single();
  return task?.group_id ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ subtaskId: string }> }
) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { subtaskId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groupId = await getSubtaskGroupId(subtaskId, admin);
  if (!groupId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: membership } = await admin
    .from("group_members").select("id").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const update: { completed?: boolean; title?: string } = {};
  if (typeof body.completed === "boolean") update.completed = body.completed;
  if (typeof body.title === "string" && body.title.trim()) {
    update.title = body.title.trim().slice(0, 200);
  }

  const { data: subtask, error } = await admin
    .from("subtasks").update(update).eq("id", subtaskId).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subtask });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ subtaskId: string }> }
) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { subtaskId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groupId = await getSubtaskGroupId(subtaskId, admin);
  if (!groupId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: membership } = await admin
    .from("group_members").select("id").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await admin.from("subtasks").delete().eq("id", subtaskId);
  return NextResponse.json({ ok: true });
}
