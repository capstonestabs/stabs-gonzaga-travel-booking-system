"use client";

import { adminNavSections, workspaceNavByRole } from "@/components/site/workspace-nav-config";
import { DashboardNav } from "@/components/site/dashboard-nav";
import { SignOutButton } from "@/components/site/sign-out-button";
import { useSidebar } from "@/components/site/sidebar-context";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-[4.75rem] z-30 hidden flex-col border-r border-border/70 bg-card transition-[width] duration-300 ease-in-out xl:flex",
        collapsed ? "w-[4.5rem]" : "w-[16.5rem]"
      )}
    >
     

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <DashboardNav
          items={workspaceNavByRole.admin}
          sections={adminNavSections}
          variant="sidebar"
          collapsed={collapsed}
        />
      </div>

      <div className={cn("border-t border-border/70 p-3", collapsed && "px-2")}>
        <SignOutButton className={cn("min-h-10 w-full justify-center text-sm", collapsed && "px-0")} collapsed={collapsed} />      
      </div>
    </aside>
  );
}