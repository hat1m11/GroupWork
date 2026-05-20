import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message_id, emoji } = await request.json();
  if (!message_id || !emoji) return NextResponse.json({ error: "message_id and emoji required" }, { status: 400 });

  const { data: msg } = await admin.from("messages").select("group_id").eq("id", message_id).single();
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: m } = await admin.from("group_members").select("id").eq("group_id", msg.group_id).eq("user_id", user.id).maybeSingle();
  if (!m) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Toggle: insert or delete
  const { data: existing } = await admin.from("reactions").select("id").eq("message_id", message_id).eq("user_id", user.id).eq("emoji", emoji).maybeSingle();

  if (existing) {
    await admin.from("reactions").delete().eq("id", existing.id);
    return NextResponse.json({ action: "removed" });
  }

  await admin.from("reactions").insert({ message_id, user_id: user.id, emoji });
  return NextResponse.json({ action: "added" }, { status: 201 });
}
