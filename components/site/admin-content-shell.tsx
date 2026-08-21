"use client";

import { useSidebar } from "@/components/site/sidebar-context";
import { cn } from "@/lib/utils";

export function AdminContentShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className={cn("flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out", collapsed ? "xl:pl-[4.5rem]" : "xl:pl-[16.5rem]")}>
      <div className="flex-1">{children}</div>
      <footer className="px-4 py-4 text-center text-xs text-muted-foreground sm:px-5">
        © 2026 STABS - Smart Tourist Assistance and Booking System. All rights reserved.
      </footer>
    </div>
  );
}