import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmail, r400 } from "@/lib/api";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!isEmail(email)) {
    return r400("Invalid email address");
  }

  const admin = createAdminClient();

  // Query the public users table which mirrors auth.users via trigger
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  return NextResponse.json({ exists: !!data });
}
