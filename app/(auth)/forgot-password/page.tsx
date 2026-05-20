"use client";

// REMINDER: Add http://localhost:3000/auth/callback and your production URL
// (https://your-app.vercel.app/auth/callback) to
// Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LINK_ERRORS: Record<string, string> = {
  expired: "That reset link has expired. Enter your email to get a new one.",
  invalid: "That reset link is invalid. Enter your email to get a new one.",
};

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

// Separated into its own component so useSearchParams is inside a Suspense boundary
function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(
    reason ? (LINK_ERRORS[reason] ?? null) : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: sbError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (sbError) {
      setError(sbError.message);
      return;
    }

    // Always show success — don't reveal whether the account exists
    setSubmitted(true);
  }

  return (
    <>
      {submitted ? (
        /* ── Success state ── */
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4 text-emerald-400">
            <MailIcon />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-50 mb-2">
            Check your email
          </h1>
          <p className="text-sm text-gray-500">
            We sent a reset link to{" "}
            <span className="font-medium text-gray-300">{email}</span>. It may
            take a minute — check your spam folder too.
          </p>
        </div>
      ) : (
        /* ── Form state ── */
        <>
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-50">
              Reset your password
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error && EMAIL_RE.test(e.target.value)) setError(null);
                }}
                placeholder="you@university.edu"
                className={[
                  "w-full rounded-lg border px-4 py-2.5 text-sm",
                  "focus:outline-none focus:ring-1 transition-all",
                  error
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "focus:border-blue-500 focus:ring-blue-500/20",
                ].join(" ")}
                style={{
                  background: "#0D1424",
                  color: "var(--ct-t1)",
                  borderColor: error ? undefined : "#1E2A3A",
                } as React.CSSProperties}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg px-4 py-3 bg-red-500/10 border border-red-500/20">
                <svg
                  className="w-4 h-4 flex-shrink-0 mt-px text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-white text-sm font-semibold disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner />
                  Sending…
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        </>
      )}
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <div
        className="rounded-2xl p-8 border"
        style={{ background: "#111827", borderColor: "#2D3F55" }}
      >
        {/* GW Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" aria-label="Back to home">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_18px_rgba(59,130,246,0.35)]">
              <span className="text-white text-[11px] font-extrabold tracking-tight">GW</span>
            </div>
          </Link>
        </div>

        <Suspense>
          <ForgotPasswordForm />
        </Suspense>

        {/* Back to sign in — always visible */}
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
