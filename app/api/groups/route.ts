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

  const body = await request.json();
  const { name, course_code, assignment_name, due_date, rubric_sections } = body;

  if (!name || !course_code || !assignment_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!Array.isArray(rubric_sections) || rubric_sections.length === 0) {
    return NextResponse.json({ error: "At least one rubric section required" }, { status: 400 });
  }

  const totalWeight = rubric_sections.reduce(
    (sum: number, s: { weight_pct: number }) => sum + s.weight_pct,
    0
  );
  if (Math.abs(totalWeight - 100) > 0.01) {
    return NextResponse.json(
      { error: `Rubric weights must sum to 100 (got ${totalWeight})` },
      { status: 400 }
    );
  }

  // Create the group
  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({ name, course_code, assignment_name, due_date, created_by: user.id })
    .select()
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: groupError?.message ?? "Failed to create group" }, { status: 500 });
  }

  // Add creator as owner
  const { error: memberError } = await admin.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Insert rubric sections
  const { error: rubricError } = await admin.from("rubric_sections").insert(
    rubric_sections.map((s: { title: string; weight_pct: number; sort_order: number }) => ({
      group_id: group.id,
      title: s.title,
      weight_pct: s.weight_pct,
      sort_order: s.sort_order,
    }))
  );

  if (rubricError) {
    return NextResponse.json({ error: rubricError.message }, { status: 500 });
  }

  // Log contribution
  await admin.from("contribution_logs").insert({
    group_id: group.id,
    user_id: user.id,
    action_type: "group_created",
    description: `Created group "${name}"`,
  });

  return NextResponse.json({ groupId: group.id }, { status: 201 });
}
