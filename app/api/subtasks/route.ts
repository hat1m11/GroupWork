import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("task_id");

  if (!taskId) return NextResponse.json({ error: "task_id required" }, { status: 400 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: task } = await admin.from("tasks").select("group_id").eq("id", taskId).single();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { data: membership } = await admin
    .from("group_members").select("id").eq("group_id", task.group_id).eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: subtasks } = await admin
    .from("subtasks").select("*").eq("task_id", taskId).order("sort_order");

  return NextResponse.json({ subtasks: subtasks ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { task_id, title, sort_order } = await request.json();
  if (!task_id || !title?.trim()) return NextResponse.json({ error: "task_id and title required" }, { status: 400 });

  const { data: task } = await admin.from("tasks").select("group_id").eq("id", task_id).single();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { data: membership } = await admin
    .from("group_members").select("id").eq("group_id", task.group_id).eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: subtask, error } = await admin
    .from("subtasks").insert({ task_id, title: title.trim(), sort_order: sort_order ?? 0 }).select().single();

  if (error || !subtask) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });

  return NextResponse.json({ subtask }, { status: 201 });
}
