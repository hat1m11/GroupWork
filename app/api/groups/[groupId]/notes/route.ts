import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser, getMembership, isUUID, r400, r401, r403 } from "@/lib/api";

const MAX_NOTES_LENGTH = 50_000;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  if (!isUUID(groupId)) return r400("Invalid group ID");

  const user = await getUser();
  if (!user) return r401();

  const membership = await getMembership(groupId, user.id);
  if (!membership) return r403();

  const admin = createAdminClient();
  const { data: notes } = await admin
    .from("group_notes")
    .select("*")
    .eq("group_id", groupId)
    .maybeSingle();

  return NextResponse.json({ content: notes?.content ?? "" });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  if (!isUUID(groupId)) return r400("Invalid group ID");

  const user = await getUser();
  if (!user) return r401();

  const membership = await getMembership(groupId, user.id);
  if (!membership) return r403();

  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === "string"
    ? body.content.slice(0, MAX_NOTES_LENGTH)
    : "";

  const admin = createAdminClient();
  await admin.from("group_notes").upsert(
    { group_id: groupId, content, updated_by: user.id, updated_at: new Date().toISOString() },
    { onConflict: "group_id" }
  );

  return NextResponse.json({ ok: true });
}
