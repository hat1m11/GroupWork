export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Group header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-7 w-48 rounded-lg bg-white/[0.06]" />
          <div className="h-4 w-64 rounded-md bg-white/[0.04]" />
        </div>
        <div className="h-9 w-24 rounded-lg bg-white/[0.06]" />
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-0">
        {[80, 60, 90, 80, 90, 80, 80, 64].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-t-md bg-white/[0.05]"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Section header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-blue-500/30" />
          <div className="h-4 w-24 rounded-md bg-white/[0.06]" />
          <div className="h-5 w-20 rounded-full bg-white/[0.04]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-24 rounded-full bg-white/[0.05]" />
          <div className="h-4 w-20 rounded-md bg-white/[0.04]" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-blue-500/20" />
      </div>

      {/* Kanban columns skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[
          ["w-3/4", "w-1/2", "w-2/3"],
          ["w-2/3"],
          ["w-1/2", "w-3/4"],
        ].map((cards, ci) => (
          <div
            key={ci}
            className="rounded-2xl overflow-hidden border border-white/[0.06]"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {/* Column accent strip */}
            <div className="h-[3px] w-full bg-white/[0.06]" />
            {/* Column header */}
            <div className="px-4 py-3 flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="w-2 h-2 rounded-full bg-white/[0.12]" />
              <div className="h-3 w-20 rounded-md bg-white/[0.08]" />
              <div className="ml-auto h-5 w-6 rounded-full bg-white/[0.06]" />
            </div>
            {/* Cards */}
            <div className="p-3 space-y-2.5">
              {cards.map((w, i) => (
                <div key={i} className="rounded-xl p-3 space-y-2.5 border border-white/[0.05]"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className={`h-3.5 ${w} rounded-md bg-white/[0.07]`} />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-14 rounded-full bg-white/[0.05]" />
                    <div className="h-5 w-12 rounded-full bg-white/[0.05]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
