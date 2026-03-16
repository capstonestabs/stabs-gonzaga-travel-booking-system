import Link from "next/link";
import { BriefcaseBusiness, KeyRound, ShieldCheck, UserRound } from "lucide-react";

import { DashboardNav, type DashboardNavIconName } from "@/components/site/dashboard-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navByRole = {
  user: [
    { href: "/account", label: "Overview", icon: "overview" },
    { href: "/account/current", label: "Current bookings", icon: "bookings" },
    { href: "/account/tickets", label: "Ticket wallet", icon: "tickets" },
    { href: "/account/history", label: "Booking history", icon: "history" },
    { href: "/profile", label: "Account settings", icon: "account", matchHrefs: ["/account/profile"] }
  ],
  staff: [
    { href: "/staff", label: "Overview", icon: "overview" },
    { href: "/staff/destination", label: "Destination", icon: "destination" },
    { href: "/staff/services", label: "Services", icon: "services" },
    { href: "/staff/bookings", label: "Bookings", icon: "bookings" },
    { href: "/staff/feedback", label: "Feedback", icon: "feedback" },
    { href: "/staff/account", label: "Account", icon: "account" }
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: "overview" },
    { href: "/admin/financials", label: "Financials", icon: "financials" },
    { href: "/admin/financials/history", label: "Payout history", icon: "history" },
    { href: "/admin/staff", label: "Staff", icon: "staff" },
    { href: "/admin/tourists", label: "Tourists", icon: "tourists" },
    { href: "/admin/staff/create", label: "Create staff", icon: "create" }
  ]
} satisfies Record<
  "user" | "staff" | "admin",
  Array<{ href: string; label: string; icon: DashboardNavIconName; matchHrefs?: string[] }>
>;

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
  const nav = navByRole[role];
  const RoleIcon =
    role === "admin" ? ShieldCheck : role === "staff" ? BriefcaseBusiness : UserRound;
  const roleLabel = roleLabelByRole[role];

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
              {role === "admin" ? (
                <Link href="/auth/set-password" prefetch>
                  <Button variant="outline" size="sm" className="min-h-11 w-full sm:w-auto">
                    <KeyRound className="h-4 w-4" />
                    Change password
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-3 sm:space-y-[1.125rem]">{children}</div>
    </div>
  );
}
