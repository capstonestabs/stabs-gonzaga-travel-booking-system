import { redirect } from "next/navigation";

import { DashboardGlassSidebar } from "@/components/site/dashboard-glass-sidebar";
import { DashboardTopbar } from "@/components/site/dashboard-topbar";
import { SiteHeader } from "@/components/site/site-header";
import { getCurrentUserContext } from "@/lib/auth";
import { SidebarProvider } from "@/components/site/sidebar-context";
import { DashboardShellFrame } from "@/components/site/dashboard-shell-frame";
import { PageTransitionShell } from "@/components/site/page-transition-shell";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta"
});

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
      <div className={`${plusJakartaSans.variable} font-admin min-h-screen`}>
        <div className="dashboard-background" style={{ backgroundImage: "url(/assets/dashboard-background.jpg)" }} />
        <div className="fixed inset-0 -z-10 bg-white/20" />
        <DashboardGlassSidebar role="user" />
        <div className="flex min-h-screen flex-col md:pl-64">
          <DashboardTopbar account={account} />
          <main className="flex-1 pb-16 lg:pb-0">
            <PageTransitionShell>{children}</PageTransitionShell>
          </main>
        </div>
      </div>
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