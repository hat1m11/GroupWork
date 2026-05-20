import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { notificationId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: notification } = await admin
    .from("notifications").select("user_id").eq("id", notificationId).single();

  if (!notification || notification.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await admin.from("notifications").update({ read: true }).eq("id", notificationId);

  return NextResponse.json({ ok: true });
}
