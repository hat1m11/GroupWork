import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Meeting } from "@/lib/supabase/types";

function detectPlatform(url: string | null): Meeting["platform"] {
  if (!url) return null;
  if (url.includes("zoom.us")) return "zoom";
  if (url.includes("meet.google.com")) return "meet";
  if (url.includes("teams.microsoft.com")) return "teams";
  return "other";
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

  const { data: meetings } = await admin
    .from("meetings")
    .select("*, users(full_name, email)")
    .eq("group_id", groupId)
    .order("scheduled_at", { ascending: true });

  return NextResponse.json({ meetings: meetings ?? [] });
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

  const { title, scheduled_at, duration_minutes, call_link } = await req.json();
  if (!title?.trim() || !scheduled_at) return NextResponse.json({ error: "title and scheduled_at required" }, { status: 400 });

  const platform = detectPlatform(call_link ?? null);

  const { data: meeting, error } = await admin
    .from("meetings")
    .insert({ group_id: groupId, title: title.trim(), scheduled_at, duration_minutes: duration_minutes ?? 60, call_link: call_link?.trim() || null, platform, created_by: user.id })
    .select("*, users(full_name, email)")
    .single();

  if (error || !meeting) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  return NextResponse.json({ meeting }, { status: 201 });
}
