"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  ChevronDown,
  CirclePlus,
  History,
  Landmark,
  Menu,
  MessageSquareText,
  Package,
  UserRound,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const iconByName = {
  overview: BarChart3,
  destination: BriefcaseBusiness,
  services: Package,
  bookings: CalendarCheck2,
  feedback: MessageSquareText,
  account: UserRound,
  staff: Users,
  create: CirclePlus,
  financials: Landmark,
  history: History
} as const;

export type DashboardNavIconName = keyof typeof iconByName;

type NavItem = {
  href: string;
  label: string;
  icon: DashboardNavIconName;
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
  const [isOpen, setIsOpen] = useState(false);
  const activeHref =
    items
      .filter((item) => matchesPath(pathname, item.href))
      .sort((left, right) => getBaseHref(right.href).length - getBaseHref(left.href).length)[0]
      ?.href ?? null;
  const activeItem = items.find((item) => item.href === activeHref) ?? items[0];

  return (
    <div className="space-y-3">
      <div className="xl:hidden">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full justify-between gap-3 rounded-[0.95rem] px-3"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="inline-flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] border border-border/70 bg-card/90">
              <Menu className="h-4 w-4 text-foreground/72" />
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Section menu
              </span>
              <span className="block truncate text-sm font-medium text-foreground">
                {activeItem?.label ?? "Open navigation"}
              </span>
            </span>
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen ? "rotate-180" : "")} />
        </Button>
      </div>

      <nav
        className={cn(
          "min-w-0 gap-2",
          isOpen ? "grid max-h-[min(26rem,58vh)] grid-cols-1 overflow-y-auto pr-1" : "hidden",
          "xl:grid xl:max-h-none xl:grid-cols-1 xl:overflow-visible xl:pr-0"
        )}
      >
        {items.map((item) => {
          const Icon = iconByName[item.icon];
          const active = activeHref === item.href;

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              onClick={() => setIsOpen(false)}
              className={cn(
                "group flex min-h-11 min-w-0 items-center gap-2.5 rounded-[0.95rem] border px-3 py-2.5 text-sm font-medium transition-all",
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
