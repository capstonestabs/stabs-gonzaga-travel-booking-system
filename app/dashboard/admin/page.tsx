import type { Route } from "next";
import Link from "next/link";
import { AlertCircle, Clock3, Landmark, PlusCircle, Users, UsersRound } from "lucide-react";

import { AdminStaffList } from "@/components/site/admin-staff-list";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/repositories";
import type { DashboardMetric } from "@/lib/types";

function AdminStatBlock({ metric }: { metric: DashboardMetric }) {
  return (
    <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-3.5 sm:p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {metric.label}
      </p>
      <p className="mt-1.5 font-display text-[1.3rem] font-semibold tracking-tight text-foreground sm:text-[1.45rem]">
        {metric.value}
      </p>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{metric.helper}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);

  const data = await getAdminDashboardData();
  const unsettledRecords = data.financialRecords.filter(
    (record) => record.settlement_status !== "settled"
  );
  const archivedRecords = data.archivedFinancialRecordCount;

  return (
    <DashboardShell
      role="admin"
      title="Admin control"
      description="Keep the tourism workspace organized from here, then jump into the dedicated pages for payouts, staff accounts, tourist accounts, and payout history."
    >
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr),18rem]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <CardTitle>Platform snapshot</CardTitle>
            <p className="text-sm text-muted-foreground">
              A quick look at your active destinations, bookings, and platform totals.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[...data.metrics, ...data.financialMetrics.slice(0, 3)].map((metric) => (
              <AdminStatBlock key={metric.label} metric={metric} />
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <CardTitle>Quick links</CardTitle>
            <p className="text-sm text-muted-foreground">
              Open the pages you use most without crowding the overview.
            </p>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-1">
            <Link href={"/admin/staff/create" as Route}>
              <Button className="min-h-11 w-full justify-between">
                Create staff
                <PlusCircle className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={"/admin/staff" as Route}>
              <Button variant="secondary" className="min-h-11 w-full justify-between">
                Staff accounts
                <Users className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={"/admin/tourists" as Route}>
              <Button variant="secondary" className="min-h-11 w-full justify-between">
                Tourist accounts
                <UsersRound className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={"/admin/financials" as Route}>
              <Button variant="outline" className="min-h-11 w-full justify-between">
                Active financials
                <Landmark className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={"/admin/financials/history" as Route}>
              <Button variant="outline" className="min-h-11 w-full justify-between">
                Payout history
                <Clock3 className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <CardTitle>Booking flow</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track how bookings move from checkout to completed trips.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {data.bookingMetrics.map((metric) => (
              <AdminStatBlock key={metric.label} metric={metric} />
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Payout status</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keep unresolved payouts and archive history separate from the main dashboard.
                </p>
              </div>
              <Link href={"/admin/financials" as Route}>
                <Button variant="outline" size="sm">
                  Open financials
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[0.95rem] border border-border/70 bg-card/90 p-3.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Needs payout
              </p>
              <p className="mt-1.5 font-display text-[1.35rem] font-semibold tracking-tight text-foreground">
                {unsettledRecords.length}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Booking rows are still waiting for staff payout recording.
              </p>
            </div>
            <div className="rounded-[0.95rem] border border-border/70 bg-card/90 p-3.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                In payout history
              </p>
              <p className="mt-1.5 font-display text-[1.35rem] font-semibold tracking-tight text-foreground">
                {archivedRecords}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Archived rows stay out of the active payout workspace until deleted.
              </p>
            </div>
            <div className="rounded-[0.95rem] border border-border/70 bg-card/90 p-3.5 sm:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-foreground">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <p className="font-medium">Financial workspace now lives on its own page</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Open the financial area to view destinations first, then expand each destination to
                    manage its services and payout groups without loading the full payout UI here.
                  </p>
                </div>
                <Link href={"/admin/financials" as Route}>
                  <Button size="sm">Open payout workspace</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Staff accounts</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage destination managers and delete inactive staff from active access.
              </p>
            </div>
            <Link href={"/admin/staff" as Route}>
              <Button variant="outline" size="sm">
                View all staff
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <AdminStaffList
            staff={data.staff}
            listings={data.listings}
            limit={4}
            showViewAllLink
            emptyMessage="No staff accounts yet. Create the first staff account from the admin navigation."
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Tourist accounts</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Review active tourist accounts and delete access when a public account should no longer sign in.
              </p>
            </div>
            <Link href={"/admin/tourists" as Route}>
              <Button variant="outline" size="sm">
                View all tourists
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            {data.tourists.length} tourist account{data.tourists.length === 1 ? "" : "s"} currently active.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
