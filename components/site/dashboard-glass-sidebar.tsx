"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  ChevronsLeft,
  ChevronsRight,
  Compass,
  FolderClock,
  Home,
  Landmark,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  Settings,
  Ticket,
  UserCheck,
  UserRound,
  UsersRound
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/site/sidebar-context";
import {
  workspaceNavByRole,
  type DashboardNavIconName,
  type WorkspaceNavItem
} from "@/components/site/workspace-nav-config";

const iconMap: Record<DashboardNavIconName, typeof Home> = {
  overview: LayoutGrid,
  home: Home,
  destination: Compass,
  pin: MapPin,
  services: Package,
  bookings: CalendarCheck2,
  feedback: MessageSquare,
  account: UserRound,
  staff: UserCheck,
  tourists: UsersRound,
  create: Plus,
  financials: Landmark,
  history: FolderClock,
  tickets: Ticket,
  reports: BarChart3,
  settings: Settings,
  activity: Activity
};

export function DashboardGlassSidebar({ role }: { role: "user" | "staff" | "admin" }) {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();
  const items = workspaceNavByRole[role] as WorkspaceNavItem[];

  return (
    <aside
      className={cn(
        "dashboard-glass-sidebar fixed inset-y-0 left-0 z-30 hidden flex-col transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <div className={cn("flex items-center gap-2.5 px-4 py-5", collapsed && "justify-center px-0")}>
        <img src="/assets/logogonzaga.png" alt="STABS" className="h-9 w-9 shrink-0 object-contain" />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-base font-semibold text-foreground">STABS</p>
            <p className="truncate text-[10px] font-medium tracking-wide text-muted-foreground">
              Gonzaga Travel Bookings
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const matchHrefs = [item.href, ...(item.matchHrefs ?? [])];
          const isActive = matchHrefs.some(
            (href) => pathname === href || pathname.startsWith(`${href}/`)
          );

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-primary/12 text-primary"
                  : "text-foreground/70 hover:bg-white/60 hover:text-foreground"
              )}
            >
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "m-3 flex items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/50 py-2 text-xs font-medium text-foreground/70 transition-colors hover:bg-white/70",
          collapsed && "px-0"
        )}
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronsLeft className="h-4 w-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}