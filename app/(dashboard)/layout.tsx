import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LogoutButton from "@/components/ui/LogoutButton";
import NotificationBell from "@/components/ui/NotificationBell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
              GroupWork
            </Link>
            <Link
              href="/my-tasks"
              className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
            >
              My Tasks
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell userId={user.id} />
            <span className="text-sm text-gray-600">
              {profile?.full_name ?? profile?.email ?? user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
