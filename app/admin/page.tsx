import type { Route } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Landmark,
  PieChart as PieChartIcon,
  PlusCircle,
  Users,
  UsersRound
} from "lucide-react";
import { TrendingUp, Trophy } from "lucide-react";
import { BookingOverviewChart } from "@/components/site/booking-overview-chart";
import { BookingStatusDonut } from "@/components/site/booking-status-donut";
import { MonthlyRevenueChart } from "@/components/site/monthly-revenue-chart";
import { RecentActivityFeed } from "@/components/site/recent-activity-feed";
import { TopDestinationsList } from "@/components/site/top-destinations-list";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { DateRangePicker } from "@/components/site/date-range-picker";
import { MetricCard } from "@/components/site/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import {
  buildBookingStatusBreakdown,
  getAdminDashboardData,
  getAdminOverviewMetrics,
  getMonthlyRevenueSeries,
  getRecentActivity
} from "@/lib/repositories";
import { formatDateKey } from "@/lib/utils";

const quickActions = [
  { href: "/admin/staff/create", label: "Create staff", helper: "Add a destination manager", icon: PlusCircle },
  { href: "/admin/staff", label: "Staff accounts", helper: "Manage staff access", icon: Users },
  { href: "/admin/tourists", label: "Tourists", helper: "Review traveler accounts", icon: UsersRound },
  { href: "/admin/financials", label: "Financials", helper: "Record destination payouts", icon: Landmark }
] as const;

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireRole(["admin"]);

  const params = await searchParams;
  const today = new Date();
  const defaultTo = formatDateKey(today);
  const defaultFrom = formatDateKey(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()));
  const from = params.from ?? defaultFrom;
  const to = params.to ?? defaultTo;

  const [data, overviewMetrics, monthlyRevenue, recentActivity] = await Promise.all([
    getAdminDashboardData(),
    getAdminOverviewMetrics({ from: params.from, to: params.to }),
    getMonthlyRevenueSeries(6),
    getRecentActivity(8)
  ]);

  const bookingStatusBreakdown = buildBookingStatusBreakdown(data.bookingActivity);

  return (
    <DashboardShell
      role="admin"
      title="Overview"
      description=""
    >
      <section aria-labelledby="admin-overview-metrics" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="admin-overview-metrics" className="mt-1 font-display text-xl font-semibold">Welcome back, Admin!👋🏼</h2>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Monitor the overall performance of STABS.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="muted">Live data</Badge>
            <DateRangePicker defaultFrom={from} defaultTo={to} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {overviewMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 2xl:grid-cols-2">
        <BookingOverviewChart data={data.bookingActivitySeries} />

        <Card className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-3.5">
            <CardTitle className="inline-flex items-center gap-2">
              Top Destinations
            </CardTitle>

            <Link
              href={"/admin/destination-financials" as Route}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="flex-1 px-3.5 pb-3.5">
            <TopDestinationsList destinations={data.destinationRevenue} />
          </div>
        </Card>
      </div>

      <section aria-labelledby="admin-live-analytics" className="space-y-3">
        {/* <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Analytics</p>
          <h2 id="admin-live-analytics" className="mt-1 font-display text-xl font-semibold">
            Bookings, revenue &amp; activity
          </h2>
        </div> */}

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader className="border-b border-border/70 py-4">
              <CardTitle className="inline-flex items-center gap-2">
                {/* <PieChartIcon className="h-5 w-5 text-primary" /> */}
                Booking Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              <BookingStatusDonut breakdown={bookingStatusBreakdown} />
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader className="border-b border-border/70 py-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="inline-flex items-center gap-2">
                  {/* <BarChart3 className="h-5 w-5 text-primary" /> */}
                  Monthly Revenue
                </CardTitle>
                <Link
                  href={"/admin/destination-financials" as Route}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View report
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              <MonthlyRevenueChart data={monthlyRevenue} />
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader className="border-b border-border/70 py-4">
              <CardTitle className="inline-flex items-center gap-2">
                {/* <Activity className="h-5 w-5 text-primary" /> */}
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 max-h-[320px]">
              <RecentActivityFeed activity={recentActivity} />
            </CardContent>
          </Card>
        </div>
      </section>

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