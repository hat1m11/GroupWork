import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Resource } from "@/lib/supabase/types";

function detectCategory(url: string): Resource["category"] {
  if (url.includes("docs.google.com/document")) return "doc";
  if (url.includes("docs.google.com/spreadsheets")) return "sheet";
  if (url.includes("docs.google.com/presentation")) return "slide";
  if (url.split("?")[0].toLowerCase().endsWith(".pdf")) return "pdf";
  return "link";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: m } = await admin.from("group_members").select("id").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  if (!m) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: resources } = await admin
    .from("resources")
    .select("*, users(full_name, email)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ resources: resources ?? [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: m } = await admin.from("group_members").select("id").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  if (!m) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, url, description, task_id } = await req.json();
  if (!title?.trim() || !url?.trim()) return NextResponse.json({ error: "title and url required" }, { status: 400 });

  const category = detectCategory(url.trim());

  const { data: resource, error } = await admin
    .from("resources")
    .insert({ group_id: groupId, title: title.trim(), url: url.trim(), category, description: description?.trim() || null, task_id: task_id || null, created_by: user.id })
    .select("*, users(full_name, email)")
    .single();

  if (error || !resource) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  return NextResponse.json({ resource }, { status: 201 });
}
