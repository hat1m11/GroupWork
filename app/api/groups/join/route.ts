import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invite_code } = await request.json();

  if (!invite_code) {
    return NextResponse.json({ error: "Invite code required" }, { status: 400 });
  }

  const { data: group, error: groupError } = await admin
    .from("groups")
    .select("id, name")
    .eq("invite_code", invite_code)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Check if already a member
  const { data: existing } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ groupId: group.id });
  }

  const { error: memberError } = await admin.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "member",
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  await admin.from("contribution_logs").insert({
    group_id: group.id,
    user_id: user.id,
    action_type: "member_joined",
    description: `Joined group "${group.name}"`,
  });

  return NextResponse.json({ groupId: group.id });
}
