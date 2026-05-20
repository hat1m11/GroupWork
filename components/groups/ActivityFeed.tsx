"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  id: string;
  action_type: string;
  description: string | null;
  created_at: string;
  users: { full_name: string | null; email: string } | null;
}

const ACTION_ICON: Record<string, string> = {
  group_created:       "🏁",
  member_joined:       "👋",
  task_created:        "✅",
  task_status_changed: "🔄",
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface Props {
  groupId: string;
}

export default function ActivityFeed({ groupId }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/activity`)
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs ?? []); setLoading(false); });
  }, [groupId]);

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>;
  if (logs.length === 0) return <div className="text-center py-16 text-gray-400 text-sm">No activity yet.</div>;

  return (
    <div className="space-y-1">
      <h2 className="font-semibold text-gray-900 mb-4">Activity</h2>
      {logs.map((log) => {
        const name = log.users?.full_name ?? log.users?.email?.split("@")[0] ?? "Someone";
        const icon = ACTION_ICON[log.action_type] ?? "•";
        return (
          <div key={log.id} className="flex items-start gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">
                <span className="font-medium">{name}</span>{" "}
                {log.description ?? log.action_type.replace(/_/g, " ")}
              </p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{relTime(log.created_at)}</span>
          </div>
        );
      })}
    </div>
  );
}
