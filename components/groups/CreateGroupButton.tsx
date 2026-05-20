"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RubricRow { title: string; weight_pct: string; }

const inputCls = "w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all";

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
  const [rubric, setRubric] = useState<RubricRow[]>([{ title: "", weight_pct: "" }]);

  const totalWeight = rubric.reduce((s, r) => s + (parseFloat(r.weight_pct) || 0), 0);

  function reset() {
    setStep("details"); setName(""); setCourseCode(""); setAssignmentName("");
    setDueDate(""); setRubric([{ title: "", weight_pct: "" }]); setError(null); setLoading(false);
  }

  async function handleCreate() {
    setError(null);
    const filledRows = rubric.filter((r) => r.title.trim());
    if (!filledRows.length) { setError("Add at least one rubric section."); return; }
    if (Math.abs(totalWeight - 100) > 0.01) { setError(`Weights must sum to 100% (currently ${totalWeight}%).`); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, course_code: courseCode, assignment_name: assignmentName,
          due_date: dueDate || null,
          rubric_sections: filledRows.map((r, i) => ({ title: r.title.trim(), weight_pct: parseFloat(r.weight_pct), sort_order: i })) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const { groupId } = await res.json();
      setOpen(false); reset();
      router.push(`/groups/${groupId}`); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); setLoading(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-[0.98] px-4 py-2 text-white text-sm font-semibold transition-all duration-150">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New Group
      </button>
    );
  }

  const modalStyle: React.CSSProperties = { background: "rgba(10,15,30,0.88)", backdropFilter: "blur(12px)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={modalStyle}>
      <div className="rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border" style={{ background: "var(--ct-surf)", borderColor: "var(--ct-bd)" }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--ct-t1)" }}>
              {step === "details" ? "Create a Group" : "Rubric Sections"}
            </h2>
            <button onClick={() => { setOpen(false); reset(); }} className="text-2xl leading-none transition-colors"
              style={{ color: "var(--ct-t3)" }}>×</button>
          </div>

          {step === "details" ? (
            <div className="space-y-4">
              {[
                { label: "Group name", val: name, set: setName, ph: "Team Alpha" },
                { label: "Course code", val: courseCode, set: setCourseCode, ph: "CS3900" },
                { label: "Assignment name", val: assignmentName, set: setAssignmentName, ph: "Final Project" },
              ].map(({ label, val, set, ph }) => (
                <div key={label}>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>{label}</label>
                  <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                    className={inputCls} style={{ background: "var(--ct-in)", borderColor: "var(--ct-bd)", color: "var(--ct-t1)" }} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--ct-t3)" }}>Due date (optional)</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className={inputCls} style={{ background: "var(--ct-in)", borderColor: "var(--ct-bd)", color: "var(--ct-t1)" }} />
              </div>
              <button onClick={() => { if (!name.trim() || !courseCode.trim() || !assignmentName.trim()) { setError("Please fill in all required fields."); return; } setError(null); setStep("rubric"); }}
                className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-[0.98] px-4 py-2.5 text-white font-semibold transition-all duration-150">
                Next: Add Rubric
              </button>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--ct-t2)" }}>Weights must sum to 100%.</p>
              <div className="space-y-3">
                {rubric.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={row.title} onChange={(e) => setRubric((r) => r.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                      placeholder="Section title"
                      className={`flex-1 ${inputCls}`} style={{ background: "var(--ct-in)", borderColor: "var(--ct-bd)", color: "var(--ct-t1)" }} />
                    <div className="relative w-24">
                      <input type="number" min="1" max="100" value={row.weight_pct}
                        onChange={(e) => setRubric((r) => r.map((x, j) => j === i ? { ...x, weight_pct: e.target.value } : x))}
                        placeholder="0"
                        className={`w-full pr-7 ${inputCls}`} style={{ background: "var(--ct-in)", borderColor: "var(--ct-bd)", color: "var(--ct-t1)" }} />
                      <span className="absolute right-2.5 top-2 text-sm" style={{ color: "var(--ct-t3)" }}>%</span>
                    </div>
                    {rubric.length > 1 && (
                      <button onClick={() => setRubric((r) => r.filter((_, j) => j !== i))} className="text-xl leading-none transition-colors" style={{ color: "var(--ct-t3)" }}>×</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <button onClick={() => setRubric((r) => [...r, { title: "", weight_pct: "" }])} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  + Add section
                </button>
                <span className={`font-semibold ${Math.abs(totalWeight - 100) < 0.01 ? "text-emerald-400" : "text-red-400"}`}>
                  Total: {totalWeight}%
                </span>
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setStep("details"); setError(null); }}
                  className="flex-1 rounded-lg border px-4 py-2.5 font-semibold hover:bg-[var(--ct-hi)] active:scale-[0.98] transition-all duration-150"
                  style={{ borderColor: "var(--ct-bd)", color: "var(--ct-t2)" }}>
                  Back
                </button>
                <button onClick={handleCreate} disabled={loading}
                  className="flex-1 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-[0.98] px-4 py-2.5 text-white font-semibold disabled:opacity-60 transition-all duration-150">
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
