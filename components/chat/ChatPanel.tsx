"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MessageWithUser } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import ChatMessage from "./ChatMessage";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  groupId: string;
  currentUserId: string;
  initialMessages: MessageWithUser[];
  members: Member[];
}

export default function ChatPanel({ groupId, currentUserId, initialMessages, members }: Props) {
  const [messages, setMessages] = useState<MessageWithUser[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const raw = payload.new as { id: string; group_id: string; user_id: string; content: string; created_at: string };
          // Avoid duplicates from own sends
          setMessages((prev) => {
            if (prev.some((m) => m.id === raw.id)) return prev;
            const sender = members.find((m) => m.id === raw.user_id);
            const withUser: MessageWithUser = {
              ...raw,
              users: sender
                ? { full_name: sender.full_name, email: sender.email }
                : null,
            };
            return [...prev, withUser];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, members]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId, content }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
        );
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [draft, groupId, sending]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 text-sm">Group Chat</h3>
        <p className="text-xs text-gray-400">{members.length} members</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} isOwn={m.user_id === currentUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0 flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message… (Enter to send)"
          rows={1}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 max-h-32 overflow-y-auto"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          className="flex-shrink-0 bg-indigo-600 text-white rounded-xl px-3 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
