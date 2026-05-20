"use client";

import { useState } from "react";

export default function InviteCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:border-indigo-300 transition-colors group"
      title="Copy invite code"
    >
      <div className="text-left">
        <p className="text-xs text-gray-400 font-medium">Invite code</p>
        <p className="text-lg font-mono font-bold text-gray-900 tracking-widest">
          {code}
        </p>
      </div>
      <span className="text-gray-400 group-hover:text-indigo-500 transition-colors text-sm">
        {copied ? "✓" : "⧉"}
      </span>
    </button>
  );
}
