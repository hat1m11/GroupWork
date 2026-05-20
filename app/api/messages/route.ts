import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("group_id");

  if (!groupId) return NextResponse.json({ error: "group_id required" }, { status: 400 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await admin
    .from("group_members").select("id").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: messages } = await admin
    .from("messages")
    .select("*, users(full_name, email)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(50);

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { group_id, content, parent_id } = await request.json();
  if (!group_id || !content?.trim()) return NextResponse.json({ error: "group_id and content required" }, { status: 400 });
  if (content.length > 4000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  const { data: membership } = await admin
    .from("group_members").select("id").eq("group_id", group_id).eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: message, error } = await admin
    .from("messages")
    .insert({ group_id, user_id: user.id, content: content.trim(), parent_id: parent_id ?? null })
    .select("*, users(full_name, email)")
    .single();

  if (error || !message) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });

  // Handle @mention notifications
  const mentionRegex = /@([\w\s]+?)(?=\s|$|@)/g;
  const mentions = [...content.matchAll(mentionRegex)].map((m) => m[1].trim().toLowerCase());

  if (mentions.length > 0) {
    const { data: members } = await admin
      .from("group_members")
      .select("user_id, users(full_name, email)")
      .eq("group_id", group_id);

    if (members) {
      const notifications = members
        .filter((m) => {
          const u = m.users as { full_name: string | null; email: string } | null;
          if (!u || m.user_id === user.id) return false;
          const name = (u.full_name ?? u.email).toLowerCase();
          return mentions.some((mention) => name.includes(mention));
        })
        .map((m) => ({
          user_id: m.user_id,
          group_id,
          type: "mention" as const,
          message: `You were mentioned in a message`,
          link: `/groups/${group_id}`,
        }));

      if (notifications.length > 0) {
        await admin.from("notifications").insert(notifications);
      }
    }
  }

  return NextResponse.json({ message }, { status: 201 });
}
