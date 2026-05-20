/**
 * Shared API security helpers.
 * Import from here in every route handler.
 */
import { NextResponse } from "next/server";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

// ── Format validators ──────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isUUID(s: unknown): s is string {
  return typeof s === "string" && UUID_RE.test(s);
}

export function isEmail(s: unknown): s is string {
  return typeof s === "string" && EMAIL_RE.test(s.trim());
}

/** Trim + cap a string. Returns null if empty after trim. */
export function sanitize(s: unknown, maxLen: number): string | null {
  if (typeof s !== "string") return null;
  const v = s.trim().slice(0, maxLen);
  return v.length > 0 ? v : null;
}

/** Only accept the exact emoji our UI exposes — prevents arbitrary unicode abuse */
const ALLOWED_EMOJI = new Set(["👍", "❤️", "😂", "🔥", "✅", "😮"]);
export function isAllowedEmoji(e: unknown): e is string {
  return typeof e === "string" && ALLOWED_EMOJI.has(e);
}

// ── Standard error responses ───────────────────────────────────────────────

export const r400 = (msg: string) =>
  NextResponse.json({ error: msg }, { status: 400 });

export const r401 = () =>
  NextResponse.json({ error: "Authentication required" }, { status: 401 });

export const r403 = (msg = "Access denied") =>
  NextResponse.json({ error: msg }, { status: 403 });

export const r404 = (what = "Resource") =>
  NextResponse.json({ error: `${what} not found` }, { status: 404 });

export const r500 = () =>
  NextResponse.json({ error: "Internal server error" }, { status: 500 });

// ── Auth helpers ───────────────────────────────────────────────────────────

/** Returns the authenticated user or null. */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Returns the membership row (id + role) or null if not a member. */
export async function getMembership(groupId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("group_members")
    .select("id, role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}
