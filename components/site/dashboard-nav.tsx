"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  CirclePlus,
  ClipboardList,
  History,
  Home,
  Landmark,
  MapPin,
  MessageSquareText,
  Package,
  Settings,
  Ticket,
  UserRound,
  Users,
  UsersRound
} from "lucide-react";

import type { AdminNavSection, DashboardNavIconName, WorkspaceNavItem } from "@/components/site/workspace-nav-config";
import { cn } from "@/lib/utils";

const iconByName: Record<DashboardNavIconName, React.ComponentType<{ className?: string }>> = {
  overview: BarChart3,
  home: Home,
  destination: BriefcaseBusiness,
  pin: MapPin,
  services: Package,
  bookings: CalendarCheck2,
  feedback: MessageSquareText,
  account: UserRound,
  staff: Users,
  tourists: UsersRound,
  create: CirclePlus,
  financials: Landmark,
  history: History,
  tickets: Ticket,
  reports: BarChart3,
  settings: Settings,
  activity: ClipboardList
};

function getBaseHref(href: string) {
  return href.includes("#") ? href.split("#")[0] : href;
}

function matchesPath(pathname: string, href: string) {
  const baseHref = getBaseHref(href);
  return pathname === baseHref || (baseHref !== "/" && pathname.startsWith(`${baseHref}/`));
}

export function DashboardNav({
  items,
  sections,
  variant = "sidebar",
  collapsed = false
}: {
  items: WorkspaceNavItem[];
  sections?: AdminNavSection[];
  variant?: "sidebar";
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  const activeHref =
    items
      .filter((item) =>
        [item.href, ...(item.matchHrefs ?? [])].some((href) => matchesPath(pathname, href))
      )
      .sort((left, right) => getBaseHref(right.href).length - getBaseHref(left.href).length)[0]
      ?.href ?? null;

  if (variant === "sidebar") {
    return (
      <nav aria-label="Admin workspace" className="space-y-4">
        {sections?.map((section) => (
          <div key={section.title} className="space-y-1.5">
            {!collapsed ? (
              <p className="px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                {section.title}
              </p>
            ) : null}
            <div className="grid gap-1">
              {section.items.map((item) => {
                const Icon = iconByName[item.icon];
                const active = activeHref === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    prefetch
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group flex min-h-10 items-center gap-2.5 rounded-[0.7rem] px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                    {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  return null;
}
