"use client";

import type { Route } from "next";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, Search, X } from "lucide-react";

import { HeaderAccountMenu } from "@/components/site/header-account-menu";
import { workspaceNavByRole, type WorkspaceNavItem } from "@/components/site/workspace-nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scenicPaths = new Set(["/", "/destinations", "/feedback"]);
  const isScenicPage = scenicPaths.has(pathname);
  const panelHref = role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/account";
  const panelLabel =
    role === "user"
      ? "Tourist dashboard"
      : role === "admin"
        ? "Admin workspace"
        : "Staff workspace";
  const desktopLinks = [
    { href: "/", label: "Home" },
    { href: "/destinations", label: "Destinations" },
    { href: "/feedback", label: "Feedback" }
  ] as const;
  const drawerPrimaryLinks = role
    ? [
        { href: "/", label: "Home" },
        { href: panelHref, label: "Dashboard" },
        { href: "/destinations", label: "Destinations" },
        { href: "/feedback", label: "Feedback" }
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/destinations", label: "Destinations" },
        { href: "/feedback", label: "Feedback" }
      ];
  const workspaceLinks = useMemo<WorkspaceNavItem[]>(
    () =>
      role
        ? workspaceNavByRole[role].filter((item) => item.href !== panelHref)
        : [],
    [panelHref, role]
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
      <div className={cn(isScenicPage ? "page-shell pt-3.5 sm:pt-5 lg:pt-6" : "page-shell py-2.5")}>
        <div
          className={cn(
            "grid min-h-[3.5rem] gap-2.5 sm:gap-4 lg:grid-cols-[auto,1fr,auto] lg:items-center",
            isScenicPage ? "px-0 py-0" : ""
          )}
        >
          <div className="flex min-w-0 items-center gap-3 lg:contents">
            <div className="lg:hidden">
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
            </div>

            <Link
              href="/"
              prefetch
              className="flex min-w-0 flex-1 items-center gap-2.5 transition-transform duration-150 hover:-translate-y-[1px] sm:gap-3 lg:flex-none"
            >
              <img
                src={blueprintLogo}
                alt="Gonzaga Travel Bookings logo"
                className="h-8 w-8 shrink-0 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.22)] sm:h-12 sm:w-12"
              />
              <div className="min-w-0 max-[359px]:max-w-[9.75rem]">
                <p
                  className={cn(
                    "font-display text-[0.88rem] font-semibold tracking-tight sm:text-[1.15rem]",
                    isScenicPage ? "text-white" : "text-emerald-950"
                  )}
                  style={isScenicPage ? { textShadow: "0 4px 18px rgba(0,0,0,0.48)" } : undefined}
                >
                  STABS
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

            <div className="lg:hidden">
              {role && account ? (
                <HeaderAccountMenu
                  name={account.name}
                  email={account.email}
                  avatarUrl={account.avatarUrl}
                  scenic={isScenicPage}
                />
              ) : (
                <Link href={"/sign-in" as Route} prefetch>
                  <Button
                    variant={isScenicPage ? "outline" : "secondary"}
                    size="sm"
                    className={cn(
                      "min-h-11 px-3 text-sm",
                      isScenicPage
                        ? "border-white/16 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                        : "border-emerald-900/12 bg-white/84 text-emerald-950 hover:bg-white"
                    )}
                  >
                    Sign in
                  </Button>
                </Link>
              )}
            </div>

            <div className="hidden min-w-0 items-center justify-center gap-4 lg:flex">
              <nav
                className={cn(
                  "flex min-w-0 items-center gap-5 text-sm font-semibold",
                  isScenicPage ? "text-white/95" : "text-emerald-950/82"
                )}
              >
                {desktopLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    className={cn(
                      "transition-[color,transform] duration-150 hover:-translate-y-[1px]",
                      isScenicPage ? "hover:text-white" : "hover:text-emerald-950"
                    )}
                    style={isScenicPage ? { textShadow: "0 2px 14px rgba(0,0,0,0.34)" } : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <form
                action="/destinations"
                method="get"
                className={cn(
                  "flex w-full max-w-[18rem] items-center gap-2 rounded-full px-3 py-1.5",
                  isScenicPage
                    ? "border border-white/30 bg-black/24 shadow-[0_14px_28px_rgba(0,0,0,0.18)] backdrop-blur-md"
                    : "border border-emerald-900/12 bg-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                )}
              >
                <Search
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isScenicPage ? "text-white" : "text-muted-foreground"
                  )}
                />
                <Input
                  name="q"
                  placeholder="Search destinations"
                  aria-label="Search destinations"
                  className={cn(
                    "h-7 min-w-0 flex-1 border-0 px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:shadow-none",
                    isScenicPage
                      ? "bg-transparent text-white placeholder:text-white/88"
                      : "bg-transparent text-emerald-950 placeholder:text-emerald-900/50"
                  )}
                />
                <Button
                  type="submit"
                  size="sm"
                  className={cn(
                    "h-8 min-h-8 w-8 shrink-0 rounded-full px-0",
                    isScenicPage
                      ? "bg-white text-primary hover:bg-white/92"
                      : "bg-primary text-primary-foreground"
                  )}
                  aria-label="Search destinations"
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>

            <div className="hidden min-w-0 lg:flex lg:flex-wrap lg:items-center lg:justify-end lg:gap-2.5 xl:gap-3">
              {role ? (
                <>
                  <Link href={panelHref as Route} prefetch className="min-w-0 sm:flex-none">
                    <Button
                      variant={isScenicPage ? "outline" : "secondary"}
                      size="sm"
                      className={cn(
                        "h-9 w-full min-w-0 px-3 text-xs sm:h-10 sm:w-auto sm:px-4 sm:text-sm",
                        isScenicPage
                          ? "border-white/16 bg-white text-primary hover:bg-white/90"
                          : "border-emerald-900/12 bg-white/84 text-emerald-950 hover:bg-white"
                      )}
                    >
                      {panelLabel}
                    </Button>
                  </Link>
                  {account ? (
                    <HeaderAccountMenu
                      name={account.name}
                      email={account.email}
                      avatarUrl={account.avatarUrl}
                      scenic={isScenicPage}
                    />
                  ) : null}
                </>
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
      </div>

      {isMobileMenuOpen && isMounted
        ? createPortal(
            <div className="dialog-overlay fixed inset-0 z-[130] lg:hidden">
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
                      Browse STABS
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
                  <form
                    action="/destinations"
                    method="get"
                    className="flex min-h-11 items-center gap-2 rounded-[0.95rem] border border-emerald-900/12 bg-white/86 px-3 py-2"
                  >
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                      name="q"
                      placeholder="Search destinations"
                      aria-label="Search destinations"
                      className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm text-emerald-950 shadow-none placeholder:text-emerald-900/55 focus-visible:ring-0 focus-visible:shadow-none"
                    />
                    <Button type="submit" size="sm" className="min-h-9 shrink-0 rounded-[0.85rem] px-3">
                      <Search className="h-3.5 w-3.5" />
                      <span>Search</span>
                    </Button>
                  </form>

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Quick links
                    </p>
                    <nav className="grid gap-2">
                      {drawerPrimaryLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href as Route}
                          prefetch
                          className="flex min-h-11 items-center rounded-[0.95rem] border border-emerald-900/12 bg-white/82 px-3 text-sm font-medium text-emerald-950 transition-[transform,background-color,border-color,color] duration-150 hover:-translate-y-[1px] hover:bg-emerald-950/6"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                  </div>

                  {role && workspaceLinks.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Current workspace
                      </p>
                      <nav className="grid gap-2">
                        {workspaceLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href as Route}
                            prefetch
                            className={cn(
                              "flex min-h-11 items-center rounded-[0.95rem] border px-3 text-sm font-medium transition-[transform,background-color,border-color,color] duration-150 hover:-translate-y-[1px]",
                              pathname === item.href || item.matchHrefs?.includes(pathname)
                                ? "border-primary/15 bg-primary/10 text-primary"
                                : "border-emerald-900/12 bg-white/82 text-emerald-950 hover:bg-emerald-950/6"
                            )}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </nav>
                    </div>
                  ) : null}

                  <div className="grid gap-2 border-t border-border/70 pt-4">
                    {role ? (
                      account ? (
                        <div className="flex items-center gap-3 rounded-[1rem] border border-emerald-900/12 bg-white/84 px-3 py-3">
                          <HeaderAccountMenu
                            name={account.name}
                            email={account.email}
                            avatarUrl={account.avatarUrl}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                          </div>
                        </div>
                      ) : null
                    ) : (
                      <>
                        <Link href="/sign-in" prefetch>
                          <Button variant="secondary" className="min-h-11 w-full justify-center text-sm">
                            Sign in
                          </Button>
                        </Link>
                        <Link href="/sign-up" prefetch>
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
