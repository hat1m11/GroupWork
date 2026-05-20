import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LogoutButton from "@/components/ui/LogoutButton";
import NotificationBell from "@/components/ui/NotificationBell";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users").select("full_name, email").eq("id", user.id).single();

  const displayName = profile?.full_name ?? profile?.email ?? user.email ?? "";
  const initials = displayName
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="min-h-screen" style={{ background: "var(--ct-bg)" }}>
      <header
        className="sticky top-0 z-10"
        style={{ background: "var(--ct-nav)", borderBottom: "1px solid var(--ct-bd)", boxShadow: "var(--ct-nav-ring)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2.5 mr-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.4)]">
                <span className="text-white text-sm font-extrabold tracking-tight">GW</span>
              </div>
              <span className="text-base font-bold tracking-tight hidden sm:block" style={{ color: "var(--ct-t1)" }}>
                GroupWork
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={{ color: "var(--ct-t2)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:block">My Groups</span>
              </Link>
              <Link
                href="/my-tasks"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={{ color: "var(--ct-t2)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="hidden sm:block">My Tasks</span>
              </Link>
            </nav>
          </div>

          {/* Right: theme + bell + user */}
          <div className="flex items-center gap-1">
            <div className="rounded-lg transition-colors" style={{ "--hover-bg": "var(--ct-hi)" } as React.CSSProperties}>
              <ThemeToggle />
            </div>
            <NotificationBell userId={user.id} />
            <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: "var(--ct-bd)" }}>
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-blue-400">{initials}</span>
              </div>
              <span className="text-sm font-medium hidden md:block max-w-[120px] truncate" style={{ color: "var(--ct-t2)" }}>
                {profile?.full_name ?? profile?.email?.split("@")[0] ?? ""}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
