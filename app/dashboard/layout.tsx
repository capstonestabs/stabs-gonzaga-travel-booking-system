import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site/site-header";
import { getCurrentUserContext } from "@/lib/auth";
import { SidebarProvider } from "@/components/site/sidebar-context";
import { DashboardShellFrame } from "@/components/site/dashboard-shell-frame";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserContext();

  if (!user) {
    redirect("/sign-in");
  }

  const account = {
    name: user.profile?.full_name ?? user.email,
    email: user.email,
    avatarUrl: user.profile?.avatar_url ?? null
  };

  if (user.role === "user") {
    return (
      <>
        <SiteHeader />
        <div className="relative min-h-screen">
          <div
            className="dashboard-background"
            style={{ backgroundImage: "url(/assets/dashboard-background.jpg)" }}
          />
          <div className="fixed inset-0 -z-10 bg-white/20" />
          {children}
        </div>
      </>
    );
  }

  return (
    <SidebarProvider>
      <DashboardShellFrame role={user.role} account={account}>
        {children}
      </DashboardShellFrame>
    </SidebarProvider>
  );
}