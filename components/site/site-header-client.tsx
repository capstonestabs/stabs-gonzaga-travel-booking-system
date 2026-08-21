"use client";

import type { Route } from "next";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useSidebar } from "@/components/site/sidebar-context";
import { HeaderAccountMenu } from "@/components/site/header-account-menu";
import { workspaceNavByRole, type WorkspaceNavItem } from "@/components/site/workspace-nav-config";
import { Button } from "@/components/ui/button";
import { blueprintLogo } from "@/lib/blueprint";
import { cn } from "@/lib/utils";

export function SiteHeaderClient({
  role,
  account
}: {
  role: "user" | "staff" | "admin" | null;
  account: {
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}) {
  
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scenicPaths = new Set(["/", "/destinations", "/feedback"]);
  const isScenicPage = scenicPaths.has(pathname);
  const isStaffOrAdmin = role === "admin" || role === "staff";
  const logoHref =
    role === "admin"
      ? "/admin"
      : role === "staff"
        ? "/staff"
        : "/";
  const panelHref = role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/account";
  const panelLabel =
    role === "user"
      ? "Tourist dashboard"
      : role === "admin"
        ? "Admin workspace"
        : "Staff workspace";

  const workspaceLinks = useMemo<WorkspaceNavItem[]>(
    () => (role ? workspaceNavByRole[role] : []),
    [role]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={cn(
        "z-50",
        isScenicPage
          ? "absolute inset-x-0 top-0 bg-[linear-gradient(180deg,rgba(4,18,12,0.56)_0%,rgba(4,18,12,0.22)_55%,transparent_100%)]"
          : "sticky top-0 border-b border-emerald-950/10 bg-[linear-gradient(135deg,rgba(244,250,246,0.98),rgba(224,239,229,0.96))] shadow-[0_14px_30px_rgba(19,69,45,0.08)] backdrop-blur"
      )}
    >
        <div className={cn( isScenicPage ? "page-shell pt-3.5 sm:pt-5 lg:pt-6" : role === "admin" ? "w-full px-4 py-2.5 sm:px-5" : "page-shell py-2.5" )} >
          <div className="flex min-h-[3.5rem] w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                       {role === "admin" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hidden h-11 w-11 shrink-0 border-emerald-900/12 bg-white/82 px-0 text-emerald-950 hover:bg-white xl:inline-flex"
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  onClick={toggleCollapsed}
                >
                  {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-11 w-11 shrink-0 border-emerald-900/12 bg-white/82 px-0 text-emerald-950 hover:bg-white xl:hidden"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  onClick={() => setIsMobileMenuOpen((current) => !current)}
                >
                  {isMobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-11 w-11 shrink-0 px-0",
                  isScenicPage
                    ? "border-white/18 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                    : "border-emerald-900/12 bg-white/82 text-emerald-950 hover:bg-white"
                )}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setIsMobileMenuOpen((current) => !current)}
              >
                {isMobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
              </Button>
            )}

            <Link
              href={logoHref as Route}
              prefetch
              className="flex min-w-0 items-center gap-2.5 transition-transform duration-150 hover:-translate-y-[1px] sm:gap-3"
            >
              <img
                src={blueprintLogo}
                alt="Gonzaga Travel Bookings logo"
                className="h-8 w-8 shrink-0 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.22)] sm:h-12 sm:w-12"
              />
              <div className="min-w-0 max-[359px]:max-w-[8.5rem]">
                <p
                  className={cn(
                    "font-display text-[0.88rem] font-semibold tracking-tight sm:text-[1.15rem]",
                    isScenicPage ? "text-white" : "text-emerald-950"
                  )}
                  style={isScenicPage ? { textShadow: "0 4px 18px rgba(0,0,0,0.48)" } : undefined}
                >
                  STABSasdasd
                </p>
                <p
                  className={cn(
                    "hidden text-[9px] font-medium uppercase tracking-[0.1em] min-[360px]:block sm:text-xs sm:tracking-[0.2em]",
                    isScenicPage ? "text-white" : "text-emerald-900/80"
                  )}
                  style={isScenicPage ? { textShadow: "0 3px 14px rgba(0,0,0,0.44)" } : undefined}
                >
                  Gonzaga Travel Bookings
                </p>
              </div>
            </Link>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2.5">
            {role ? (
              account ? (
                <HeaderAccountMenu
                  name={account.name}
                  email={account.email}
                  avatarUrl={account.avatarUrl}
                  role={role}
                  scenic={isScenicPage}
                />
              ) : null
            ) : (
              <>
                <Link href="/sign-in" prefetch className="min-w-0 sm:flex-none">
                  <Button
                    variant={isScenicPage ? "outline" : "secondary"}
                    size="sm"
                    className={cn(
                      "h-9 w-full min-w-0 px-3 text-xs sm:h-10 sm:w-auto sm:px-4 sm:text-sm",
                      isScenicPage
                        ? "border-white/16 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                        : "border-emerald-900/12 bg-white/84 text-emerald-950 hover:bg-white"
                    )}
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up" prefetch className="min-w-0 sm:flex-none">
                  <Button
                    size="sm"
                    className={cn(
                      "h-9 w-full min-w-0 px-3 text-xs sm:h-10 sm:w-auto sm:px-4 sm:text-sm",
                      isScenicPage ? "bg-white text-primary hover:bg-white/90" : undefined
                    )}
                  >
                    Create account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {isMobileMenuOpen && isMounted
        ? createPortal(
            <div className="dialog-overlay fixed inset-0 z-[130]">
              <button
                type="button"
                aria-label="Close mobile menu"
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              <aside
                role="dialog"
                aria-modal="true"
                aria-label="Mobile site menu"
                className="drawer-slide-in relative z-10 flex h-[100dvh] w-[min(19.5rem,86vw)] max-w-full flex-col border-r border-border/80 bg-[linear-gradient(180deg,rgba(251,253,251,0.99),rgba(236,245,239,0.98))] shadow-[0_24px_64px_rgba(14,30,20,0.24)]"
              >
                <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Menu
                    </p>
                    <p className="font-display text-[1.15rem] font-semibold tracking-tight text-foreground">
                      {isStaffOrAdmin ? "STABS Console" : "STABS Menu"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11 w-11 px-0"
                    aria-label="Close mobile menu"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-4.5 w-4.5" />
                  </Button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                  <div className="grid gap-2 pt-2">
                    {role ? (
                      <>
                        {account ? (
                          <div className="flex items-center gap-3 rounded-[1rem] border border-emerald-900/12 bg-white/84 px-3 py-3">
                            <HeaderAccountMenu
                              name={account.name}
                              email={account.email}
                              avatarUrl={account.avatarUrl}
                              role={role}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                            </div>
                          </div>
                        ) : null}

                        {workspaceLinks.length > 0 ? (
                          <div className="space-y-2 pt-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Section Menu
                            </p>
                            <nav className="grid gap-2">
                              {workspaceLinks.map((item) => {
                                const active = pathname === item.href || item.matchHrefs?.includes(pathname);
                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href as Route}
                                    prefetch
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                      "flex min-h-11 items-center rounded-[0.95rem] border px-3.5 text-sm font-medium transition-[transform,background-color,border-color,color] duration-150 hover:-translate-y-[1px]",
                                      active
                                        ? "border-primary/20 bg-primary/10 text-primary font-semibold shadow-sm"
                                        : "border-emerald-900/12 bg-white/84 text-emerald-950 hover:bg-emerald-950/6"
                                    )}
                                  >
                                    {item.label}
                                  </Link>
                                );
                              })}
                            </nav>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Link href="/sign-in" prefetch onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="secondary" className="min-h-11 w-full justify-center text-sm">
                            Sign in
                          </Button>
                        </Link>
                        <Link href="/sign-up" prefetch onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="min-h-11 w-full justify-center text-sm">
                            Create account
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </aside>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}
