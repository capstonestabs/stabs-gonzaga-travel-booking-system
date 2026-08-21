"use client";

import { usePathname } from "next/navigation";

export function SiteHeaderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaffRoute = pathname.startsWith("/staff");

  if (isStaffRoute) {
    return null;
  }

  return <>{children}</>;
}