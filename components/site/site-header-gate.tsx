"use client";

import { usePathname } from "next/navigation";

export function SiteHeaderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaffRoute = pathname.startsWith("/staff");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isStaffRoute || isDashboardRoute || isAdminRoute) {
    return null;
  }

  return <>{children}</>;
}