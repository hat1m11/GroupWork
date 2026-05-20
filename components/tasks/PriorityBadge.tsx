import type { Task } from "@/lib/supabase/types";

const styles: Record<Task["priority"], string> = {
  low:    "bg-gray-500/10 text-gray-500",
  medium: "bg-sky-500/10 text-sky-400",
  high:   "bg-amber-500/10 text-amber-400",
  urgent: "bg-red-500/10 text-red-400",
};

const LABELS: Record<Task["priority"], string> = {
  low: "Low", medium: "Medium", high: "High", urgent: "⚡ Urgent",
};

export default function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-px text-[10px] font-medium ${styles[priority]}`}>
      {LABELS[priority]}
    </span>
  );
}
