"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ── Domain typo suggester ──────────────────────────────────────────────────
const KNOWN_DOMAINS = [
  "gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com",
  "me.com","live.com","protonmail.com","proton.me","googlemail.com",
  "msn.com","hotmail.co.uk","yahoo.co.uk",
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function suggestDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const typed = email.slice(at + 1).toLowerCase();
  if (!typed || KNOWN_DOMAINS.includes(typed)) return null;
  let best: string | null = null, bestDist = Infinity;
  for (const d of KNOWN_DOMAINS) {
    const dist = levenshtein(typed, d);
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  // Only suggest if within 2 edits and meaningfully different
  return bestDist <= 2 && bestDist > 0 ? `${email.slice(0, at + 1)}${best}` : null;
}

function hasUpper(s: string)  { return /[A-Z]/.test(s); }
function hasLower(s: string)  { return /[a-z]/.test(s); }
function hasNumber(s: string) { return /[0-9]/.test(s); }
function hasSpecial(s: string){ return /[^A-Za-z0-9]/.test(s); }

function strength(p: string): { label: "Weak" | "Fair" | "Strong"; pct: number } {
  if (!p.length) return { label: "Weak", pct: 0 };
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (hasUpper(p) && hasLower(p)) score++;
  if (hasNumber(p))   score++;
  if (hasSpecial(p))  score++;
  if (score <= 2) return { label: "Weak",   pct: 33  };
  if (score <= 3) return { label: "Fair",   pct: 66  };
  return              { label: "Strong", pct: 100 };
}

const STRENGTH_COLOR = { Weak: "#EF4444", Fair: "#F59E0B", Strong: "#10B981" } as const;

// ── Icons ─────────────────────────────────────────────────────────────────
function ErrIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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

// ── Input styling helper ──────────────────────────────────────────────────
function fieldProps(hasError: boolean) {
  return {
    className: [
      "w-full rounded-lg border px-4 py-2.5 text-sm",
      "focus:outline-none focus:ring-2 transition-all duration-150",
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
        : "focus:border-blue-500 focus:ring-blue-500/15",
    ].join(" "),
    style: {
      background: "var(--ct-in)",
      color: "var(--ct-t1)",
      borderColor: hasError ? undefined : "var(--ct-bd)",
    } as React.CSSProperties,
  };
}

// ─────────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();

  const [fullName,        setFullName]        = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw,          setShowPw]          = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [touched,         setTouched]         = useState<Record<string, boolean>>({});
  const [loading,         setLoading]         = useState(false);
  const [serverError,     setServerError]     = useState<string | null>(null);
  const [emailTaken,      setEmailTaken]      = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  // ── Validation ──
  const nameError = (() => {
    if (!touched.fullName) return null;
    const n = fullName.trim();
    if (!n) return "Name is required.";
    if (n.length < 2)  return "Name must be at least 2 characters.";
    if (n.length > 20) return "Name must be 20 characters or less.";
    return null;
  })();

  const emailError = (() => {
    if (!touched.email) return null;
    if (!email) return "Email is required.";
    if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
    return null;
  })();

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
    !nameError && !emailError && !passwordError && !confirmError &&
    fullName.trim().length >= 2 && EMAIL_RE.test(email) &&
    password.length >= 8 &&
    hasUpper(password) && hasLower(password) && hasNumber(password) &&
    confirmPassword === password;

  function touch(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    if (!isValid) return;

    setServerError(null);
    setEmailTaken(false);
    setEmailSuggestion(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if ((await res.json()).exists) {
        setEmailTaken(true);
        touch("email");
        setLoading(false);
        return;
      }
    } catch { /* let Supabase handle network errors */ }

    const { error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });

    if (error) { setServerError(error.message); setLoading(false); return; }

    router.push("/dashboard");
  }

  const pw = strength(password);

  return (
    <div className="w-full max-w-[480px]">
      {/* ── Card ── */}
      <div
        className="rounded-2xl p-8 border"
        style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}
      >
        {/* Header */}
        <div className="mb-7 text-center">
          <Link href="/" className="inline-block mb-5" aria-label="Back to home">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto shadow-[0_0_18px_rgba(59,130,246,0.35)]">
              <span className="text-white text-[11px] font-extrabold tracking-tight">GW</span>
            </div>
          </Link>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--ct-t1)" }}>Create your account</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--ct-t3)" }}>Free forever for students</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Full name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--ct-t2)" }}>Full name</label>
              {fullName.length > 15 && (
                <span className="text-xs tabular-nums" style={{ color: fullName.length > 20 ? "#EF4444" : "var(--ct-t3)" }}>
                  {fullName.length}/20
                </span>
              )}
            </div>
            <input
              type="text"
              autoComplete="name"
              maxLength={20}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => touch("fullName")}
              placeholder="Jane Smith"
              {...fieldProps(!!nameError)}
            />
            {nameError && <FieldErr msg={nameError} />}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ct-t2)" }}>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                const val = e.target.value.toLowerCase();
                setEmail(val);
                setEmailTaken(false);
                setEmailSuggestion(null);
              }}
              onBlur={() => {
                const trimmed = email.trim();
                if (trimmed !== email) setEmail(trimmed);
                touch("email");
                setEmailSuggestion(suggestDomain(trimmed || email));
              }}
              placeholder="you@university.edu"
              {...fieldProps(!!(emailError || emailTaken))}
            />
            {emailTaken ? (
              <p className="mt-1.5 text-xs text-red-400 flex items-start gap-1">
                <svg className="w-3 h-3 flex-shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>
                  An account with this email already exists.{" "}
                  <Link href="/login" className="underline underline-offset-2 font-medium hover:text-red-300 transition-colors">
                    Sign in instead
                  </Link>
                </span>
              </p>
            ) : emailError ? (
              <FieldErr msg={emailError} />
            ) : emailSuggestion ? (
              <p className="mt-1.5 text-xs text-amber-500 flex items-start gap-1">
                <svg className="w-3 h-3 flex-shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>
                  Did you mean{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2 font-medium cursor-pointer hover:text-amber-400 transition-colors"
                    onClick={() => { setEmail(emailSuggestion); setEmailSuggestion(null); }}
                  >
                    {emailSuggestion}
                  </button>
                  ?
                </span>
              </p>
            ) : null}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ct-t2)" }}>Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch("password")}
                placeholder="Min 8 characters"
                className={[
                  "w-full rounded-lg border px-4 py-2.5 pr-10 text-sm",
                  "focus:outline-none focus:ring-2 transition-all duration-150",
                  passwordError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
                    : "focus:border-blue-500 focus:ring-blue-500/15",
                ].join(" ")}
                style={{
                  background: "var(--ct-in)",
                  color: "var(--ct-t1)",
                  borderColor: passwordError ? undefined : "var(--ct-bd)",
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                style={{ color: "var(--ct-t3)" }}
                tabIndex={-1}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPw} />
              </button>
            </div>

            {/* Strength bar — only when typing */}
            {password.length > 0 && (
              <div className="mt-2.5">
                <div className="flex gap-1 mb-1.5">
                  {(["Weak", "Fair", "Strong"] as const).map((level, i) => {
                    const filled = i < (pw.label === "Weak" ? 1 : pw.label === "Fair" ? 2 : 3);
                    return (
                      <div
                        key={level}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: filled ? STRENGTH_COLOR[pw.label] : "var(--ct-bd)" }}
                      />
                    );
                  })}
                </div>
                <p className="text-xs" style={{ color: "var(--ct-t3)" }}>
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
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ct-t2)" }}>Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => touch("confirmPassword")}
                placeholder="Re-enter your password"
                className={[
                  "w-full rounded-lg border px-4 py-2.5 pr-10 text-sm",
                  "focus:outline-none focus:ring-2 transition-all duration-150",
                  confirmError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
                    : touched.confirmPassword && confirmPassword && !confirmError
                    ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/15"
                    : "focus:border-blue-500 focus:ring-blue-500/15",
                ].join(" ")}
                style={{
                  background: "var(--ct-in)",
                  color: "var(--ct-t1)",
                  borderColor: (confirmError || (touched.confirmPassword && confirmPassword && !confirmError)) ? undefined : "var(--ct-bd)",
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                style={{ color: "var(--ct-t3)" }}
                tabIndex={-1}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {confirmError ? (
              <FieldErr msg={confirmError} />
            ) : touched.confirmPassword && confirmPassword && !confirmError ? (
              <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Passwords match
              </p>
            ) : null}
          </div>

          {/* Server error */}
          {serverError && (
            <div
              className="flex items-start gap-3 rounded-lg px-4 py-3"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              <span className="text-red-400"><ErrIcon /></span>
              <p className="text-sm" style={{ color: "#FCA5A5" }}>{serverError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-[0.98] px-4 py-3.5 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-all duration-150 flex items-center justify-center gap-2"
            style={{ boxShadow: loading ? "none" : "0 0 20px rgba(59,130,246,0.25)" }}
          >
            {loading ? (
              <>
                <Spinner />
                Creating account…
              </>
            ) : "Create free account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: "var(--ct-t3)" }}>
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
