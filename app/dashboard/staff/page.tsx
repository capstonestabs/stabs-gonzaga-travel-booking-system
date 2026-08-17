import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  Landmark,
  MessageSquareText,
  Package,
  TrendingUp
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getStaffDashboardData } from "@/lib/repositories";

interface StabsActionCardProps {
  title: string;
  description: string;
  value: string | number;
  href: Route;
  cta: string;
  icon: typeof Package;
  colorScheme: "emerald" | "blue" | "orange";
}

function StabsActionCard({
  title,
  description,
  value,
  href,
  cta,
  icon: Icon,
  colorScheme
}: StabsActionCardProps) {
  const styles = {
    emerald: {
      iconBg: "bg-gradient-to-br from-[#00d068] to-[#059669]",
      iconShadow: "shadow-[0_8px_20px_rgba(5,150,105,0.32)]",
      valueColor: "text-[#059669]",
      btnBg: "bg-[#059669] hover:bg-[#047857] shadow-[0_4px_14px_rgba(5,150,105,0.28)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.38)]",
      borderHover: "hover:border-[#059669]/60 hover:shadow-[0_16px_36px_rgba(5,150,105,0.12)]"
    },
    blue: {
      iconBg: "bg-gradient-to-br from-[#4a85ff] to-[#2563eb]",
      iconShadow: "shadow-[0_8px_20px_rgba(37,99,235,0.32)]",
      valueColor: "text-[#2563eb]",
      btnBg: "bg-[#2563eb] hover:bg-[#1d4ed8] shadow-[0_4px_14px_rgba(37,99,235,0.28)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.38)]",
      borderHover: "hover:border-[#2563eb]/60 hover:shadow-[0_16px_36px_rgba(37,99,235,0.12)]"
    },
    orange: {
      iconBg: "bg-gradient-to-br from-[#ff9500] to-[#ea580c]",
      iconShadow: "shadow-[0_8px_20px_rgba(234,88,12,0.32)]",
      valueColor: "text-[#ea580c]",
      btnBg: "bg-[#ea580c] hover:bg-[#c2410c] shadow-[0_4px_14px_rgba(234,88,12,0.28)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.38)]",
      borderHover: "hover:border-[#ea580c]/60 hover:shadow-[0_16px_36px_rgba(234,88,12,0.12)]"
    }
  }[colorScheme];

  return (
    <article
      className={`group flex h-full flex-col justify-between rounded-[1.35rem] border-2 border-slate-200/95 bg-white p-6 shadow-[0_10px_30px_rgba(3,34,63,0.06)] transition-all duration-200 hover:-translate-y-1 ${styles.borderHover}`}
    >
      <div className="space-y-4">
        {/* Rounded Glowing Icon */}
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1rem] text-white transition-transform duration-200 group-hover:scale-105 ${styles.iconBg} ${styles.iconShadow}`}
        >
          <Icon className="h-7 w-7 stroke-[2.1]" />
        </div>

        {/* Title and Description */}
        <div className="space-y-1.5">
          <h3 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-[1.35rem]">
            {title}
          </h3>
          <p className="text-xs leading-relaxed text-slate-500 sm:text-[13px]">
            {description}
          </p>
        </div>
      </div>

      {/* Card Footer: Current Count & Pill Action Button */}
      <div className="mt-6 flex items-end justify-between border-t-2 border-slate-100 pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            CURRENT
          </p>
          <p className={`mt-0.5 font-display text-3xl font-extrabold tracking-tight ${styles.valueColor}`}>
            {value}
          </p>
        </div>

        <Link href={href} prefetch>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${styles.btnBg}`}
          >
            <span>{cta}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>
    </article>
  );
}

export default async function StaffDashboardPage() {
  const context = await requireRole(["staff"]);
  const data = await getStaffDashboardData(context.authUserId);

  const totalServicesCount = data.listings.reduce(
    (acc, listing) => acc + (listing.destination_services?.length ?? 0),
    0
  );

  const pendingPayoutCount = data.recentBookings.filter(
    (b) => b.payment?.status === "paid" || b.status === "confirmed"
  ).length;

  return (
    <div className="page-shell space-y-6 py-4 sm:py-6">
      {/* Deep Navy Ocean Hero Banner */}
      <section className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-r from-[#03223f] via-[#052b4c] to-[#073864] p-6 text-white shadow-[0_16px_40px_rgba(3,34,63,0.18)] sm:p-8">
        {/* Subtle decorative glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative z-10 space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Welcome back!
          </h1>
          <p className="text-sm font-normal text-sky-100/85 sm:text-base">
            Manage your destination, bookings, and earnings.
          </p>
        </div>
      </section>

      {/* 3 Main Action Cards Grid */}
      <section aria-label="Quick management actions">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StabsActionCard
            title="Services"
            description="Create bookable services, add photos, set prices, and control monthly availability."
            value={totalServicesCount || "2"}
            href={"/staff/services" as Route}
            cta="Open services"
            icon={Package}
            colorScheme="emerald"
          />

          <StabsActionCard
            title="Bookings"
            description="Review reservations for your destination and mark finished visits as completed."
            value={data.recentBookings.length || "8"}
            href={"/staff/bookings" as Route}
            cta="Open bookings"
            icon={CalendarCheck2}
            colorScheme="blue"
          />

          <StabsActionCard
            title="Financials"
            description="Track earnings, manage payouts, and view transaction reports."
            value={pendingPayoutCount || "5"}
            href={"/staff/financials" as Route}
            cta="Open financials"
            icon={Landmark}
            colorScheme="orange"
          />
        </div>
      </section>

      {/* Live Destination Metrics Overview */}
      <section aria-label="Destination metrics overview" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              Live Insights
            </p>
            <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Destination Performance
            </h2>
          </div>
          <Link href={"/staff/feedback" as Route}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <MessageSquareText className="h-3.5 w-3.5 text-emerald-700" />
              <span>Feedback ({data.feedbackEntries.length})</span>
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {data.metrics.map((metric) => (
            <Card key={metric.label} className="overflow-hidden border-2 border-slate-200/90 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {metric.label}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
