import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: msg } = await admin.from("messages").select("group_id, pinned").eq("id", messageId).single();
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: membership } = await admin.from("group_members").select("role").eq("group_id", msg.group_id).eq("user_id", user.id).maybeSingle();
  if (!membership || membership.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  // Enforce max 10 pinned messages when pinning
  if (!msg.pinned) {
    const { count: pinnedCount } = await admin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("group_id", msg.group_id)
      .eq("pinned", true);

    if ((pinnedCount ?? 0) >= 10) {
      return NextResponse.json(
        { error: "Maximum 10 pinned messages per group. Unpin one first." },
        { status: 400 }
      );
    }
  }

  await admin.from("messages").update({ pinned: !msg.pinned }).eq("id", messageId);
  return NextResponse.json({ pinned: !msg.pinned });
}
