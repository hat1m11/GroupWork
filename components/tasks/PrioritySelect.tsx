import type { Task } from "@/lib/supabase/types";

const priorities: Task["priority"][] = ["low", "medium", "high", "urgent"];

interface Props {
  value: Task["priority"];
  onChange: (value: Task["priority"]) => void;
  className?: string;
}

export default function PrioritySelect({ value, onChange, className = "" }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Task["priority"])}
      className={`rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${className}`}
    >
      {priorities.map((p) => (
        <option key={p} value={p}>
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </option>
      ))}
    </select>
  );
}
