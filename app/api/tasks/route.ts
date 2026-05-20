import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser, getMembership, sanitize, isUUID, r400, r401, r403, r500 } from "@/lib/api";

const VALID_STATUS = new Set(["todo", "in_progress", "done", "blocked"]);
const VALID_PRIORITY = new Set(["low", "medium", "high", "urgent"]);
const VALID_TAGS = new Set(["research", "writing", "review", "design", "code"]);

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return r401();

  const body = await request.json().catch(() => null);
  if (!body) return r400("Invalid request body");

  const groupId = body.group_id;
  const rubricSectionId = body.rubric_section_id ?? null;
  const title = sanitize(body.title, 200);
  const description = sanitize(body.description, 2000);
  const assignedTo = body.assigned_to ?? null;
  const dueDate = body.due_date ?? null;
  const priority = body.priority ?? "medium";
  const tags = Array.isArray(body.tags) ? body.tags : [];

  if (!isUUID(groupId)) return r400("Invalid group_id");
  if (!title) return r400("Task title is required (max 200 characters)");
  if (rubricSectionId !== null && !isUUID(rubricSectionId)) return r400("Invalid rubric_section_id");
  if (assignedTo !== null && !isUUID(assignedTo)) return r400("Invalid assigned_to");
  if (!VALID_PRIORITY.has(priority)) return r400("Invalid priority value");
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return r400("Invalid due_date format");

  const validatedTags = tags.filter((t: unknown) => typeof t === "string" && VALID_TAGS.has(t)).slice(0, 5);

  const membership = await getMembership(groupId, user.id);
  if (!membership) return r403("You are not a member of this group");

  const admin = createAdminClient();

  const { data: task, error } = await admin
    .from("tasks")
    .insert({
      group_id: groupId,
      rubric_section_id: rubricSectionId,
      title,
      description,
      assigned_to: assignedTo,
      due_date: dueDate,
      created_by: user.id,
      status: "todo",
      priority: priority as "low" | "medium" | "high" | "urgent",
      tags: validatedTags,
    })
    .select()
    .single();

  if (error || !task) return r500();

  await admin.from("contribution_logs").insert({
    group_id: groupId,
    user_id: user.id,
    action_type: "task_created",
    description: `Created task "${title}"`,
    task_id: task.id,
  });

  return NextResponse.json({ task }, { status: 201 });
}
