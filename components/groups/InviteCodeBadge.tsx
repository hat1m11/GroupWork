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
      className="flex items-center gap-2 bg-gray-900 border border-[#1E2A3A] rounded-xl px-4 py-2.5 hover:border-[#2D3F55] transition-all duration-150 group"
      title="Copy invite code"
    >
      <div className="text-left">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Invite code</p>
        <p className="text-lg font-mono font-bold text-gray-100 tracking-widest">
          {code}
        </p>
      </div>
      <span className="text-gray-600 group-hover:text-blue-400 transition-colors text-sm">
        {copied ? "✓" : "⧉"}
      </span>
    </button>
  );
}
