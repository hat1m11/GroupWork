import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; userId: string }> }
) {
  const { groupId, userId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (userId === user.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

  const { data: requester } = await admin.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  if (!requester || requester.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  // Unassign their tasks first
  await admin.from("tasks").update({ assigned_to: null }).eq("group_id", groupId).eq("assigned_to", userId);
  // Remove from group
  await admin.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);

  return NextResponse.json({ ok: true });
}
