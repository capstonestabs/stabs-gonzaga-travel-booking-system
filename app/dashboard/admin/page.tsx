import type { Route } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  CalendarCheck2,
  CircleDollarSign,
  Clock3,
  Landmark,
  PlusCircle,
  Users,
  UsersRound,
  Wallet
} from "lucide-react";

import { DashboardShell } from "@/components/site/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/repositories";
import type { DashboardMetric } from "@/lib/types";

function MetricTile({ metric, icon: Icon }: { metric: DashboardMetric; icon: LucideIcon }) {
  return (
    <article className="group rounded-[1rem] border border-border/70 bg-card p-4 shadow-[0_8px_22px_rgba(22,74,47,0.04)] transition hover:border-primary/20 hover:shadow-[0_12px_26px_rgba(22,74,47,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {metric.label}
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
            {metric.value}
          </p>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.helper}</p>
    </article>
  );
}

const quickActions = [
  { href: "/admin/staff/create", label: "Create staff", helper: "Add a destination manager", icon: PlusCircle },
  { href: "/admin/staff", label: "Staff accounts", helper: "Manage staff access", icon: Users },
  { href: "/admin/tourists", label: "Tourists", helper: "Review traveler accounts", icon: UsersRound },
  { href: "/admin/financials", label: "Financials", helper: "Record destination payouts", icon: Landmark }
] as const;

const EXCLUDED_METRIC_PATTERN = /destination|feedback/i;

function iconForHeadlineMetric(label: string): LucideIcon {
  if (/staff/i.test(label)) return Users;
  if (/tourist|traveler|user/i.test(label)) return UsersRound;
  if (/booking/i.test(label)) return CalendarCheck2;
  return CircleDollarSign;
}

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);

  const data = await getAdminDashboardData();
  const unsettledRecords = data.financialRecords.filter(
    (record) => record.settlement_status !== "settled"
  );
  const headlineMetrics = [
    ...data.metrics,
    data.financialMetrics[0]
  ].filter(
    (metric): metric is DashboardMetric => Boolean(metric) && !EXCLUDED_METRIC_PATTERN.test(metric.label)
  );

  return (
    <DashboardShell
      role="admin"
      title="Overview"
      description="Monitor the platform, resolve items that need attention, and open the right workspace quickly."
    >
      <section aria-labelledby="admin-overview-metrics" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Today&apos;s snapshot</p>
            <h2 id="admin-overview-metrics" className="mt-1 font-display text-xl font-semibold">Platform at a glance</h2>
          </div>
          <Badge variant="muted">Live data</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {headlineMetrics.map((metric) => (
            <MetricTile key={metric.label} metric={metric} icon={iconForHeadlineMetric(metric.label)} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr),21rem]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="inline-flex items-center gap-2">
                  <CalendarCheck2 className="h-5 w-5 text-primary" />
                  Booking activity
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Current reservation statuses across the platform.</p>
              </div>
              <Link href={"/admin/financials" as Route} className="hidden text-xs font-semibold text-primary hover:underline sm:inline-flex">
                View financials
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
            {data.bookingMetrics.map((metric, index) => {
              const Icon = [CalendarCheck2, Clock3, Wallet, Clock3][index] ?? CalendarCheck2;
              return <MetricTile key={metric.label} metric={metric} icon={Icon} />;
            })}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70 py-4">
            <CardTitle className="inline-flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Needs attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <Link
              href={"/admin/financials" as Route}
              className="flex items-center gap-3 rounded-[0.95rem] border border-amber-200 bg-amber-50/75 p-3 transition hover:border-amber-300"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-amber-100 text-amber-800">
                <Wallet className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-950">{unsettledRecords.length} payout{unsettledRecords.length === 1 ? "" : "s"} waiting</p>
                <p className="text-xs text-amber-800">{data.financialMetrics[2]?.value ?? "Review financials"}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-amber-800" />
            </Link>

            <Link
              href={"/admin/financials/history" as Route}
              className="flex items-center gap-3 rounded-[0.95rem] border border-border/70 bg-muted/25 p-3 transition hover:border-primary/20 hover:bg-muted/45"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-secondary text-primary">
                <Clock3 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{data.archivedFinancialRecordCount} archived payout{data.archivedFinancialRecordCount === 1 ? "" : "s"}</p>
                <p className="text-xs text-muted-foreground">Open payout history</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="admin-quick-actions" className="space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Shortcuts</p>
          <h2 id="admin-quick-actions" className="mt-1 font-display text-xl font-semibold">Common actions</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ href, label, helper, icon: Icon }) => (
            <Link
              key={href}
              href={href as Route}
              className="group flex items-center gap-3 rounded-[1rem] border border-border/70 bg-card p-3.5 transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_10px_24px_rgba(22,74,47,0.06)]"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{label}</p>
                <p className="truncate text-xs text-muted-foreground">{helper}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
