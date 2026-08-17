"use client";

import { usePathname } from "next/navigation";

export function PageTransitionShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition-shell">
      {children}
    </div>
  );
}
