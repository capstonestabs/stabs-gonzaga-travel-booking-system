"use client";

import { useSidebar } from "@/components/site/sidebar-context";
import { cn } from "@/lib/utils";

export function StaffContentShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className={cn("flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out", collapsed ? "xl:pl-[4.5rem]" : "xl:pl-[16.5rem]")}>
      {children}
    </div>
  );
}