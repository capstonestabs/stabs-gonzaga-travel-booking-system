import type { Route } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Landmark,
  ShieldCheck,
  TrendingUp,
  Wallet
} from "lucide-react";

import { DashboardShell } from "@/components/site/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getStaffDashboardData } from "@/lib/repositories";
import { formatCurrency } from "@/lib/utils";

export default async function StaffFinancialsPage() {
  const context = await requireRole(["staff"]);
  const data = await getStaffDashboardData(context.authUserId);

  const confirmedBookings = data.recentBookings.filter(
    (booking) => booking.status === "confirmed" || booking.status === "completed"
  );

  const totalEarnings = confirmedBookings.reduce(
    (sum, booking) => sum + Number(booking.total_amount ?? 0),
    0
  );

  return (
    <DashboardShell
      role="staff"
      title="Financials & Payouts"
      description="Track earnings, view pending payout status, and monitor completed destination transactions."
    >
      <div className="space-y-6">
        {/* Top Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="overflow-hidden border-2 border-slate-200/90 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Confirmed Value
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {formatCurrency(totalEarnings)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                From {confirmedBookings.length} confirmed & completed reservations
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2 border-slate-200/90 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payout Status
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock3 className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {data.metrics[1]?.value ?? "₱0.00"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {data.metrics[1]?.helper ?? "Settlement processed by admin"}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2 border-slate-200/90 shadow-sm sm:col-span-2 lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Destination Payout
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Landmark className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Direct Settlement
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Processed according to Gonzaga municipal tourism guidelines
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction & Booking Table */}
        <Card className="overflow-hidden border-2 border-slate-200/90 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Recent Booking Transactions
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Paid guest reservations associated with your destination services
                </p>
              </div>
              <Link href={"/staff/bookings" as Route}>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  View all bookings
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {confirmedBookings.length === 0 ? (
              <div className="py-12 text-center">
                <Wallet className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700">No transactions recorded yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  When travelers book and pay for your destination services, records will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {confirmedBookings.map((booking) => {
                  const serviceName =
                    booking.service_snapshot?.title ||
                    booking.destination_snapshot?.title ||
                    "Destination Service";

                  return (
                    <div
                      key={booking.id}
                      className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                          <DollarSign className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{serviceName}</p>
                            <Badge
                              variant={booking.status === "completed" ? "success" : "default"}
                              className="text-[10px]"
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {booking.contact_name || "Guest"} • {booking.guest_count} guest(s) •{" "}
                            {booking.service_date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <p className="text-sm font-bold text-slate-900 sm:text-base">
                          {formatCurrency(Number(booking.total_amount ?? 0))}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Paid via {booking.payment?.payment_method_type || "Online"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
