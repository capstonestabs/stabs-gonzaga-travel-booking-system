"use client";

import { usePathname } from "next/navigation";

export function PageTransitionShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isStaffRoute = pathname.startsWith("/staff");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isAdminRoute || isStaffRoute || isDashboardRoute) {
    return <div className="min-h-full">{children}</div>;
  }

  return (
    <div key={pathname} className="page-transition-shell">
      {children}
    </div>
  );
}