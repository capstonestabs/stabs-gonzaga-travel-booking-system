"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/site/sidebar-context";
import { DashboardGlassSidebar } from "@/components/site/dashboard-glass-sidebar";
import { DashboardTopbar } from "@/components/site/dashboard-topbar";

export function DashboardShellFrame({
  role,
  account,
  children
}: {
  role: "user" | "staff" | "admin";
  account: { name: string; email: string; avatarUrl: string | null };
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/assets/dashboard-background.jpg)" }}
      />
      <div className="fixed inset-0 -z-10 bg-white/20" />

      <DashboardGlassSidebar role={role} />

      <div
        className={cn(
          "min-h-screen transition-[padding-left] duration-200 ease-out",
          collapsed ? "md:pl-[4.5rem]" : "md:pl-64"
        )}
      >
        <DashboardTopbar account={account} />
        <main className="px-4 pb-10 sm:px-6">{children}</main>
      </div>
    </div>
  );
}