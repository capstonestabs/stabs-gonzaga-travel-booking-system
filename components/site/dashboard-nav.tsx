"use client";

import type { Route } from "next";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  CirclePlus,
  History,
  Landmark,
  Menu,
  MessageSquareText,
  Package,
  Ticket,
  UserRound,
  Users,
  UsersRound,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardNavIconName, WorkspaceNavItem } from "@/components/site/workspace-nav-config";
import { cn } from "@/lib/utils";

const iconByName: Record<DashboardNavIconName, React.ComponentType<{ className?: string }>> = {
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
};

function getBaseHref(href: string) {
  return href.includes("#") ? href.split("#")[0] : href;
}

function matchesPath(pathname: string, href: string) {
  const baseHref = getBaseHref(href);
  return pathname === baseHref || (baseHref !== "/" && pathname.startsWith(`${baseHref}/`));
}

export function DashboardNav({ items }: { items: WorkspaceNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeHref =
    items
      .filter((item) =>
        [item.href, ...(item.matchHrefs ?? [])].some((href) => matchesPath(pathname, href))
      )
      .sort((left, right) => getBaseHref(right.href).length - getBaseHref(left.href).length)[0]
      ?.href ?? null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 w-full sm:w-auto"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="workspace-section-menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
        Menu
      </Button>

      {open && isMounted
        ? createPortal(
            <div className="dialog-overlay fixed inset-0 z-[110]">
              <button
                type="button"
                aria-label="Close section menu"
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
              />

              <aside
                id="workspace-section-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Workspace section menu"
                className="drawer-slide-in relative z-10 flex h-[100dvh] w-[min(18.5rem,86vw)] max-w-full flex-col border-r border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(245,249,246,0.98))] shadow-[0_22px_60px_rgba(14,30,20,0.24)]"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Section menu
                    </p>
                    <p className="font-display text-[1.15rem] font-semibold tracking-tight text-foreground">
                      Navigate workspace
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[0.95rem] border border-border/70 bg-card/90 text-foreground transition hover:bg-muted/75"
                    aria-label="Close section menu"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
                  <nav className="grid gap-2">
                    {items.map((item) => {
                      const Icon = iconByName[item.icon];
                      const active = activeHref === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href as Route}
                          prefetch
                          className={cn(
                            "group inline-flex min-h-12 w-full items-center gap-3 rounded-[1rem] border px-3.5 py-3 text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-150 hover:-translate-y-[1px] active:translate-y-0",
                            active
                              ? "border-primary/15 bg-primary/10 text-primary"
                              : "border-border/60 bg-card/90 text-foreground/85 hover:border-border/80 hover:bg-muted/70"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.82rem] border transition-colors",
                              active
                                ? "border-primary/15 bg-primary/12"
                                : "border-border/60 bg-card/90 group-hover:border-primary/10 group-hover:bg-card"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4.5 w-4.5",
                                active ? "text-primary" : "text-foreground/62"
                              )}
                            />
                          </span>
                          <span className="min-w-0 truncate leading-5">{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </aside>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
