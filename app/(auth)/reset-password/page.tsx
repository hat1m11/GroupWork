"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function hasUpper(s: string) { return /[A-Z]/.test(s); }
function hasLower(s: string) { return /[a-z]/.test(s); }
function hasNumber(s: string) { return /[0-9]/.test(s); }
function hasSpecial(s: string) { return /[^A-Za-z0-9]/.test(s); }

function strength(p: string): { label: "Weak" | "Fair" | "Strong" } {
  if (!p.length) return { label: "Weak" };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (hasUpper(p) && hasLower(p)) score++;
  if (hasNumber(p)) score++;
  if (hasSpecial(p)) score++;
  if (score <= 2) return { label: "Weak" };
  if (score <= 3) return { label: "Fair" };
  return { label: "Strong" };
}

const STRENGTH_COLOR = { Weak: "#EF4444", Fair: "#F59E0B", Strong: "#10B981" } as const;

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function FieldErr({ msg }: { msg: string }) {
  return (
    <p className="mt-1.5 text-xs text-red-400 flex items-start gap-1">
      <svg className="w-3 h-3 flex-shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  );
}

function GWLogo() {
  return (
    <div className="flex justify-center mb-6">
      <Link href="/" aria-label="Back to home">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_18px_rgba(59,130,246,0.35)]">
          <span className="text-white text-[11px] font-extrabold tracking-tight">GW</span>
        </div>
      </Link>
    </div>
  );
}

const pwInputClass = (hasError: boolean, isMatch: boolean) =>
  [
    "w-full rounded-lg border px-4 py-2.5 pr-10 text-sm",
    "focus:outline-none focus:ring-1 transition-all",
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : isMatch
      ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20"
      : "focus:border-blue-500 focus:ring-blue-500/20",
  ].join(" ");

const pwInputStyle = (hasError: boolean, isMatch: boolean): React.CSSProperties => ({
  background: "#0D1424",
  color: "var(--ct-t1)",
  borderColor: hasError || isMatch ? undefined : "#1E2A3A",
});

export default function ResetPasswordPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        if (session) {
          // Session was set server-side by /auth/callback — show form
          setReady(true);
        } else {
          // No session and no code → user landed here directly, send them back
          const code = new URLSearchParams(window.location.search).get("code");
          if (!code) router.replace("/forgot-password");
        }
      }
      // Fallback for any client-side PKCE or implicit flow
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // If there's a ?code= (direct link without callback), exchange it client-side
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).catch(() => {
        router.replace("/forgot-password?error=expired");
      });
    }

    return () => subscription.unsubscribe();
  }, [router]);

  const passwordError = (() => {
    if (!touched.password) return null;
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!hasUpper(password)) return "Include at least one uppercase letter.";
    if (!hasLower(password)) return "Include at least one lowercase letter.";
    if (!hasNumber(password)) return "Include at least one number.";
    return null;
  })();

  const confirmError = (() => {
    if (!touched.confirmPassword) return null;
    if (!confirmPassword) return "Please confirm your password.";
    if (confirmPassword !== password) return "Passwords do not match.";
    return null;
  })();

  const isValid =
    password.length >= 8 &&
    hasUpper(password) && hasLower(password) && hasNumber(password) &&
    confirmPassword === password;

  function touch(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    if (!isValid) return;

    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: sbError } = await supabase.auth.updateUser({ password });

    if (sbError) {
      setError(sbError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  const pw = strength(password);
  const confirmMatch = touched.confirmPassword && !!confirmPassword && !confirmError;

  if (!ready && !success) {
    return (
      <div className="w-full max-w-sm">
        <div
          className="rounded-2xl p-8 border text-center"
          style={{ background: "#111827", borderColor: "#2D3F55" }}
        >
          <GWLogo />
          <svg className="animate-spin w-8 h-8 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Verifying your reset link…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div
        className="rounded-2xl p-8 border"
        style={{ background: "#111827", borderColor: "#2D3F55" }}
      >
        <GWLogo />

        {success ? (
          /* ── Success state ── */
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-50 mb-2">
              Password updated successfully
            </h1>
            <p className="text-sm text-gray-500">
              Redirecting you to your dashboard…
            </p>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold tracking-tight text-gray-50">
                Choose a new password
              </h1>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => touch("password")}
                    placeholder="Min 8 characters"
                    className={pwInputClass(!!passwordError, false)}
                    style={pwInputStyle(!!passwordError, false)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--ct-t3)" }}
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2.5">
                    <div className="w-full h-1 rounded-full" style={{ background: "#1E2A3A" }}>
                      <div
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: pw.label === "Weak" ? "33%" : pw.label === "Fair" ? "66%" : "100%",
                          background: STRENGTH_COLOR[pw.label],
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: "var(--ct-t3)" }}>
                      Password strength:{" "}
                      <span style={{ color: STRENGTH_COLOR[pw.label] }} className="font-medium">
                        {pw.label}
                      </span>
                    </p>
                  </div>
                )}

                {passwordError && <FieldErr msg={passwordError} />}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => touch("confirmPassword")}
                    placeholder="Re-enter your password"
                    className={pwInputClass(!!confirmError, confirmMatch)}
                    style={pwInputStyle(!!confirmError, confirmMatch)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--ct-t3)" }}
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>

                {confirmError ? (
                  <FieldErr msg={confirmError} />
                ) : confirmMatch ? (
                  <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Passwords match
                  </p>
                ) : null}
              </div>

              {/* Error banner */}
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
                    Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
