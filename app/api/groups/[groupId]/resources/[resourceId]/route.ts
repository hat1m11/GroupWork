import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; resourceId: string }> }
) {
  const { groupId, resourceId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await admin.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: resource } = await admin.from("resources").select("created_by").eq("id", resourceId).single();
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (resource.created_by !== user.id && membership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await admin.from("resources").delete().eq("id", resourceId);
  return NextResponse.json({ ok: true });
}
