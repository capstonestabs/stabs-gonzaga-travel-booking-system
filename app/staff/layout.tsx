"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { DashboardGlassSidebar } from "@/components/site/dashboard-glass-sidebar";
import { DashboardTopbar } from "@/components/site/dashboard-topbar";
import { SiteHeaderClient } from "@/components/site/site-header-client";
import { StaffSidebar } from "@/components/site/staff-sidebar";
import { StaffContentShell } from "@/components/site/staff-content-shell";
import { createClientSupabaseBrowserClient } from "@/lib/supabase/client";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta"
});

const DASHBOARD_STAFF_PATHS = ["/staff"];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardStaff = DASHBOARD_STAFF_PATHS.includes(pathname);
  const [account, setAccount] = useState<{ name: string; email: string; avatarUrl: string | null } | null>(null);

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
        name: profile?.full_name ?? session.user.email ?? "Staff",
        email: session.user.email ?? "",
        avatarUrl: profile?.avatar_url ?? null
      });
    }

    loadUser();
  }, []);

  return (
    <div className={`${plusJakartaSans.variable} font-admin min-h-screen`}>
      {isDashboardStaff ? (
        <DashboardGlassSidebar role="staff" />
      ) : (
        <StaffSidebar account={account} />
      )}

      <StaffContentShell>
        {isDashboardStaff && account ? (
          <DashboardTopbar account={account} />
        ) : (
          <SiteHeaderClient role="staff" account={account} />
        )}
        <div className="flex-1">{children}</div>
      </StaffContentShell>
    </div>
  );
}
