import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser, sanitize, isUUID, r400, r401, r403, r404, r500 } from "@/lib/api";
import type { Database } from "@/lib/supabase/types";

const VALID_STATUS = new Set(["todo", "in_progress", "done", "blocked"]);
const VALID_PRIORITY = new Set(["low", "medium", "high", "urgent"]);
const VALID_TAGS = new Set(["research", "writing", "review", "design", "code"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  if (!isUUID(taskId)) return r400("Invalid task ID");

  const user = await getUser();
  if (!user) return r401();

  const body = await request.json().catch(() => null);
  if (!body) return r400("Invalid request body");

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("tasks")
    .select("group_id, title, status")
    .eq("id", taskId)
    .single();

  if (!existing) return r404("Task");

  const { data: membership } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", existing.group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return r403();

  type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
  const update: Partial<TaskUpdate> = {};

  if ("title" in body) {
    const t = sanitize(body.title, 200);
    if (!t) return r400("Title cannot be empty (max 200 characters)");
    update.title = t;
  }
  if ("description" in body) {
    update.description = sanitize(body.description, 2000);
  }
  if ("status" in body) {
    if (!VALID_STATUS.has(body.status)) return r400("Invalid status value");
    update.status = body.status;
  }
  if ("priority" in body) {
    if (!VALID_PRIORITY.has(body.priority)) return r400("Invalid priority value");
    update.priority = body.priority;
  }
  if ("tags" in body) {
    const tags = Array.isArray(body.tags)
      ? body.tags.filter((t: unknown) => typeof t === "string" && VALID_TAGS.has(t)).slice(0, 5)
      : [];
    update.tags = tags;
  }
  if ("assigned_to" in body) {
    if (body.assigned_to !== null && !isUUID(body.assigned_to)) return r400("Invalid assigned_to");
    update.assigned_to = body.assigned_to;
  }
  if ("rubric_section_id" in body) {
    if (body.rubric_section_id !== null && !isUUID(body.rubric_section_id)) return r400("Invalid rubric_section_id");
    update.rubric_section_id = body.rubric_section_id;
  }
  if ("due_date" in body) {
    if (body.due_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) return r400("Invalid due_date format");
    update.due_date = body.due_date;
  }

  const { data: task, error } = await admin
    .from("tasks")
    .update(update)
    .eq("id", taskId)
    .select()
    .single();

  if (error) return r500();

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
  const { taskId } = await params;
  if (!isUUID(taskId)) return r400("Invalid task ID");

  const user = await getUser();
  if (!user) return r401();

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("tasks")
    .select("group_id, created_by")
    .eq("id", taskId)
    .single();

  if (!existing) return r404("Task");

  const { data: membership } = await admin
    .from("group_members")
    .select("id, role")
    .eq("group_id", existing.group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return r403();

  if (existing.created_by !== user.id && membership.role !== "owner") {
    return r403("Only the task creator or group owner can delete this task");
  }

  await admin.from("tasks").delete().eq("id", taskId);

  return NextResponse.json({ ok: true });
}
