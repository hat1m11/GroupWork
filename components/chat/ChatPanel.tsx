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

// Distinct bubble colours for other people's messages
const SENDER_COLORS = [
  "bg-[#1E2A3A]",
  "bg-[#1A2535]",
  "bg-[#1F2D40]",
  "bg-[#172334]",
];

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

const SENDER_INDEX: Record<string, number> = {};
let senderCounter = 0;
function getSenderIndex(userId: string): number {
  if (!(userId in SENDER_INDEX)) {
    SENDER_INDEX[userId] = senderCounter++ % SENDER_COLORS.length;
  }
  return SENDER_INDEX[userId];
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

  function handleDraftChange(value: string) {
    setDraft(value);
    const match = value.match(/@(\w*)$/);
    if (match) { setMentionQuery(match[1].toLowerCase()); setMentionIndex(0); }
    else setMentionQuery(null);
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
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = m.reactions ?? [];
      const existing = reactions.find((r) => r.emoji === emoji && r.user_id === currentUserId);
      if (existing) return { ...m, reactions: reactions.filter((r) => !(r.emoji === emoji && r.user_id === currentUserId)) };
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

  // Group messages by date
  const byDate: { date: string; msgs: MessageWithUser[] }[] = [];
  for (const m of topLevelMessages) {
    const d = relativeDate(m.created_at);
    if (!byDate.length || byDate[byDate.length - 1].date !== d) byDate.push({ date: d, msgs: [] });
    byDate[byDate.length - 1].msgs.push(m);
  }

  function MessageBubble({
    msg,
    isReply = false,
    isFirstInGroup = true,
    isLastInGroup = true,
  }: {
    msg: MessageWithUser;
    isReply?: boolean;
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
  }) {
    const isOwn = msg.user_id === currentUserId;
    const sender = msg.users?.full_name ?? msg.users?.email?.split("@")[0] ?? "Unknown";
    const reactions = groupReactions(msg.reactions ?? [], currentUserId);
    const replies = messages.filter((m) => m.parent_id === msg.id);
    const colorIdx = getSenderIndex(msg.user_id);
    const bubbleBg = isOwn ? "bg-blue-500 text-white" : `${SENDER_COLORS[colorIdx]} text-gray-100`;

    return (
      <div className={`group flex flex-col ${isOwn ? "items-end" : "items-start"} ${isReply ? "ml-6" : ""} ${isFirstInGroup && !isReply ? "mt-3" : "mt-0.5"}`}>
        {/* Sender name — only on first in group for others */}
        {!isOwn && isFirstInGroup && !isReply && (
          <span className="text-xs font-medium text-gray-500 px-1 mb-0.5">{sender}</span>
        )}

        <div className="flex items-end gap-1.5">
          {!isOwn && (
            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity order-first">
              <button onClick={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)} className="text-gray-600 hover:text-blue-400 text-xs transition-colors">😊</button>
              <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }} className="text-gray-600 hover:text-blue-400 text-xs transition-colors">↩</button>
              {isOwner && <button onClick={() => togglePin(msg.id)} className="text-gray-600 hover:text-amber-400 text-xs transition-colors">{msg.pinned ? "📌" : "📍"}</button>}
            </div>
          )}

          <div className="flex items-end gap-1.5">
            <div>
              {msg.parent_id && !isReply && (
                <p className="text-xs text-gray-500 mb-0.5 px-1">↩ reply</p>
              )}
              <div className={`max-w-[72vw] sm:max-w-xs px-3 py-2 text-sm break-words ${bubbleBg} ${
                isOwn
                  ? isFirstInGroup && isLastInGroup ? "rounded-2xl rounded-br-sm"
                  : isFirstInGroup ? "rounded-2xl rounded-br-md"
                  : isLastInGroup ? "rounded-2xl rounded-br-sm rounded-tr-md"
                  : "rounded-2xl rounded-r-md"
                  : isFirstInGroup && isLastInGroup ? "rounded-2xl rounded-bl-sm"
                  : isFirstInGroup ? "rounded-2xl rounded-bl-md"
                  : isLastInGroup ? "rounded-2xl rounded-bl-sm rounded-tl-md"
                  : "rounded-2xl rounded-l-md"
              }`}>
                {msg.content}
              </div>
            </div>
            {/* Timestamp on hover */}
            {isLastInGroup && (
              <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pb-0.5">
                {formatTime(msg.created_at)}
              </span>
            )}
          </div>

          {isOwn && (
            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)} className="text-gray-600 hover:text-blue-400 text-xs transition-colors">😊</button>
              <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }} className="text-gray-600 hover:text-blue-400 text-xs transition-colors">↩</button>
              {isOwner && <button onClick={() => togglePin(msg.id)} className="text-gray-600 hover:text-amber-400 text-xs transition-colors">{msg.pinned ? "📌" : "📍"}</button>}
            </div>
          )}
        </div>

        {emojiPickerFor === msg.id && (
          <div className={`flex gap-1 bg-gray-900 border border-[#1E2A3A] rounded-full px-2 py-1 shadow-md mt-1 ${isOwn ? "mr-8" : "ml-8"}`}>
            {QUICK_EMOJIS.map((e) => (
              <button key={e} onClick={() => { toggleReaction(msg.id, e); setEmojiPickerFor(null); }} className="text-base hover:scale-125 transition-transform">{e}</button>
            ))}
          </div>
        )}

        {Object.keys(reactions).length > 0 && (
          <div className={`flex gap-1 flex-wrap mt-0.5 ${isOwn ? "justify-end mr-8" : "ml-8"}`}>
            {Object.entries(reactions).map(([emoji, { count, mine }]) => (
              <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className={`text-xs rounded-full px-2 py-0.5 border transition-colors ${mine ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-[#1E2A3A] border-[#1E2A3A] text-gray-400 hover:border-blue-500/40"}`}>
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        {replies.length > 0 && !isReply && (
          <div className="w-full space-y-0.5 mt-1">
            {replies.map((r) => <MessageBubble key={r.id} msg={r} isReply />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-[#1E2A3A] rounded-xl overflow-hidden">
      {/* Pinned message — left-border accent style */}
      {pinnedMessages.length > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[#1E2A3A] flex-shrink-0 border-l-[3px] border-l-blue-500 bg-blue-500/5">
          <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-xs text-gray-300 truncate">{pinnedMessages[pinnedMessages.length - 1].content}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        {topLevelMessages.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-8">No messages yet. Say hello!</p>
        )}
        {byDate.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-[#1E2A3A]" />
              <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wide">{date}</span>
              <div className="flex-1 h-px bg-[#1E2A3A]" />
            </div>
            {msgs.map((msg, idx) => {
              const prev = idx > 0 ? msgs[idx - 1] : null;
              const next = idx < msgs.length - 1 ? msgs[idx + 1] : null;
              const GAP = 5 * 60 * 1000; // 5 min
              const isFirstInGroup = !prev || prev.user_id !== msg.user_id ||
                (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) > GAP;
              const isLastInGroup = !next || next.user_id !== msg.user_id ||
                (new Date(next.created_at).getTime() - new Date(msg.created_at).getTime()) > GAP;
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                />
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply banner */}
      {replyTo && (
        <div className="px-4 py-2 border-t border-[#1E2A3A] border-l-[3px] border-l-blue-500 bg-blue-500/5 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-blue-400 truncate">
            ↩ Replying to: <span className="font-medium text-gray-300">{replyTo.content}</span>
          </p>
          <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-gray-200 ml-2 transition-colors text-sm">✕</button>
        </div>
      )}

      {/* Input area */}
      <div className="px-3 py-3 border-t border-[#1E2A3A] flex-shrink-0 relative">
        {mentionCandidates.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-gray-900 border border-[#1E2A3A] rounded-xl shadow-xl overflow-hidden">
            {mentionCandidates.map((m, i) => (
              <button
                key={m.id}
                onClick={() => insertMention(m)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${i === mentionIndex ? "bg-blue-500/10 text-blue-400" : "text-gray-300 hover:bg-[#1E2A3A]"}`}
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
            placeholder="Message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 rounded-xl bg-[#0D1424] border border-[#1E2A3A] px-3 py-2 text-sm text-gray-50 placeholder-gray-600 resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 max-h-32 overflow-y-auto transition-all"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-40 transition-all duration-150"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
