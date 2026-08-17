import Link from "next/link";
import { BriefcaseBusiness, KeyRound, ShieldCheck, UserRound } from "lucide-react";

import { DashboardNav } from "@/components/site/dashboard-nav";
import { workspaceNavByRole } from "@/components/site/workspace-nav-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const roleLabelByRole = {
  user: "tourist",
  staff: "staff",
  admin: "admin"
} as const;

export function DashboardShell({
  role,
  title,
  description,
  children
}: {
  role: "user" | "staff" | "admin";
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const nav = workspaceNavByRole[role];
  const RoleIcon =
    role === "admin" ? ShieldCheck : role === "staff" ? BriefcaseBusiness : UserRound;
  const roleLabel = roleLabelByRole[role];

  if (role === "admin") {
    return (
      <div className="page-shell py-4 sm:py-5">
        <div className="grid gap-4 xl:grid-cols-[15.5rem,minmax(0,1fr)] xl:items-start">
          <aside className="sticky top-24 hidden overflow-hidden rounded-[1.2rem] border border-border/70 bg-card shadow-[0_14px_34px_rgba(22,74,47,0.07)] xl:block">
            <div className="border-b border-border/70 bg-[linear-gradient(145deg,rgba(22,74,47,0.1),rgba(255,255,255,0.9))] p-4">
              <Badge className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </Badge>
              <p className="mt-3 font-display text-xl font-semibold tracking-tight">Admin console</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Manage accounts, bookings, and payouts.
              </p>
            </div>
            <div className="p-3">
              <DashboardNav items={nav} variant="sidebar" />
            </div>
            <div className="border-t border-border/70 p-3">
              <Link href="/auth/set-password" prefetch>
                <Button variant="outline" size="sm" className="min-h-10 w-full justify-start">
                  <KeyRound className="h-4 w-4" />
                  Change password
                </Button>
              </Link>
            </div>
          </aside>

          <main className="min-w-0 space-y-4">
            <header className="rounded-[1.2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(232,243,235,0.92))] p-4 shadow-[0_10px_28px_rgba(22,74,47,0.055)] sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Administration
                  </div>
                  <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-[1.8rem]">
                    {title}
                  </h1>
                  <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>

                <div className="flex flex-col gap-2 min-[420px]:flex-row xl:hidden">
                  <DashboardNav items={nav} />
                  <Link href="/auth/set-password" prefetch>
                    <Button variant="outline" size="sm" className="min-h-11 w-full min-[420px]:w-auto">
                      <KeyRound className="h-4 w-4" />
                      Change password
                    </Button>
                  </Link>
                </div>
              </div>
            </header>

            <div className="min-w-0 space-y-4">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  if (role === "staff") {
    return (
      <div className="page-shell space-y-4 py-4 sm:space-y-4.5 sm:py-5">
        <div className="relative overflow-hidden rounded-[1.35rem] border border-emerald-900/20 shadow-[0_16px_40px_rgba(14,38,24,0.15)]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: "url('/assets/developerpictures/bg.jpeg')" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(4,22,14,0.86)_0%,rgba(6,32,20,0.82)_55%,rgba(14,48,32,0.92)_100%)] backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.22),transparent_60%)]" />

          <div className="relative p-4 text-white sm:p-5 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-2">
                <Badge className="inline-flex items-center gap-1.5 border-white/20 bg-white/16 text-white backdrop-blur-md">
                  <RoleIcon className="h-3.5 w-3.5" />
                  {roleLabel}
                </Badge>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[0.95rem] border border-white/22 bg-white/14 text-emerald-300 backdrop-blur-md">
                    <RoleIcon className="h-4.5 w-4.5" />
                  </span>
                  <h1 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-[1.65rem]">
                    {title}
                  </h1>
                </div>
                <p className="text-xs leading-5 text-emerald-100/90 sm:text-sm sm:leading-6">
                  {description}
                </p>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
                <DashboardNav items={nav} />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3 sm:space-y-[1.125rem]">{children}</div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-3 py-4 sm:space-y-3.5 sm:py-5">
      <div className="panel p-3 sm:p-3.5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <Badge className="inline-flex items-center gap-1.5">
                <RoleIcon className="h-3.5 w-3.5" />
                {roleLabel}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-border/70 bg-secondary/65 text-primary">
                  <RoleIcon className="h-4 w-4" />
                </span>
                <p className="font-display text-[1rem] font-semibold tracking-tight sm:text-[1.18rem]">
                  {title}
                </p>
              </div>
              <p className="max-w-3xl text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                {description}
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <DashboardNav items={nav} />
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-3 sm:space-y-[1.125rem]">{children}</div>
    </div>
  );
}
