"use client";

import { usePathname } from "next/navigation";

export function SiteHeaderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaffRoute = pathname.startsWith("/staff");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname === "/account" || pathname.startsWith("/account/");
  const isProfileRoute = pathname === "/profile" || pathname.startsWith("/profile/");

  if (isStaffRoute || isDashboardRoute || isAdminRoute || isAccountRoute || isProfileRoute) {
    return null;
  }

  return <>{children}</>;
}