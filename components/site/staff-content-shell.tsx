"use client";

import { useSidebar } from "@/components/site/sidebar-context";
import { cn } from "@/lib/utils";

export function StaffContentShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className={cn("flex min-h-screen flex-col transition-[padding-left] duration-300 ease-in-out", collapsed ? "md:pl-[4.5rem]" : "md:pl-[16.5rem]")}>
      {children}
    </div>
  );
}