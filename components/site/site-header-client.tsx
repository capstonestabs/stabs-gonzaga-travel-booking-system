"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";

import { SignOutButton } from "@/components/site/sign-out-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { blueprintLogo } from "@/lib/blueprint";
import { cn } from "@/lib/utils";

export function SiteHeaderClient({
  role
}: {
  role: "user" | "staff" | "admin" | null;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const scenicPaths = new Set(["/", "/destinations", "/feedback"]);
  const isScenicPage = scenicPaths.has(pathname);
  const panelHref = role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/account";
  const panelLabel =
    role === "user"
      ? "Tourist dashboard"
      : role === "admin"
        ? "Admin workspace"
        : "Staff workspace";
  const panelCompactLabel =
    role === "user" ? "Dashboard" : role === "admin" ? "Admin" : "Staff";
  const mobileLinks = [
    { href: "/", label: "Home" },
    { href: "/destinations", label: "Destinations" },
    { href: "/feedback", label: "Feedback" }
  ] as const;
  const mobilePrimaryHref = (role ? panelHref : "/sign-in") as Route;
  const mobilePrimaryLabel = role ? panelCompactLabel : "Sign in";

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "z-50",
        isScenicPage
          ? "absolute inset-x-0 top-0 bg-[linear-gradient(180deg,rgba(4,18,12,0.56)_0%,rgba(4,18,12,0.22)_55%,transparent_100%)]"
          : "sticky top-0 border-b border-emerald-950/10 bg-[linear-gradient(135deg,rgba(244,250,246,0.98),rgba(224,239,229,0.96))] shadow-[0_14px_30px_rgba(19,69,45,0.08)] backdrop-blur"
      )}
    >
      <div
        className={cn(
          isScenicPage
            ? "page-shell pt-3.5 sm:pt-5 lg:pt-6"
            : "page-shell py-2.5"
        )}
      >
        <div
          className={cn(
            "grid min-h-[3.5rem] gap-2.5 sm:gap-4 lg:grid-cols-[auto,1fr,auto] lg:items-center",
            isScenicPage ? "px-0 py-0" : ""
          )}
        >
          <div className="flex min-w-0 items-center justify-between gap-3 lg:contents">
          <Link href="/" prefetch className="flex min-w-0 items-center gap-2.5 transition-transform duration-150 hover:-translate-y-[1px] sm:gap-3">
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

          <div className="flex items-center gap-2 lg:hidden">
            <Link href={mobilePrimaryHref} prefetch className="min-w-0">
              <Button
                variant={isScenicPage ? "outline" : "secondary"}
                size="sm"
                className={cn(
                  "min-h-11 min-w-[5.5rem] px-3 text-sm",
                  isScenicPage
                    ? "border-white/16 bg-white/12 text-white hover:bg-white/16 hover:text-white"
                    : undefined
                )}
              >
                {mobilePrimaryLabel}
              </Button>
            </Link>
            <Button
              type="button"
              variant={isScenicPage ? "outline" : "outline"}
              size="sm"
                className={cn(
                  "h-11 w-11 shrink-0",
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
          </div>

          <div className="hidden min-w-0 items-center justify-center gap-4 lg:flex">
            <nav
              className={cn(
                "flex min-w-0 items-center gap-5 text-sm font-semibold",
                isScenicPage ? "text-white/95" : "text-emerald-950/82"
              )}
            >
              {mobileLinks.map((item) => (
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
                    <span className="sm:hidden">{panelCompactLabel}</span>
                    <span className="hidden sm:inline">{panelLabel}</span>
                  </Button>
                </Link>
                <SignOutButton
                  variant={isScenicPage ? "outline" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 w-full min-w-0 px-3 text-xs sm:h-10 sm:w-auto sm:px-4 sm:text-sm",
                    isScenicPage
                      ? "border-white/16 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                      : "text-emerald-950 hover:bg-emerald-950/8"
                  )}
                />
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

        {isMobileMenuOpen ? (
          <div
            className={cn(
              "mt-3 grid gap-3 rounded-[1.15rem] border p-3 shadow-[0_22px_44px_rgba(11,30,20,0.16)] lg:hidden",
              isScenicPage
                ? "border-white/14 bg-[linear-gradient(180deg,rgba(6,24,17,0.78),rgba(6,24,17,0.66))] backdrop-blur-md"
                : "border-emerald-900/12 bg-[linear-gradient(180deg,rgba(247,251,248,0.96),rgba(231,242,235,0.96))] backdrop-blur-sm"
            )}
          >
            <form
              action="/destinations"
              method="get"
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-[0.95rem] border px-3 py-2",
                isScenicPage
                  ? "border-white/14 bg-black/16"
                  : "border-emerald-900/12 bg-white/86"
              )}
            >
              <Search
                className={cn(
                  "h-4 w-4 shrink-0",
                  isScenicPage ? "text-white/84" : "text-muted-foreground"
                )}
              />
              <Input
                name="q"
                placeholder="Search destinations"
                aria-label="Search destinations"
                className={cn(
                  "h-9 min-w-0 flex-1 border-0 px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:shadow-none",
                  isScenicPage
                    ? "bg-transparent text-white placeholder:text-white/76"
                    : "bg-transparent text-emerald-950 placeholder:text-emerald-900/55"
                )}
              />
              <Button
                type="submit"
                size="sm"
                className={cn(
                  "min-h-9 shrink-0 rounded-[0.85rem] px-3",
                  isScenicPage
                    ? "bg-white text-primary hover:bg-white/92"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
              </Button>
            </form>

            <nav className="grid gap-2">
              {mobileLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "flex min-h-11 items-center rounded-[0.95rem] border px-3 text-sm font-medium transition-[transform,background-color,border-color,color] duration-150 hover:-translate-y-[1px]",
                    isScenicPage
                      ? "border-white/14 bg-black/12 text-white hover:bg-white/10"
                      : "border-emerald-900/12 bg-white/82 text-emerald-950 hover:bg-emerald-950/6"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="grid gap-2 sm:grid-cols-2">
              {role ? (
                <>
                  <Link href={panelHref as Route} prefetch>
                    <Button
                      variant={isScenicPage ? "outline" : "secondary"}
                      className={cn(
                        "min-h-11 w-full justify-center text-sm",
                        isScenicPage
                          ? "border-white/16 bg-white text-primary hover:bg-white/90"
                          : "border-emerald-900/12 bg-white/84 text-emerald-950 hover:bg-white"
                      )}
                    >
                      {panelLabel}
                    </Button>
                  </Link>
                  <SignOutButton
                    variant={isScenicPage ? "outline" : "outline"}
                    className={cn(
                      "min-h-11 w-full justify-center text-sm",
                      isScenicPage
                        ? "border-white/16 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                        : "text-emerald-950 hover:bg-emerald-950/8"
                    )}
                  />
                </>
              ) : (
                <>
                  <Link href="/sign-in" prefetch>
                    <Button
                      variant={isScenicPage ? "outline" : "secondary"}
                      className={cn(
                        "min-h-11 w-full justify-center text-sm",
                        isScenicPage
                          ? "border-white/16 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                          : "border-emerald-900/12 bg-white/84 text-emerald-950 hover:bg-white"
                      )}
                    >
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/sign-up" prefetch>
                    <Button
                      className={cn(
                        "min-h-11 w-full justify-center text-sm",
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
        ) : null}
      </div>
    </header>
  );
}
