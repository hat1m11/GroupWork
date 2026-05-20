import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await admin.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  if (!membership || membership.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const body = await req.json();
  const update: { name?: string; assignment_name?: string; due_date?: string | null } = {};
  if (typeof body.name === "string" && body.name.trim()) {
    const name = body.name.trim().slice(0, 100);
    if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    update.name = name;
  }
  if (typeof body.assignment_name === "string" && body.assignment_name.trim()) {
    const assignmentName = body.assignment_name.trim().slice(0, 100);
    if (!assignmentName) return NextResponse.json({ error: "Assignment name cannot be empty" }, { status: 400 });
    update.assignment_name = assignmentName;
  }
  if ("due_date" in body) update.due_date = body.due_date || null;

  const { data: group, error } = await admin.from("groups").update(update).eq("id", groupId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ group });
}
