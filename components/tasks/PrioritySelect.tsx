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
      className={`rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all ${className}`}
      style={{ background: "var(--ct-in)", borderColor: "var(--ct-bd)", color: "var(--ct-t1)" }}
    >
      {priorities.map((p) => (
        <option key={p} value={p}>
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </option>
      ))}
    </select>
  );
}
