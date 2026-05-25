export default function Loading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Page title */}
      <div className="space-y-2">
        <div className="h-7 w-36 rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-52 rounded-md bg-white/[0.04]" />
      </div>

      {/* Group cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] p-5 space-y-4"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="h-5 w-32 rounded-md bg-white/[0.07]" />
                <div className="h-3.5 w-24 rounded-md bg-white/[0.04]" />
              </div>
              <div className="h-6 w-14 rounded-full bg-white/[0.05]" />
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.05]" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="w-6 h-6 rounded-full bg-white/[0.07]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
