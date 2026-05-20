"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function hasUpper(s: string) { return /[A-Z]/.test(s); }
function hasLower(s: string) { return /[a-z]/.test(s); }
function hasNumber(s: string) { return /[0-9]/.test(s); }
function hasSpecial(s: string) { return /[^A-Za-z0-9]/.test(s); }

function passwordStrength(p: string): { label: string; color: string; width: string } {
  if (p.length === 0) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (hasUpper(p) && hasLower(p)) score++;
  if (hasNumber(p)) score++;
  if (hasSpecial(p)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score <= 3) return { label: "Fair", color: "bg-amber-500", width: "66%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // ── Validation ──
  const nameError = (() => {
    if (!touched.fullName) return null;
    if (!fullName.trim()) return "Name is required.";
    if (fullName.trim().length < 2) return "Name must be at least 2 characters.";
    if (fullName.trim().length > 20) return "Name must be 20 characters or less.";
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
    if (password.length > 20) return "Password must be 20 characters or less.";
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

  const isValid = !nameError && !emailError && !passwordError && !confirmError
    && fullName.trim().length >= 2 && EMAIL_RE.test(email)
    && password.length >= 8 && password.length <= 20
    && hasUpper(password) && hasLower(password) && hasNumber(password)
    && confirmPassword === password;

  function touch(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    if (!isValid) return;

    setServerError(null);
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (error) {
      setServerError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  function fieldClass(error: string | null, touched: boolean) {
    const base = "w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all";
    const style = { background: "var(--ct-in)", color: "var(--ct-t1)" } as React.CSSProperties;
    if (!touched || !error) {
      return { className: `${base} focus:border-blue-500 focus:ring-blue-500/15`, style: { ...style, borderColor: "var(--ct-bd)" } };
    }
    return { className: `${base} border-red-500 focus:border-red-500 focus:ring-red-500/15`, style };
  }

  const strength = passwordStrength(password);

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl p-8 border" style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}>
        <div className="mb-7 text-center">
          <Link href="/" className="inline-block mb-5">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto shadow-[0_0_18px_rgba(59,130,246,0.35)]">
              <span className="text-white text-[11px] font-extrabold tracking-tight">GW</span>
            </div>
          </Link>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--ct-t1)" }}>Create your account</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--ct-t3)" }}>Free forever for students</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Full name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium" style={{ color: "var(--ct-t2)" }}>Full name</label>
              <span className="text-xs" style={{ color: fullName.length > 20 ? "#EF4444" : "var(--ct-t3)" }}>
                {fullName.length}/20
              </span>
            </div>
            <input
              type="text"
              autoComplete="name"
              maxLength={21}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => touch("fullName")}
              placeholder="Jane Smith"
              {...fieldClass(nameError, !!touched.fullName)}
            />
            {nameError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {nameError}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ct-t2)" }}>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => touch("email")}
              placeholder="you@university.edu"
              {...fieldClass(emailError, !!touched.email)}
            />
            {emailError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium" style={{ color: "var(--ct-t2)" }}>Password</label>
              <span className="text-xs" style={{ color: password.length > 20 ? "#EF4444" : "var(--ct-t3)" }}>
                {password.length}/20
              </span>
            </div>
            <input
              type="password"
              autoComplete="new-password"
              maxLength={21}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => touch("password")}
              placeholder="Min 8 chars, upper, lower, number"
              {...fieldClass(passwordError, !!touched.password)}
            />
            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ct-bd)" }}>
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--ct-t3)" }}>
                  Strength: <span className={
                    strength.label === "Strong" ? "text-emerald-400" :
                    strength.label === "Fair" ? "text-amber-400" : "text-red-400"
                  }>{strength.label}</span>
                </p>
              </div>
            )}
            {passwordError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {passwordError}
              </p>
            )}
            {/* Requirements checklist */}
            {touched.password && password.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {[
                  { ok: password.length >= 8 && password.length <= 20, text: "8–20 characters" },
                  { ok: hasUpper(password), text: "One uppercase letter" },
                  { ok: hasLower(password), text: "One lowercase letter" },
                  { ok: hasNumber(password), text: "One number" },
                ].map((r) => (
                  <li key={r.text} className={`text-xs flex items-center gap-1.5 ${r.ok ? "text-emerald-400" : "text-red-400"}`}>
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {r.ok
                        ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        : <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      }
                    </svg>
                    {r.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ct-t2)" }}>Confirm password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => touch("confirmPassword")}
              placeholder="Re-enter your password"
              {...fieldClass(confirmError, !!touched.confirmPassword)}
            />
            {confirmError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {confirmError}
              </p>
            )}
            {touched.confirmPassword && !confirmError && confirmPassword && (
              <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Passwords match
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-[0.98] px-4 py-2.5 text-white text-sm font-semibold disabled:opacity-60 transition-all duration-150 mt-1"
          >
            {loading ? "Creating account…" : "Create free account"}
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
