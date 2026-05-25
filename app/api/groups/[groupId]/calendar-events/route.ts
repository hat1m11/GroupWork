import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_EVENTS = 200;

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

  const { data: events } = await admin
    .from("calendar_events")
    .select("*")
    .eq("group_id", groupId)
    .order("date", { ascending: true });

  return NextResponse.json({ events: events ?? [] });
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

  const { count } = await admin
    .from("calendar_events")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if ((count ?? 0) >= MAX_EVENTS) {
    return NextResponse.json({ error: `Maximum ${MAX_EVENTS} calendar events per group` }, { status: 400 });
  }

  const { title, type, date } = await req.json();

  const trimmed = typeof title === "string" ? title.trim().slice(0, 25) : "";
  if (!trimmed) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!["meeting", "deadline", "custom"].includes(type)) {
    return NextResponse.json({ error: "type must be meeting, deadline, or custom" }, { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date required (YYYY-MM-DD)" }, { status: 400 });
  }

  const { data: event, error } = await admin
    .from("calendar_events")
    .insert({ group_id: groupId, created_by: user.id, type, title: trimmed, date })
    .select()
    .single();

  if (error || !event) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  return NextResponse.json({ event }, { status: 201 });
}
