"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const inputClass = "w-full rounded-lg bg-[#0D1424] border border-[#1E2A3A] px-4 py-2.5 text-gray-50 placeholder-gray-600 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all autofill:bg-[#0D1424]";

  return (
    <div className="w-full max-w-sm">
      <div className="bg-gray-900 border border-[#1E2A3A] rounded-xl p-8">
        <div className="mb-7 text-center">
          <Link href="/" className="inline-block mb-5">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto shadow-[0_0_18px_rgba(59,130,246,0.35)]">
              <span className="text-white text-[11px] font-extrabold tracking-tight">GW</span>
            </div>
          </Link>
          <h1 className="text-xl font-bold text-gray-50 tracking-tight">Sign in to GroupWork</h1>
          <p className="mt-1.5 text-gray-500 text-sm">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@university.edu"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-400">
                Password
              </label>
              <span className="text-xs text-gray-600 hover:text-blue-400 cursor-pointer transition-colors">
                Forgot password?
              </span>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {error}
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

        <p className="mt-5 text-center text-sm text-gray-500">
          No account?{" "}
          <Link href="/signup" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
