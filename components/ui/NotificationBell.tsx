"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Notification } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json())
      .then((d) => { setNotifications(d.notifications ?? []); setLoaded(true); });
    const supabase = createClient();
    const channel = supabase.channel(`notifications:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }
  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 rounded-lg transition-colors duration-150"
        style={{ color: "var(--ct-t3)" }}
        aria-label="Notifications">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-30 w-80 rounded-xl shadow-xl overflow-hidden border"
            style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--ct-bd)" }}>
              <h3 className="font-semibold text-sm" style={{ color: "var(--ct-t1)" }}>Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!loaded && <p className="text-xs text-center py-6" style={{ color: "var(--ct-t3)" }}>Loading…</p>}
              {loaded && notifications.length === 0 && (
                <p className="text-xs text-center py-6" style={{ color: "var(--ct-t3)" }}>No notifications yet.</p>
              )}
              {notifications.map((n) => (
                <Link key={n.id} href={n.link ?? "#"}
                  onClick={() => { markRead(n.id); setOpen(false); }}
                  className="flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[var(--ct-hi)]"
                  style={!n.read ? { background: "rgba(59,130,246,0.05)" } : {}}>
                  <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${!n.read ? "bg-blue-400" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug" style={{ color: "var(--ct-t2)" }}>{n.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ct-t3)" }}>{relativeTime(n.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
