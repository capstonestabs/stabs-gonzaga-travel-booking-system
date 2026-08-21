"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

import { DashboardNav } from "@/components/site/dashboard-nav";
import { SignOutButton } from "@/components/site/sign-out-button";
import { useSidebar } from "@/components/site/sidebar-context";
import { workspaceNavByRole } from "@/components/site/workspace-nav-config";
import { getInitials, cn } from "@/lib/utils";

const staffSections = [{ title: "Staff workspace", items: workspaceNavByRole.staff }];

export function StaffSidebar({
  account
}: {
  account: { name: string; email: string; avatarUrl: string | null } | null;
}) {
  const { collapsed, toggleCollapsed } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      if (event.target instanceof HTMLElement && event.target.closest("[data-confirmation-dialog='true']")) return;
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-0 z-30 hidden flex-col border-r border-border/70 bg-card transition-[width] duration-300 ease-in-out xl:flex",
        collapsed ? "w-[4.5rem]" : "w-[16.5rem]"
      )}
    >
      <div className={cn("flex items-center justify-between gap-2 border-b border-border/70 px-4 py-4", collapsed && "justify-center px-3")}>
        {!collapsed ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Menu</p>
            <p className="font-display text-sm font-bold tracking-tight text-foreground">Browse STABS</p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white text-foreground transition hover:bg-muted/70"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <DashboardNav items={workspaceNavByRole.staff} sections={staffSections} variant="sidebar" collapsed={collapsed} />
      </div>

      {account ? (
        <div ref={menuRef} className="relative border-t border-border/70 p-3">
          {menuOpen ? (
            <div
              role="menu"
              className="absolute bottom-[calc(100%+0.5rem)] left-3 right-3 overflow-hidden rounded-[1rem] border border-border/70 bg-white shadow-[0_16px_36px_rgba(14,30,20,0.16)]"
            >
              <Link
                href={"/staff/account" as Route}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center gap-2.5 px-3.5 text-sm font-medium text-foreground transition hover:bg-muted/65"
              >
                Account
              </Link>
              <div className="border-t border-border/60" />
              <SignOutButton variant="ghost" className="min-h-11 w-full justify-start rounded-none px-3.5 text-sm" />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[0.9rem] border border-transparent px-2 py-2 text-left transition hover:bg-muted/60",
              collapsed && "justify-center px-0"
            )}
          >
            {account.avatarUrl ? (
              <img src={account.avatarUrl} alt={account.name} className="h-9 w-9 shrink-0 rounded-full border border-border/60 object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {getInitials(account.name)}
              </span>
            )}
            {!collapsed ? (
              <>
                <span className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                </span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
              </>
            ) : null}
          </button>
        </div>
      ) : null}
    </aside>
  );
}