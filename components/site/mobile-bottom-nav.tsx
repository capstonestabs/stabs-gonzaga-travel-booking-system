"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  Compass,
  FolderClock,
  Landmark,
  LayoutGrid,
  Package,
  ShieldCheck,
  Ticket,
  UserCheck,
  UserRound,
  UsersRound
} from "lucide-react";

import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  role: "user" | "staff" | "admin" | null;
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();

  // If not logged in, show tourist explore navigation
  if (!role) {
    const publicItems = [
      { href: "/" as Route, label: "Home", icon: Compass },
      { href: "/destinations" as Route, label: "Destinations", icon: Package },
      { href: "/sign-in" as Route, label: "Sign in", icon: UserRound }
    ];

    return (
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {publicItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-center transition-all duration-200",
                  isActive
                    ? "font-semibold text-emerald-700"
                    : "text-slate-500 hover:text-slate-900 active:scale-95"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-transform",
                    isActive ? "bg-emerald-50 text-emerald-700" : ""
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  if (role === "staff") {
    const staffItems = [
      { href: "/staff" as Route, label: "Dashboard", icon: LayoutGrid, exact: true },
      { href: "/staff/services" as Route, label: "Services", icon: Package },
      { href: "/staff/bookings" as Route, label: "Bookings", icon: CalendarCheck2 },
      { href: "/staff/financials" as Route, label: "Financials", icon: Landmark },
      { href: "/staff/account" as Route, label: "Profile", icon: UserRound }
    ];

    return (
      <nav
        aria-label="Staff Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto flex max-w-lg items-center justify-between">
          {staffItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href || pathname === "/dashboard/staff"
              : pathname.startsWith(item.href) || pathname.startsWith(`/dashboard${item.href}`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-center transition-all duration-200 active:scale-95",
                  isActive
                    ? "font-semibold text-emerald-700"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "scale-105 bg-emerald-50 text-emerald-600 shadow-sm"
                      : "group-hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.4]" : "stroke-[1.8]")} />
                </div>
                <span
                  className={cn(
                    "text-[10px] tracking-tight transition-colors",
                    isActive ? "font-semibold text-emerald-700" : "font-normal text-slate-500"
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -top-1.5 h-1 w-6 rounded-full bg-emerald-600 shadow-[0_1px_4px_rgba(5,150,105,0.4)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  if (role === "admin") {
    const adminItems = [
      { href: "/admin" as Route, label: "Overview", icon: ShieldCheck, exact: true },
      { href: "/admin/financials" as Route, label: "Financials", icon: Landmark },
      { href: "/admin/staff" as Route, label: "Staff", icon: UserCheck },
      { href: "/admin/tourists" as Route, label: "Tourists", icon: UsersRound },
      { href: "/profile" as Route, label: "Profile", icon: UserRound }
    ];

    return (
      <nav
        aria-label="Admin Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto flex max-w-lg items-center justify-between">
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href || pathname === "/dashboard/admin"
              : pathname.startsWith(item.href) || pathname.startsWith(`/dashboard${item.href}`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-center transition-all duration-200 active:scale-95",
                  isActive
                    ? "font-semibold text-emerald-700"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "scale-105 bg-emerald-50 text-emerald-600 shadow-sm"
                      : "group-hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.4]" : "stroke-[1.8]")} />
                </div>
                <span
                  className={cn(
                    "text-[10px] tracking-tight transition-colors",
                    isActive ? "font-semibold text-emerald-700" : "font-normal text-slate-500"
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -top-1.5 h-1 w-6 rounded-full bg-emerald-600 shadow-[0_1px_4px_rgba(5,150,105,0.4)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Tourist user
  const userItems = [
    { href: "/account" as Route, label: "Overview", icon: LayoutGrid, exact: true },
    { href: "/account/current" as Route, label: "Bookings", icon: CalendarCheck2 },
    { href: "/account/tickets" as Route, label: "Tickets", icon: Ticket },
    { href: "/account/history" as Route, label: "History", icon: FolderClock },
    { href: "/profile" as Route, label: "Profile", icon: UserRound }
  ];

  return (
    <nav
      aria-label="Tourist Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-center justify-between">
        {userItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-center transition-all duration-200 active:scale-95",
                isActive
                  ? "font-semibold text-emerald-700"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                  isActive
                    ? "scale-105 bg-emerald-50 text-emerald-600 shadow-sm"
                    : "group-hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.4]" : "stroke-[1.8]")} />
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight transition-colors",
                  isActive ? "font-semibold text-emerald-700" : "font-normal text-slate-500"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-1.5 h-1 w-6 rounded-full bg-emerald-600 shadow-[0_1px_4px_rgba(5,150,105,0.4)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
