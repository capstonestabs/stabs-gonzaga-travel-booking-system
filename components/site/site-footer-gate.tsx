"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/site/site-footer";

export function SiteFooterGate() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isStaffRoute = pathname.startsWith("/staff");

  if (isAdminRoute || isStaffRoute) {
    return null;
  }

  return <SiteFooter />;
}