"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  CirclePlus,
  History,
  Landmark,
  MessageSquareText,
  Package,
  Ticket,
  UserRound,
  Users,
  UsersRound
} from "lucide-react";

import { cn } from "@/lib/utils";

const iconByName = {
  overview: BarChart3,
  destination: BriefcaseBusiness,
  services: Package,
  bookings: CalendarCheck2,
  feedback: MessageSquareText,
  account: UserRound,
  staff: Users,
  tourists: UsersRound,
  create: CirclePlus,
  financials: Landmark,
  history: History,
  tickets: Ticket
} as const;

export type DashboardNavIconName = keyof typeof iconByName;

type NavItem = {
  href: string;
  label: string;
  icon: DashboardNavIconName;
  matchHrefs?: string[];
};

function getBaseHref(href: string) {
  return href.includes("#") ? href.split("#")[0] : href;
}

function matchesPath(pathname: string, href: string) {
  const baseHref = getBaseHref(href);
  return pathname === baseHref || (baseHref !== "/" && pathname.startsWith(`${baseHref}/`));
}

export function DashboardNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const activeHref =
    items
      .filter((item) =>
        [item.href, ...(item.matchHrefs ?? [])].some((href) => matchesPath(pathname, href))
      )
      .sort((left, right) => getBaseHref(right.href).length - getBaseHref(left.href).length)[0]
      ?.href ?? null;
  const activeItem = items.find((item) => item.href === activeHref) ?? items[0];

  return (
    <div className="space-y-3">
      <div className="rounded-[0.95rem] border border-border/60 bg-muted/28 px-3 py-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Section menu
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {activeItem?.label ?? "Choose a section"}
        </p>
      </div>

      <nav className="grid min-w-0 max-h-[min(24rem,58vh)] grid-cols-1 gap-2 overflow-y-auto pr-1 xl:max-h-none xl:overflow-visible xl:pr-0">
        {items.map((item) => {
          const Icon = iconByName[item.icon];
          const active = activeHref === item.href;

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              prefetch
              className={cn(
                "group flex min-h-11 min-w-0 items-center gap-2.5 rounded-[0.95rem] border px-3 py-2.5 text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-150 hover:-translate-y-[1px] active:translate-y-0",
                active
                  ? "border-primary/15 bg-primary/10 text-primary"
                  : "border-border/60 bg-card/90 text-foreground/82 hover:border-border/80 hover:bg-muted/70"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] border transition-colors",
                  active
                    ? "border-primary/15 bg-primary/12"
                    : "border-border/60 bg-card/90 group-hover:border-primary/10 group-hover:bg-card"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-foreground/62")} />
              </span>
              <span className="min-w-0 break-words leading-5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
