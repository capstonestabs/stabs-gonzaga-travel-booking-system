import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, CalendarCheck2, Landmark, Package, UsersRound } from "lucide-react";

import { DateRangePicker } from "@/components/site/date-range-picker";
import { TasksRemindersPanel } from "@/components/site/tasks-reminders-panel";
import { requireRole } from "@/lib/auth";
import { getStaffDashboardData } from "@/lib/repositories";
import { formatDateKey, formatCurrency } from "@/lib/utils";
import { CheckCircle2, Hourglass, XCircle } from "lucide-react";
import { getStaffBookingsSummary } from "@/lib/repositories";

interface OverviewCardProps {
  title: string;
  subtitle: string;
  href: Route;
  cta: string;
  icon: typeof Package;
  iconBg: string;
  iconColor: string;
  primary: { label: string; value: string };
  secondary?: { label: string; value: string };
  breakdown?: { label: string; value: string | number; badgeClass: string }[];
}
function TodaysSummaryItem({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  caption
}: {
  icon: typeof CalendarCheck2;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="text-xs text-slate-400">{caption}</p>
      </div>
    </div>
  );
}
function OverviewCard({
  title,
  subtitle,
  href,
  cta,
  icon: Icon,
  iconBg,
  iconColor,
  primary,
  secondary,
  breakdown
}: OverviewCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-slate-400">{primary.label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{primary.value}</p>
      </div>

      {secondary ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400">{secondary.label}</p>
          <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{secondary.value}</p>
        </div>
      ) : null}

      {breakdown?.length ? (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          {breakdown.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{row.label}</span>
              <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${row.badgeClass}`}>{row.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        <Link
          href={href}
          prefetch
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
function statusBadge(status: "pending_payment" | "confirmed" | "completed" | "cancelled") {
  switch (status) {
    case "pending_payment":
      return { label: "Pending", className: "bg-amber-50 text-amber-700" };
    case "confirmed":
      return { label: "Confirmed", className: "bg-emerald-50 text-emerald-700" };
    case "completed":
      return { label: "Completed", className: "bg-slate-100 text-slate-600" };
    case "cancelled":
      return { label: "Declined", className: "bg-rose-50 text-rose-700" };
  }
}

function formatBookingDate(iso: string) {
  const date = new Date(iso);
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  };
} 
export default async function StaffDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const context = await requireRole(["staff"]);
  const params = await searchParams;
  const data = await getStaffDashboardData(context.authUserId, { from: params.from, to: params.to });
  const bookingsSummary = await getStaffBookingsSummary(context.authUserId);
  const { overview } = data;

  const today = formatDateKey(new Date());

  return (
    <div className="page-shell space-y-3 py-4 sm:py-4">
      <section
        className="dashboard-fade-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ animationDelay: "0ms" }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, Staff! Here&apos;s what&apos;s happening today.</p>
        </div>

        <DateRangePicker defaultFrom={params.from ?? today} defaultTo={params.to ?? today} />
      </section>

      <section aria-label="Overview metrics" className="dashboard-fade-in" style={{ animationDelay: "60ms" }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewCard
            title="Financials"
            subtitle="Today's Collection"
            href={"/staff/financials" as Route}
            cta="View Financials"
            icon={Landmark}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            primary={{ label: "Today", value: formatCurrency(overview.collectedAmount) }}
            secondary={{ label: "Pending payout", value: formatCurrency(overview.pendingPayoutAmount) }}
          />

          <OverviewCard
            title="Tourists"
            subtitle="Total Tourists"
            href={"/staff/bookings" as Route}
            cta="View Tourists"
            icon={UsersRound}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            primary={{ label: "Total", value: String(overview.touristsCount) }}
            breakdown={[
              { label: "From confirmed", value: overview.bookingsConfirmed, badgeClass: "bg-emerald-50 text-emerald-700" },
              { label: "From pending", value: overview.bookingsPending, badgeClass: "bg-amber-50 text-amber-700" }
            ]}
          />

          <OverviewCard
            title="Bookings"
            subtitle="Total Bookings"
            href={"/staff/bookings" as Route}
            cta="View Bookings"
            icon={CalendarCheck2}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
            primary={{ label: "Total", value: String(overview.bookingsTotal) }}
            breakdown={[
              { label: "Pending", value: overview.bookingsPending, badgeClass: "bg-amber-50 text-amber-700" },
              { label: "Confirmed", value: overview.bookingsConfirmed, badgeClass: "bg-emerald-50 text-emerald-700" },
              { label: "Cancelled", value: overview.bookingsCancelled, badgeClass: "bg-rose-50 text-rose-700" }
            ]}
          />

          <OverviewCard
            title="Services"
            subtitle="Total Services"
            href={"/staff/services" as Route}
            cta="Open Services"
            icon={Package}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            primary={{ label: "Total", value: String(overview.servicesTotal) }}
          />
        </div>
      </section>

      {/* Todays Summary */}

      <section
        aria-label="Today's summary"
        className="dashboard-fade-in rounded-xl border border-slate-200 bg-white p-5"
        style={{ animationDelay: "120ms" }}
      >
        <h2 className="text-sm font-semibold text-slate-900">Today&apos;s summary</h2>
        <div className="mt-4 grid grid-cols-2 gap-y-5 border-t border-slate-100 pt-4 sm:grid-cols-4 sm:divide-x sm:divide-slate-100">
          <div className="sm:pr-5">
            <TodaysSummaryItem
              icon={CalendarCheck2}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="New Bookings"
              value={data.todaySummary.newBookings}
              caption="Today"
            />
          </div>
          <div className="sm:px-5">
            <TodaysSummaryItem
              icon={CheckCircle2}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="Confirmed"
              value={data.todaySummary.confirmed}
              caption="Today"
            />
          </div>
          <div className="sm:px-5">
            <TodaysSummaryItem
              icon={Hourglass}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              label="Pending"
              value={data.todaySummary.pending}
              caption="Ongoing"
            />
          </div>
          <div className="sm:pl-5">
            <TodaysSummaryItem
              icon={XCircle}
              iconBg="bg-rose-50"
              iconColor="text-rose-600"
              label="Declined"
              value={data.todaySummary.declined}
              caption="Today"
            />
          </div>
        </div>
      </section>

      {/* Recent Bookings */}
      <section
        aria-label="Bookings overview"
        className="dashboard-fade-in grid gap-4 lg:grid-cols-2"
        style={{ animationDelay: "180ms" }}
      >       
       <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Bookings</h2>
            <Link href={"/staff/bookings" as Route} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              View all
            </Link>
          </div>

          <div className="mt-3 -mx-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-y border-slate-100 text-slate-400">
                  <th className="px-5 py-2 font-medium">Booking ID</th>
                  <th className="px-2 py-2 font-medium">Service / Package</th>
                  <th className="px-2 py-2 font-medium">Guest</th>
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingsSummary.recent.map((row) => {
                  const badge = statusBadge(row.status);
                  const { date, time } = formatBookingDate(row.serviceDate);
                  return (
                    <tr key={row.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-semibold text-emerald-700">{row.displayCode}</td>
                      <td className="px-2 py-3">
                        <p className="font-medium text-slate-800">{row.destinationTitle}</p>
                        {row.serviceTitle ? <p className="text-slate-400">({row.serviceTitle})</p> : null}
                      </td>
                      <td className="px-2 py-3 text-slate-700">{row.guestName}</td>
                      <td className="px-2 py-3 text-slate-700">
                        <p>{date}</p>
                        <p className="text-slate-400">{time}</p>
                      </td>
                      <td className="px-2 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${badge?.className}`}>
                          {badge?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-400">
              Showing 1 to {bookingsSummary.recent.length} of {bookingsSummary.recentTotal} bookings
            </p>
            <Link
              href={"/staff/bookings" as Route}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming Bookings</h2>
            <Link href={"/staff/bookings" as Route} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              View all
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-50">
            {bookingsSummary.upcoming.map((row) => {
              const badge = statusBadge(row.status);
              const { date, time } = formatBookingDate(row.serviceDate);
              return (
                <div key={row.id} className="flex items-center gap-3 py-3">
                  {row.imageUrl ? (
                    <img src={row.imageUrl} alt={row.destinationTitle} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-lg bg-slate-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{row.destinationTitle}</p>
                    <p className="truncate text-xs text-slate-500">{row.guestName}</p>
                    <p className="text-xs text-slate-400">
                      {date} &bull; {time}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${badge?.className}`}>
                    {badge?.label}
                  </span>
                </div>
              );
            })}
          </div>

          <Link
            href={"/staff/bookings" as Route}
            className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-emerald-600 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            <CalendarDays className="h-4 w-4" />
            View calendar
          </Link>
        </div>
      </section>

      <div className="dashboard-fade-in" style={{ animationDelay: "240ms" }}>
        <TasksRemindersPanel tasks={data.tasks ?? []} />
      </div>
    </div>
  );
}