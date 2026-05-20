"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RubricRow {
  title: string;
  weight_pct: string;
}

export default function CreateGroupButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"details" | "rubric">("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [rubric, setRubric] = useState<RubricRow[]>([
    { title: "", weight_pct: "" },
  ]);

  function addRow() {
    setRubric((r) => [...r, { title: "", weight_pct: "" }]);
  }

  function removeRow(i: number) {
    setRubric((r) => r.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, field: keyof RubricRow, value: string) {
    setRubric((r) =>
      r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row))
    );
  }

  const totalWeight = rubric.reduce(
    (sum, r) => sum + (parseFloat(r.weight_pct) || 0),
    0
  );

  function reset() {
    setStep("details");
    setName("");
    setCourseCode("");
    setAssignmentName("");
    setDueDate("");
    setRubric([{ title: "", weight_pct: "" }]);
    setError(null);
    setLoading(false);
  }

  async function handleCreate() {
    setError(null);

    const filledRows = rubric.filter((r) => r.title.trim());
    if (filledRows.length === 0) {
      setError("Add at least one rubric section.");
      return;
    }
    if (Math.abs(totalWeight - 100) > 0.01) {
      setError(`Weights must sum to 100% (currently ${totalWeight}%).`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          course_code: courseCode,
          assignment_name: assignmentName,
          due_date: dueDate || null,
          rubric_sections: filledRows.map((r, i) => ({
            title: r.title.trim(),
            weight_pct: parseFloat(r.weight_pct),
            sort_order: i,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create group");
      }

      const { groupId } = await res.json();
      setOpen(false);
      reset();
      router.push(`/groups/${groupId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New Group
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {step === "details" ? "Create a Group" : "Rubric Sections"}
            </h2>
            <button
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {step === "details" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Team Alpha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course code
                </label>
                <input
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="CS3900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment name
                </label>
                <input
                  value={assignmentName}
                  onChange={(e) => setAssignmentName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Final Project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due date (optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <button
                onClick={() => {
                  if (!name.trim() || !courseCode.trim() || !assignmentName.trim()) {
                    setError("Please fill in all required fields.");
                    return;
                  }
                  setError(null);
                  setStep("rubric");
                }}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                Next: Add Rubric
              </button>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Add rubric sections with percentage weights. They must sum to 100%.
              </p>

              <div className="space-y-3">
                {rubric.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={row.title}
                      onChange={(e) => updateRow(i, "title", e.target.value)}
                      placeholder="Section title"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <div className="relative w-24">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={row.weight_pct}
                        onChange={(e) => updateRow(i, "weight_pct", e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm pr-7 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                      <span className="absolute right-2.5 top-2 text-gray-400 text-sm">
                        %
                      </span>
                    </div>
                    {rubric.length > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        className="text-gray-400 hover:text-red-500 text-xl leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={addRow}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  + Add section
                </button>
                <span
                  className={`font-semibold ${
                    Math.abs(totalWeight - 100) < 0.01
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  Total: {totalWeight}%
                </span>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setStep("details"); setError(null); }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Creating…" : "Create Group"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
