"use client";

import { useEffect, useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { usePathname } from "next/navigation";

import { DashboardGlassSidebar } from "@/components/site/dashboard-glass-sidebar";
import { DashboardTopbar } from "@/components/site/dashboard-topbar";
import { SiteHeaderClient } from "@/components/site/site-header-client";
import { AdminSidebar } from "@/components/site/admin-sidebar";
import { AdminContentShell } from "@/components/site/admin-content-shell";
import { createClientSupabaseBrowserClient } from "@/lib/supabase/client";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta"
});

const DASHBOARD_ADMIN_PATHS = ["/admin"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [account, setAccount] = useState<{ name: string; email: string; avatarUrl: string | null } | null>(null);

  const isDashboardAdmin = DASHBOARD_ADMIN_PATHS.includes(pathname);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClientSupabaseBrowserClient();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", session.user.id)
        .single();

      setAccount({
        name: profile?.full_name ?? session.user.email ?? "Admin",
        email: session.user.email ?? "",
        avatarUrl: profile?.avatar_url ?? null
      });
    }

    loadUser();
  }, []);

  return (
    <div className={`${plusJakartaSans.variable} font-admin min-h-screen`}>
      {isDashboardAdmin ? (
        <DashboardGlassSidebar role="admin" />
      ) : (
        <AdminSidebar account={account} />
      )}

      <AdminContentShell>
        {isDashboardAdmin && account ? (
          <DashboardTopbar account={account} />
        ) : (
          <SiteHeaderClient role="admin" account={account} showSidebarToggle={false} />
        )}
        {children}
      </AdminContentShell>
    </div>
  );
}