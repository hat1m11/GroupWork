"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
    return null;
  })();

  const isValid = EMAIL_RE.test(email) && password.length >= 8 && password.length <= 20;

  function touch(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function fieldClass(error: string | null, isTouched: boolean) {
    const base = "w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all";
    const style = { background: "var(--ct-in)", color: "var(--ct-t1)" } as React.CSSProperties;
    if (!isTouched || !error) {
      return { className: `${base} focus:border-blue-500 focus:ring-blue-500/15`, style: { ...style, borderColor: "var(--ct-bd)" } };
    }
    return { className: `${base} border-red-500 focus:border-red-500 focus:ring-red-500/15`, style };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;

    setServerError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setServerError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl p-8 border" style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}>
        <div className="mb-7 text-center">
          <Link href="/" className="inline-block mb-5">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto shadow-[0_0_18px_rgba(59,130,246,0.35)]">
              <span className="text-white text-[11px] font-extrabold tracking-tight">GW</span>
            </div>
          </Link>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--ct-t1)" }}>Sign in to GroupWork</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--ct-t3)" }}>Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

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
              <span className="text-xs cursor-pointer transition-colors hover:text-blue-400" style={{ color: "var(--ct-t3)" }}>
                Forgot password?
              </span>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => touch("password")}
              placeholder="••••••••"
              {...fieldClass(passwordError, !!touched.password)}
            />
            {passwordError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {passwordError}
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: "var(--ct-t3)" }}>
          No account?{" "}
          <Link href="/signup" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
