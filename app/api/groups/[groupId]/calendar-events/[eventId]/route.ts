import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; eventId: string }> }
) {
  const { groupId, eventId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: event } = await admin
    .from("calendar_events")
    .select("created_by, group_id")
    .eq("id", eventId)
    .eq("group_id", groupId)
    .single();

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.created_by !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await admin.from("calendar_events").delete().eq("id", eventId);
  return NextResponse.json({ ok: true });
}
