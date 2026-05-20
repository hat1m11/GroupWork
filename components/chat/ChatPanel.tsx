"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MessageWithUser, Reaction } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  groupId: string;
  currentUserId: string;
  isOwner: boolean;
  initialMessages: MessageWithUser[];
  members: Member[];
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "✅", "😮"];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const today = new Date().toLocaleDateString("en-GB");
  const msgDate = d.toLocaleDateString("en-GB");
  if (msgDate === today) return "Today";
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-GB");
  if (msgDate === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type ReactionMap = Record<string, { count: number; mine: boolean }>;

function groupReactions(reactions: Reaction[], userId: string): ReactionMap {
  const map: ReactionMap = {};
  for (const r of reactions) {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, mine: false };
    map[r.emoji].count++;
    if (r.user_id === userId) map[r.emoji].mine = true;
  }
  return map;
}

export default function ChatPanel({ groupId, currentUserId, isOwner, initialMessages, members }: Props) {
  const [messages, setMessages] = useState<MessageWithUser[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageWithUser | null>(null);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pinnedMessages = messages.filter((m) => m.pinned && !m.parent_id);
  const topLevelMessages = messages.filter((m) => !m.parent_id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` }, (payload) => {
        const raw = payload.new as MessageWithUser;
        setMessages((prev) => {
          if (prev.some((m) => m.id === raw.id)) return prev;
          const sender = members.find((m) => m.id === raw.user_id);
          return [...prev, { ...raw, users: sender ? { full_name: sender.full_name, email: sender.email } : null, reactions: [] }];
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` }, (payload) => {
        const updated = payload.new as MessageWithUser;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, pinned: updated.pinned } : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, members]);

  // @mention autocomplete
  function handleDraftChange(value: string) {
    setDraft(value);
    const match = value.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  const mentionCandidates = mentionQuery !== null
    ? members.filter((m) => (m.full_name ?? m.email).toLowerCase().includes(mentionQuery))
    : [];

  function insertMention(member: Member) {
    const name = member.full_name ?? member.email.split("@")[0];
    setDraft((d) => d.replace(/@\w*$/, `@${name} `));
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");
    setReplyTo(null);
    setMentionQuery(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId, content, parent_id: replyTo?.id ?? null }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => prev.some((m) => m.id === data.message.id) ? prev : [...prev, { ...data.message, reactions: [] }]);
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [draft, groupId, sending, replyTo]);

  async function toggleReaction(messageId: string, emoji: string) {
    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, emoji }),
    });
    // Optimistic update
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = m.reactions ?? [];
      const existing = reactions.find((r) => r.emoji === emoji && r.user_id === currentUserId);
      if (existing) {
        return { ...m, reactions: reactions.filter((r) => !(r.emoji === emoji && r.user_id === currentUserId)) };
      }
      return { ...m, reactions: [...reactions, { id: Date.now().toString(), message_id: messageId, user_id: currentUserId, emoji, created_at: new Date().toISOString() }] };
    }));
  }

  async function togglePin(messageId: string) {
    const res = await fetch(`/api/messages/${messageId}/pin`, { method: "PATCH" });
    const data = await res.json();
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, pinned: data.pinned } : m));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionCandidates.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => Math.min(i + 1, mentionCandidates.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionCandidates[mentionIndex]); return; }
      if (e.key === "Escape") { setMentionQuery(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // Group by date
  const byDate: { date: string; msgs: MessageWithUser[] }[] = [];
  for (const m of topLevelMessages) {
    const d = relativeDate(m.created_at);
    if (!byDate.length || byDate[byDate.length - 1].date !== d) byDate.push({ date: d, msgs: [] });
    byDate[byDate.length - 1].msgs.push(m);
  }

  function MessageBubble({ msg, isReply = false }: { msg: MessageWithUser; isReply?: boolean }) {
    const isOwn = msg.user_id === currentUserId;
    const sender = msg.users?.full_name ?? msg.users?.email?.split("@")[0] ?? "Unknown";
    const reactions = groupReactions(msg.reactions ?? [], currentUserId);
    const replies = messages.filter((m) => m.parent_id === msg.id);

    return (
      <div className={`group flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"} ${isReply ? "ml-6 mt-1" : ""}`}>
        {!isOwn && !isReply && <span className="text-xs text-gray-400 px-1">{sender}</span>}
        <div className="flex items-end gap-1.5">
          {!isOwn && (
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity order-first">
              <button onClick={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)} className="text-gray-400 hover:text-indigo-600 text-xs">😊</button>
              <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }} className="text-gray-400 hover:text-indigo-600 text-xs">↩</button>
              {isOwner && <button onClick={() => togglePin(msg.id)} className="text-gray-400 hover:text-amber-500 text-xs">{msg.pinned ? "📌" : "📍"}</button>}
            </div>
          )}
          <div>
            {msg.parent_id && !isReply && (
              <p className="text-xs text-gray-400 mb-0.5 px-1">↩ reply</p>
            )}
            <div className={`max-w-[72vw] sm:max-w-xs rounded-2xl px-3 py-2 text-sm break-words ${isOwn ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"}`}>
              {msg.content}
            </div>
          </div>
          {isOwn && (
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)} className="text-gray-400 hover:text-indigo-600 text-xs">😊</button>
              <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }} className="text-gray-400 hover:text-indigo-600 text-xs">↩</button>
              {isOwner && <button onClick={() => togglePin(msg.id)} className="text-gray-400 hover:text-amber-500 text-xs">{msg.pinned ? "📌" : "📍"}</button>}
            </div>
          )}
        </div>

        {emojiPickerFor === msg.id && (
          <div className={`flex gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-md ${isOwn ? "mr-8" : "ml-8"}`}>
            {QUICK_EMOJIS.map((e) => (
              <button key={e} onClick={() => { toggleReaction(msg.id, e); setEmojiPickerFor(null); }} className="text-base hover:scale-125 transition-transform">{e}</button>
            ))}
          </div>
        )}

        {Object.keys(reactions).length > 0 && (
          <div className={`flex gap-1 flex-wrap ${isOwn ? "justify-end mr-8" : "ml-8"}`}>
            {Object.entries(reactions).map(([emoji, { count, mine }]) => (
              <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className={`text-xs rounded-full px-2 py-0.5 border transition-colors ${mine ? "bg-indigo-100 border-indigo-300 text-indigo-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-indigo-200"}`}>
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        <span className="text-xs text-gray-300 px-1">{formatTime(msg.created_at)}</span>

        {replies.length > 0 && !isReply && (
          <div className="w-full space-y-1 mt-1">
            {replies.map((r) => <MessageBubble key={r.id} msg={r} isReply />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 text-sm">Group Chat</h3>
        <p className="text-xs text-gray-400">{members.length} members</p>
      </div>

      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex-shrink-0">
          <p className="text-xs font-medium text-amber-700">📌 {pinnedMessages[pinnedMessages.length - 1].content}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {topLevelMessages.length === 0 && <p className="text-xs text-gray-300 text-center py-8">No messages yet. Say hello!</p>}
        {byDate.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">{date}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="space-y-3">
              {msgs.map((m) => <MessageBubble key={m.id} msg={m} />)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-indigo-600 truncate">
            ↩ Replying to: <span className="font-medium">{replyTo.content}</span>
          </p>
          <button onClick={() => setReplyTo(null)} className="text-indigo-400 hover:text-indigo-600 ml-2">✕</button>
        </div>
      )}

      <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0 relative">
        {mentionCandidates.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {mentionCandidates.map((m, i) => (
              <button
                key={m.id}
                onClick={() => insertMention(m)}
                className={`w-full text-left px-3 py-2 text-sm ${i === mentionIndex ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                @{m.full_name ?? m.email.split("@")[0]}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message… (Enter to send, @ to mention)"
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
    </div>
  );
}
