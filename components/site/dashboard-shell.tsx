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
        {/* <header className="rounded-[1.2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(232,243,235,0.92))] p-4 shadow-[0_10px_28px_rgba(22,74,47,0.055)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
          
              <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-[1.8rem]">
                Welcome back, Admin!👋
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
        </header> */}

        <div className="mt-4 min-w-0 space-y-4">{children}</div>
      </div>
    );
  }

  if (role === "staff") {
    return (
      <div className="page-shell py-4 sm:py-5">
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
