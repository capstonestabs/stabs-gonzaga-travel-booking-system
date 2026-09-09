"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/site/site-footer";

export function SiteFooterGate() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isStaffRoute = pathname.startsWith("/staff");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isAdminRoute || isStaffRoute || isDashboardRoute) {
    return null;
  }

  return <SiteFooter />;
}