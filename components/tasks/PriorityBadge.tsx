import type { Task } from "@/lib/supabase/types";

const styles: Record<Task["priority"], string> = {
  low: "bg-gray-100 text-gray-500",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-600",
};

const LABELS: Record<Task["priority"], string> = {
  low: "Low", medium: "Medium", high: "High", urgent: "⚡ Urgent",
};

export default function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold ${styles[priority]}`}>
      {LABELS[priority]}
    </span>
  );
}
