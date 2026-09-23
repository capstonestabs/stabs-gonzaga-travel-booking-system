import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site/site-header";
import { getCurrentUserContext } from "@/lib/auth";
import { PageTransitionShell } from "@/components/site/page-transition-shell";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta"
});

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserContext();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className={`${plusJakartaSans.variable} font-admin min-h-screen`}>
      <div className="dashboard-background" style={{ backgroundImage: "url(/assets/dashboard-background.jpg)" }} />
      <div className="fixed inset-0 -z-10 bg-white/20" />
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 pb-16 lg:pb-0 pt-16 lg:pt-20">
          <PageTransitionShell>{children}</PageTransitionShell>
        </main>
      </div>
    </div>
  );
}
