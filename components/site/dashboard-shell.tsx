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
    <div className="page-shell grid items-start grid-cols-[7rem,minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[7.5rem,minmax(0,1fr)] sm:gap-3.5 sm:py-5 min-[480px]:grid-cols-[8.5rem,minmax(0,1fr)] xl:grid-cols-[13.5rem,minmax(0,1fr)] 2xl:grid-cols-[14.5rem,minmax(0,1fr)]">
      <aside className="min-w-0 w-full justify-self-start sticky top-24 self-start">
        <div className="panel p-2.5 sm:p-3">
          <div className="mb-3 border-b border-border/70 pb-3">
            <Badge className="inline-flex items-center gap-1.5">
              <RoleIcon className="h-3.5 w-3.5" />
              {roleLabel}
            </Badge>
          </div>

          <DashboardNav items={nav} />

          {role === "admin" ? (
            <div className="mt-3 border-t border-border/70 pt-3">
              <Link href="/auth/set-password" prefetch>
                <Button variant="outline" size="sm" className="min-h-11 w-full">
                  <KeyRound className="h-4 w-4" />
                  Change password
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 space-y-3 sm:space-y-[1.125rem]">
        <div className="panel p-3 sm:p-3.5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-border/70 bg-secondary/65 text-primary">
                <RoleIcon className="h-4 w-4" />
              </span>
              <p className="font-display text-[1rem] font-semibold tracking-tight sm:text-[1.18rem]">
                {title}
              </p>
            </div>
            <p className="text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
              {description}
            </p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
