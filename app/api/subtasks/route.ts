import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser, getMembership, sanitize, isUUID, r400, r401, r403, r404, r500 } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("task_id");

  if (!isUUID(taskId)) return r400("Invalid task_id");

  const user = await getUser();
  if (!user) return r401();

  const admin = createAdminClient();

  const { data: task } = await admin.from("tasks").select("group_id").eq("id", taskId!).single();
  if (!task) return r404("Task");

  const membership = await getMembership(task.group_id, user.id);
  if (!membership) return r403();

  const { data: subtasks } = await admin
    .from("subtasks")
    .select("*")
    .eq("task_id", taskId!)
    .order("sort_order");

  return NextResponse.json({ subtasks: subtasks ?? [] });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return r401();

  const body = await request.json().catch(() => null);
  if (!body) return r400("Invalid request body");

  const taskId = body.task_id;
  const title = sanitize(body.title, 200);
  const sortOrder = typeof body.sort_order === "number" ? body.sort_order : 0;

  if (!isUUID(taskId)) return r400("Invalid task_id");
  if (!title) return r400("Subtask title is required (max 200 characters)");

  const admin = createAdminClient();

  const { data: task } = await admin.from("tasks").select("group_id").eq("id", taskId).single();
  if (!task) return r404("Task");

  const membership = await getMembership(task.group_id, user.id);
  if (!membership) return r403();

  const { data: existing } = await admin
    .from("subtasks")
    .select("id")
    .eq("task_id", taskId);

  if ((existing?.length ?? 0) >= 20) {
    return r400("Maximum 20 subtasks per task");
  }

  const { data: subtask, error } = await admin
    .from("subtasks")
    .insert({ task_id: taskId, title, sort_order: sortOrder })
    .select()
    .single();

  if (error || !subtask) return r500();

  return NextResponse.json({ subtask }, { status: 201 });
}
