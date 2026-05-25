export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-28 rounded-lg bg-white/[0.06]" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] p-4 flex items-center gap-4"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="w-4 h-4 rounded-full bg-white/[0.08] flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded-md bg-white/[0.07]" />
              <div className="h-3 w-1/3 rounded-md bg-white/[0.04]" />
            </div>
            <div className="h-5 w-14 rounded-full bg-white/[0.05]" />
          </div>
        ))}
      </div>
    </div>
  );
}
