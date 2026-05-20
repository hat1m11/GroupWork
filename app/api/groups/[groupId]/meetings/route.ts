import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Meeting } from "@/lib/supabase/types";

const MAX_MEETINGS = 50;
const MAX_TITLE = 100;
const MAX_CALL_LINK = 500;
const MAX_DURATION = 480;

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

  const { count: meetingCount } = await admin
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if ((meetingCount ?? 0) >= MAX_MEETINGS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_MEETINGS} meetings per group` },
      { status: 400 }
    );
  }

  const { title, scheduled_at, duration_minutes, call_link } = await req.json();

  const trimmedTitle = typeof title === "string" ? title.trim().slice(0, MAX_TITLE) : "";
  if (!trimmedTitle || !scheduled_at) {
    return NextResponse.json({ error: "title and scheduled_at required" }, { status: 400 });
  }

  const duration = typeof duration_minutes === "number" ? duration_minutes : 60;
  if (!Number.isInteger(duration) || duration < 1 || duration > MAX_DURATION) {
    return NextResponse.json(
      { error: `duration_minutes must be between 1 and ${MAX_DURATION}` },
      { status: 400 }
    );
  }

  const trimmedLink = typeof call_link === "string" ? call_link.trim().slice(0, MAX_CALL_LINK) : null;
  const platform = detectPlatform(trimmedLink || null);

  const { data: meeting, error } = await admin
    .from("meetings")
    .insert({
      group_id: groupId,
      title: trimmedTitle,
      scheduled_at,
      duration_minutes: duration,
      call_link: trimmedLink || null,
      platform,
      created_by: user.id,
    })
    .select("*, users(full_name, email)")
    .single();

  if (error || !meeting) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  return NextResponse.json({ meeting }, { status: 201 });
}
