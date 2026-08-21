import { Plus_Jakarta_Sans } from "next/font/google";

import { getCurrentUserContext } from "@/lib/auth";
import { StaffSidebar } from "@/components/site/staff-sidebar";
import { StaffHeader } from "@/components/site/staff-header";
import { StaffContentShell } from "@/components/site/staff-content-shell";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta"
});

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserContext();

  const account = user
    ? {
        name: user.profile?.full_name ?? user.email,
        email: user.email,
        avatarUrl: user.profile?.avatar_url ?? null
      }
    : null;

  return (
    <div className={`${plusJakartaSans.variable} font-admin min-h-screen bg-background`}>
      <StaffSidebar account={account} />
      <StaffContentShell>
        <StaffHeader account={account} />
        <div className="flex-1">{children}</div>
      </StaffContentShell>
    </div>
  );
}