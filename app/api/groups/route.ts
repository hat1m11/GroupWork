import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser, sanitize, r400, r401, r500 } from "@/lib/api";

const MAX_NAME = 100;
const MAX_CODE = 20;
const MAX_SECTION_TITLE = 100;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return r401();

  const body = await request.json().catch(() => null);
  if (!body) return r400("Invalid request body");

  const name = sanitize(body.name, MAX_NAME);
  const courseCode = sanitize(body.course_code, MAX_CODE);
  const assignmentName = sanitize(body.assignment_name, MAX_NAME);

  if (!name) return r400("Group name is required (max 100 characters)");
  if (!courseCode) return r400("Course code is required (max 20 characters)");
  if (!assignmentName) return r400("Assignment name is required (max 100 characters)");

  const dueDate = typeof body.due_date === "string" ? body.due_date : null;
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return r400("Invalid due_date format — use YYYY-MM-DD");
  }

  if (!Array.isArray(body.rubric_sections) || body.rubric_sections.length === 0) {
    return r400("At least one rubric section is required");
  }
  if (body.rubric_sections.length > 20) {
    return r400("Maximum 20 rubric sections allowed");
  }

  const sections = body.rubric_sections.map((s: unknown) => {
    if (typeof s !== "object" || s === null) return null;
    const obj = s as Record<string, unknown>;
    const title = sanitize(obj.title, MAX_SECTION_TITLE);
    const weight = typeof obj.weight_pct === "number" ? obj.weight_pct : NaN;
    const order = typeof obj.sort_order === "number" ? obj.sort_order : 0;
    return title && !isNaN(weight) && weight > 0 && weight <= 100
      ? { title, weight_pct: weight, sort_order: order }
      : null;
  });

  if (sections.some((s: null | object) => s === null)) {
    return r400("Each rubric section needs a title and a valid weight (1–100)");
  }

  const totalWeight = sections.reduce((sum: number, s: { weight_pct: number } | null) => sum + (s?.weight_pct ?? 0), 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    return r400(`Rubric weights must sum to 100 (got ${totalWeight.toFixed(1)})`);
  }

  const admin = createAdminClient();

  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({ name, course_code: courseCode, assignment_name: assignmentName, due_date: dueDate, created_by: user.id })
    .select()
    .single();

  if (groupError || !group) return r500();

  const { error: memberError } = await admin
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "owner" });

  if (memberError) return r500();

  const { error: rubricError } = await admin
    .from("rubric_sections")
    .insert(sections.map((s: { title: string; weight_pct: number; sort_order: number } | null) => ({
      group_id: group.id,
      title: s!.title,
      weight_pct: s!.weight_pct,
      sort_order: s!.sort_order,
    })));

  if (rubricError) return r500();

  await admin.from("contribution_logs").insert({
    group_id: group.id,
    user_id: user.id,
    action_type: "group_created",
    description: `Created group "${name}"`,
  });

  return NextResponse.json({ groupId: group.id }, { status: 201 });
}
