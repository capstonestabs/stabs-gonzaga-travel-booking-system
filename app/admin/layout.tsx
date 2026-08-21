import { Plus_Jakarta_Sans } from "next/font/google";

import { AdminSidebar } from "@/components/site/admin-sidebar";
import { AdminContentShell } from "@/components/site/admin-content-shell";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta"
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${plusJakartaSans.variable} font-admin min-h-screen bg-background`}>
      <AdminSidebar />
      <AdminContentShell>{children}</AdminContentShell>
    </div>
  );
}