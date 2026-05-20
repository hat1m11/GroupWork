"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinGroupButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join group");
      setOpen(false); setCode("");
      router.push(`/groups/${data.groupId}`); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); setLoading(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-[var(--ct-hi)] active:scale-[0.98] transition-all duration-150"
        style={{ borderColor: "var(--ct-bd)", color: "var(--ct-t2)" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Join with code
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,15,30,0.88)", backdropFilter: "blur(12px)" }}>
      <div className="rounded-xl w-full max-w-sm p-6 border" style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--ct-t1)" }}>Join a Group</h2>
          <button onClick={() => { setOpen(false); setCode(""); setError(null); }} className="text-2xl leading-none transition-colors" style={{ color: "var(--ct-t3)" }}>×</button>
        </div>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>Invite code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. A1B2C3D4"
              className="w-full rounded-lg border px-4 py-2.5 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
              style={{ background: "var(--ct-in)", borderColor: "var(--ct-bd)", color: "var(--ct-t1)" }}
              maxLength={8} />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}
          <button type="submit" disabled={loading || code.trim().length === 0}
            className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-[0.98] px-4 py-2.5 text-white font-semibold disabled:opacity-60 transition-all duration-150">
            {loading ? "Joining…" : "Join Group"}
          </button>
        </form>
      </div>
    </div>
  );
}
