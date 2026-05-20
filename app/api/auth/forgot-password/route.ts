import { NextRequest } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmail, sanitize, r400, r500 } from "@/lib/api";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return r400("Invalid request body"); }

  const email = sanitize((body as { email?: unknown }).email, 254);
  if (!email || !isEmail(email)) return r400("Valid email required");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const admin = createAdminClient();

  // Generate a recovery link server-side — no email sent by Supabase
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    },
  });

  if (error || !data?.properties?.action_link) {
    // Return success regardless — don't reveal whether the account exists
    return Response.json({ ok: true });
  }

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "GroupWork <onboarding@resend.dev>",
    to: email,
    subject: "Reset your GroupWork password",
    html: resetEmailHtml(data.properties.action_link),
  });

  if (sendError) {
    console.error("[forgot-password] Resend error:", sendError);
    return r500();
  }

  return Response.json({ ok: true });
}

function resetEmailHtml(actionLink: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 16px;background:#0A0F1E;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
    <tr><td style="background:#111827;border:1px solid #2D3F55;border-radius:16px;padding:40px 32px;">

      <!-- Logo -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="display:inline-block;width:40px;height:40px;background:#2563EB;border-radius:12px;line-height:40px;text-align:center;">
            <span style="color:#fff;font-size:11px;font-weight:800;letter-spacing:-0.5px;">GW</span>
          </div>
        </td></tr>

        <!-- Heading -->
        <tr><td align="center" style="padding-bottom:8px;">
          <h1 style="margin:0;color:#F9FAFB;font-size:20px;font-weight:700;">Reset your password</h1>
        </td></tr>

        <!-- Body -->
        <tr><td align="center" style="padding-bottom:32px;">
          <p style="margin:8px 0 0;color:#6B7280;font-size:14px;line-height:1.6;">
            Click the button below to choose a new password.<br>This link expires in <strong style="color:#9CA3AF;">1 hour</strong>.
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="padding-bottom:32px;">
          <a href="${actionLink}"
            style="display:inline-block;background:#2563EB;color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
            Reset password
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center">
          <p style="margin:0;color:#4B5563;font-size:12px;">
            If you didn&rsquo;t request this, you can safely ignore this email.
          </p>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}
