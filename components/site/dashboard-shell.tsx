import Link from "next/link";
import { BriefcaseBusiness, KeyRound, ShieldCheck } from "lucide-react";

import { DashboardNav, type DashboardNavIconName } from "@/components/site/dashboard-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navByRole = {
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
} satisfies Record<"staff" | "admin", Array<{ href: string; label: string; icon: DashboardNavIconName }>>;

export function DashboardShell({
  role,
  title,
  description,
  children
}: {
  role: "staff" | "admin";
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const nav = navByRole[role];
  const RoleIcon = role === "admin" ? ShieldCheck : BriefcaseBusiness;

  return (
    <div className="page-shell grid gap-4 py-4 sm:gap-5 sm:py-6 xl:grid-cols-[15.25rem,minmax(0,1fr)] 2xl:grid-cols-[16rem,minmax(0,1fr)]">
      <aside className="min-w-0 space-y-3 xl:sticky xl:top-24 xl:self-start">
        <div className="panel p-3.5 sm:p-4">
          <div className="space-y-2.5">
            <Badge className="inline-flex items-center gap-1.5">
              <RoleIcon className="h-3.5 w-3.5" />
              {role}
            </Badge>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-border/70 bg-secondary/65 text-primary">
                  <RoleIcon className="h-4 w-4" />
                </span>
                <p className="font-display text-[1.02rem] font-semibold tracking-tight sm:text-[1.18rem]">
                  {title}
                </p>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        <div className="panel p-3 sm:p-3.5">
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

      <div className="min-w-0 space-y-4 sm:space-y-5">{children}</div>
    </div>
  );
}
