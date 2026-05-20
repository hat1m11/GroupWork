import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_MEMBERS = 20;
const MAX_MEMBERSHIPS = 20;

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invite_code } = await request.json();
  if (!invite_code) return NextResponse.json({ error: "Invite code required" }, { status: 400 });

  const { data: group, error: groupError } = await admin
    .from("groups")
    .select("id, name")
    .eq("invite_code", invite_code)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Already a member — just return success
  const { data: existing } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ groupId: group.id });

  // Check group is not full
  const { count: memberCount } = await admin
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  if ((memberCount ?? 0) >= MAX_MEMBERS) {
    return NextResponse.json(
      { error: `This group is full (max ${MAX_MEMBERS} members)` },
      { status: 400 }
    );
  }

  // Check user hasn't joined too many groups
  const { count: membershipCount } = await admin
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((membershipCount ?? 0) >= MAX_MEMBERSHIPS) {
    return NextResponse.json(
      { error: `You can be in a maximum of ${MAX_MEMBERSHIPS} groups` },
      { status: 400 }
    );
  }

  const { error: memberError } = await admin.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "member",
  });

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

  await admin.from("contribution_logs").insert({
    group_id: group.id,
    user_id: user.id,
    action_type: "member_joined",
    description: `Joined group "${group.name}"`,
  });

  return NextResponse.json({ groupId: group.id });
}
