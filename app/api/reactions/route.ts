import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser, isUUID, isAllowedEmoji, r400, r401, r403, r404 } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return r401();

  const body = await request.json().catch(() => ({}));
  const { message_id, emoji } = body;

  if (!isUUID(message_id)) return r400("Invalid message_id");
  if (!isAllowedEmoji(emoji)) return r400("Invalid emoji");

  const admin = createAdminClient();

  const { data: msg } = await admin
    .from("messages")
    .select("group_id")
    .eq("id", message_id)
    .single();

  if (!msg) return r404("Message");

  const { data: membership } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", msg.group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return r403();

  const { data: existing } = await admin
    .from("reactions")
    .select("id")
    .eq("message_id", message_id)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await admin.from("reactions").delete().eq("id", existing.id);
    return NextResponse.json({ action: "removed" });
  }

  await admin.from("reactions").insert({ message_id, user_id: user.id, emoji });
  return NextResponse.json({ action: "added" }, { status: 201 });
}
