import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--ct-bg)", color: "var(--ct-t1)" }}>

      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50"
        style={{ background: "var(--ct-nav)", borderBottom: "1px solid var(--ct-bd)", boxShadow: "var(--ct-nav-ring)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.35)]">
              <span className="text-white text-[11px] font-extrabold tracking-tight">GW</span>
            </div>
            <span className="font-bold tracking-tight" style={{ color: "var(--ct-t1)" }}>GroupWork</span>
          </Link>
          <div className="flex items-center gap-1">
            <div className="rounded-lg transition-colors hover:bg-[var(--ct-hi)]">
              <ThemeToggle />
            </div>
            <Link
              href="/login"
              className="text-sm font-medium px-3 py-2 rounded-lg transition-colors ml-1"
              style={{ color: "var(--ct-t2)" }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-10 px-4 sm:px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(59,130,246,0.1) 0%, transparent 65%)" }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Pulsing pill */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/25 rounded-full px-4 py-1.5 text-xs font-medium mb-7">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Free for students
          </div>

          <h1 className="text-5xl sm:text-[3.75rem] font-bold text-gray-50 tracking-tight leading-[1.1] mb-5">
            Group assignments,<br />actually organised
          </h1>

          {/* Shorter subheading that fits 2 lines max */}
          <p className="text-lg text-gray-400 max-w-[440px] mx-auto mb-9 leading-relaxed">
            A shared task board, real-time chat, and deadline tracking — built for how group assignments actually work.
          </p>

          <div className="flex items-center gap-3 justify-center flex-wrap mb-6">
            <Link
              href="/signup"
              className="bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-150 text-sm"
            >
              Get started free
            </Link>
            <Link
              href="#how-it-works"
              className="border border-[#374151] hover:border-[#4B5563] hover:text-white text-gray-400 font-medium px-6 py-2.5 rounded-lg transition-all duration-150 text-sm"
            >
              See how it works
            </Link>
          </div>
          <p className="text-xs text-gray-600">Used by students at universities worldwide · Always free</p>
        </div>
      </section>

      {/* ── Product Mockup ── */}
      <section className="pb-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Browser frame */}
          <div
            className="rounded-xl overflow-hidden border border-[#1E2A3A]"
            style={{ boxShadow: "0 0 60px rgba(59,130,246,0.15), 0 20px 60px rgba(0,0,0,0.4)" }}
          >
            {/* Window chrome */}
            <div className="bg-[#1a2332] border-b border-[#1E2A3A] px-4 py-2.5 flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-[#0D1424] rounded-md px-4 py-1 text-[11px] text-gray-600 w-48 text-center">
                  app.groupwork.io
                </div>
              </div>
            </div>

            {/* App inner chrome — mini top bar */}
            <div className="bg-[#0D1424] border-b border-[#1E2A3A] px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[8px] font-extrabold">GW</span>
                </div>
                <span className="text-xs font-semibold text-gray-100 hidden sm:block">GroupWork</span>
                <span className="text-gray-600 text-xs hidden sm:block">/</span>
                <span className="text-xs text-gray-400 hidden sm:block">CS3900 · Systems Design</span>
              </div>
              <div className="flex items-center gap-1">
                {["Board","Chat","Calendar","Workload"].map((t, i) => (
                  <div key={t} className={`px-2.5 py-1 rounded text-[10px] font-medium ${i === 0 ? "text-blue-400 bg-blue-500/10 border border-blue-500/20" : "text-gray-600"}`}>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Kanban board */}
            <div className="bg-[#0A0F1E] p-4 sm:p-5">
              {/* Section header */}
              <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-gray-100">Literature Review</span>
                    <span className="text-xs text-gray-600">40% of grade</span>
                  </div>
                  <button className="text-[10px] text-gray-600 flex items-center gap-1">
                    <span className="text-blue-500 text-[9px] font-medium">+ Add task</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#1E2A3A] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "75%" }} />
                  </div>
                  <span className="text-[10px] text-gray-500 tabular-nums">75%</span>
                </div>
                <p className="text-[10px] text-gray-600 mt-1">3 of 4 tasks done · +30% to final grade</p>
              </div>

              {/* Three columns */}
              <div className="grid grid-cols-3 gap-3">

                {/* To do */}
                <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl overflow-hidden">
                  <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 border-b border-[#1E2A3A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                    <p className="text-[10px] font-medium text-gray-500">To do</p>
                    <span className="ml-auto text-[10px] text-gray-700">1</span>
                  </div>
                  <div className="p-2.5 space-y-2">
                    {/* Task card */}
                    <div className="bg-[#141E2D] rounded-lg border border-[#1E2A3A] p-2.5">
                      <p className="text-[11px] font-medium text-gray-100 mb-2 leading-tight">Research competitor tools</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] bg-red-500/10 text-red-400 rounded-full px-1.5 py-px">⚡ Urgent</span>
                        <span className="text-[9px] bg-gray-800 text-gray-500 rounded-full px-1.5 py-px flex items-center gap-0.5">
                          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                          Alex
                        </span>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-[#1E2A3A]">
                        <span className="text-[9px] text-red-400">Due Nov 15</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* In progress */}
                <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl overflow-hidden">
                  <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 border-b border-[#1E2A3A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <p className="text-[10px] font-medium text-blue-400">In progress</p>
                    <span className="ml-auto text-[10px] text-gray-700">1</span>
                  </div>
                  <div className="p-2.5 space-y-2">
                    <div className="bg-[#141E2D] rounded-lg border border-[#1E2A3A] p-2.5">
                      <p className="text-[11px] font-medium text-gray-100 mb-2 leading-tight">Write the introduction</p>
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 bg-[#1E2A3A] rounded-full h-1 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: "60%" }} />
                          </div>
                          <span className="text-[9px] text-gray-600">3/5</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] bg-sky-500/10 text-sky-400 rounded-full px-1.5 py-px">Medium</span>
                        <span className="text-[9px] bg-gray-800 text-gray-500 rounded-full px-1.5 py-px flex items-center gap-0.5">
                          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                          Sam
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Done */}
                <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl overflow-hidden">
                  <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 border-b border-[#1E2A3A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <p className="text-[10px] font-medium text-emerald-400">Done</p>
                    <span className="ml-auto text-[10px] text-gray-700">2</span>
                  </div>
                  <div className="p-2.5 space-y-2">
                    <div className="bg-[#141E2D] rounded-lg border border-[#1E2A3A] p-2.5 opacity-60">
                      <p className="text-[11px] font-medium text-gray-500 mb-2 leading-tight line-through">Review existing sources</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] bg-gray-500/10 text-gray-500 rounded-full px-1.5 py-px">Low</span>
                        <span className="text-[9px] bg-gray-800 text-gray-600 rounded-full px-1.5 py-px flex items-center gap-0.5">
                          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                          Jordan
                        </span>
                      </div>
                    </div>
                    <div className="bg-[#141E2D] rounded-lg border border-[#1E2A3A] p-2.5 opacity-60">
                      <p className="text-[11px] font-medium text-gray-500 mb-2 leading-tight line-through">Set up shared doc</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] bg-gray-500/10 text-gray-500 rounded-full px-1.5 py-px">Low</span>
                        <span className="text-[9px] bg-gray-800 text-gray-600 rounded-full px-1.5 py-px flex items-center gap-0.5">
                          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                          Riley
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature highlights ── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-50 tracking-tight mb-3">
              Built around how group assignments actually work
            </h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Not another project management tool. Specifically made for students.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Blue — task organisation */}
            <div className="bg-gray-900 border border-[#1E2A3A] rounded-xl p-5 hover:border-[#2D3F55] transition-all duration-150">
              <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-4.5 h-4.5 w-[18px] h-[18px] text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-100 mb-1.5 text-sm">Rubric-based task board</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Columns map to your assignment rubric. Every section shows its grade weight and completion percentage.
              </p>
            </div>

            {/* Purple — communication */}
            <div className="bg-gray-900 border border-[#1E2A3A] rounded-xl p-5 hover:border-[#2D3F55] transition-all duration-150">
              <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-[18px] h-[18px] text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-100 mb-1.5 text-sm">Built-in group chat</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Threaded messages, @mentions, pinned links and emoji reactions — so the group chat stays in one place.
              </p>
            </div>

            {/* Emerald — deadline tracking */}
            <div className="bg-gray-900 border border-[#1E2A3A] rounded-xl p-5 hover:border-[#2D3F55] transition-all duration-150">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-[18px] h-[18px] text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-100 mb-1.5 text-sm">Deadline dashboard</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Every overdue and upcoming task across all your groups, with urgency alerts before things slip.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-50 tracking-tight mb-3">Up and running in minutes</h2>
            <p className="text-sm text-gray-500">From invite code to task board in under a minute.</p>
          </div>

          {/* Steps — inline connector lines using flex */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                n: "1",
                title: "Create or join a group",
                desc: "Set up a group for your assignment or paste an invite code from a teammate. Takes 30 seconds.",
              },
              {
                n: "2",
                title: "Build your task board",
                desc: "Map your assignment rubric into kanban columns and assign tasks with due dates and priorities.",
              },
              {
                n: "3",
                title: "Track progress and submit",
                desc: "Watch completion percentages rise, catch overdue tasks early, and submit together.",
              },
            ].map((step, i) => (
              <div key={step.n} className="flex flex-col">
                {/* Circle + connector line */}
                <div className="flex items-center mb-4">
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400 tabular-nums">
                    {step.n}
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block flex-1 h-px bg-[#1E2A3A] ml-3" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-100 text-sm mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-2xl px-8 py-14 text-center border"
            style={{
              background: "var(--ct-surf)",
              backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, transparent 55%)",
              borderColor: "rgba(59,130,246,0.2)",
            }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3" style={{ color: "var(--ct-t1)" }}>
              Ready to stop the group chat chaos?
            </h2>
            <p className="text-sm mb-8" style={{ color: "var(--ct-t2)" }}>Set up your group in under 2 minutes.</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-150 text-sm"
              style={{ boxShadow: "0 0 24px rgba(59,130,246,0.3)" }}
            >
              Get started free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1E2A3A] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
              <span className="text-white text-[9px] font-extrabold tracking-tight">GW</span>
            </div>
            <span className="text-sm font-medium text-gray-400">GroupWork</span>
            <span className="text-gray-700">·</span>
            <span className="text-xs text-gray-600">Free group assignment manager for students</span>
          </div>
          <nav className="flex items-center gap-8">
            <Link href="/login" className="text-xs text-gray-500 hover:text-gray-200 transition-colors">Sign in</Link>
            <Link href="/signup" className="text-xs text-gray-500 hover:text-gray-200 transition-colors">Sign up</Link>
          </nav>
        </div>
      </footer>

    </div>
  );
}
