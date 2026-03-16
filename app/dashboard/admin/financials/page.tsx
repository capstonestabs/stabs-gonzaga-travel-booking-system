import type { Route } from "next";
import Link from "next/link";
import { ChevronDown, ChevronUp, FolderClock, Landmark, ReceiptText, Wallet } from "lucide-react";

import { AdminBatchSettlementPanel } from "@/components/forms/admin-batch-settlement-panel";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressiveList } from "@/components/ui/progressive-list";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/repositories";
import type { DashboardMetric, FinancialRecord } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type ServiceGroup = {
  key: string;
  title: string;
  serviceType: string;
  records: FinancialRecord[];
  totalGross: number;
  unsettledGross: number;
  unsettledRecords: FinancialRecord[];
};

function FinancialMetricBlock({ metric }: { metric: DashboardMetric }) {
  return (
    <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-3 sm:p-3.5">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {metric.label}
      </p>
      <p className="mt-1.5 font-display text-[1.35rem] font-semibold tracking-tight text-foreground">
        {metric.value}
      </p>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{metric.helper}</p>
    </div>
  );
}

function buildServiceGroups(records: FinancialRecord[]) {
  const groups = new Map<string, ServiceGroup>();

  for (const record of records) {
    const serviceTitle = record.service_snapshot?.title ?? "Standard service";
    const serviceType = record.service_snapshot?.service_type ?? "standard";
    const key = `${record.service_snapshot?.id ?? serviceTitle}:${serviceType}`;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.records.push(record);
      existingGroup.totalGross += record.amount;
      if (record.settlement_status !== "settled") {
        existingGroup.unsettledGross += record.amount;
        existingGroup.unsettledRecords.push(record);
      }
      continue;
    }

    groups.set(key, {
      key,
      title: serviceTitle,
      serviceType,
      records: [record],
      totalGross: record.amount,
      unsettledGross: record.settlement_status === "settled" ? 0 : record.amount,
      unsettledRecords: record.settlement_status === "settled" ? [] : [record]
    });
  }

  return Array.from(groups.values()).sort((left, right) => right.totalGross - left.totalGross);
}

export default async function AdminFinancialsPage() {
  await requireRole(["admin"]);

  const data = await getAdminDashboardData();
  const activeDestinationSummaries = data.destinationRevenue.filter(
    (summary) => summary.unsettled_amount > 0
  );

  return (
    <DashboardShell
      role="admin"
      title="Platform financials"
      description="Open a destination first, then manage its services and booking payouts in one organized workspace."
    >
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="inline-flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                Financial summary
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Full paid amounts collected through the platform, grouped for quick payout review.
              </p>
            </div>
            <Link href={"/admin/financials/history" as Route}>
              <Button variant="outline" size="sm">
                <FolderClock className="h-4 w-4" />
                Open payout history
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {data.financialMetrics.map((metric) => (
            <FinancialMetricBlock key={metric.label} metric={metric} />
          ))}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="inline-flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Destination payout workspace
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Open a destination, review each service group, and record payouts only where action is still needed.
          </p>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {activeDestinationSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No destination payouts are waiting right now. Review settled records on the payout history page.
            </p>
          ) : (
          <ProgressiveList
            initialCount={4}
            step={3}
            maxHeightClass="max-h-[min(72vh,40rem)]"
            showMoreLabel="Show more destinations"
            showLessLabel="Show fewer destinations"
          >
          {activeDestinationSummaries.map((summary) => {
            const destinationRecords = data.financialRecords.filter(
              (record) =>
                record.destination_id === summary.destination_id &&
                record.settlement_status !== "settled"
            );
            const serviceGroups = buildServiceGroups(destinationRecords);
            const unsettledDestinationRecords = destinationRecords.filter(
              (record) => record.settlement_status !== "settled"
            );

            return (
              <details
                key={summary.destination_id}
                className="group rounded-[0.95rem] border border-border/70 bg-card/90"
              >
                <summary className="list-none cursor-pointer p-3 sm:p-3.5">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-muted/35 text-muted-foreground">
                        <ChevronDown className="h-4 w-4 group-open:hidden" />
                        <ChevronUp className="hidden h-4 w-4 group-open:block" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-[1.15rem] font-semibold tracking-tight text-foreground">
                          {summary.destination_title}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {summary.destination_location_text}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Staff: {summary.staff_name ?? "No staff name"} / {serviceGroups.length} service
                          {serviceGroups.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 min-[520px]:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-[0.85rem] border border-border/70 bg-muted/22 px-3 py-2.5">
                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                          Gross paid
                        </p>
                        <p className="mt-1 font-medium">{formatCurrency(summary.total_paid_amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {summary.booking_count} booking{summary.booking_count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="rounded-[0.85rem] border border-border/70 bg-muted/22 px-3 py-2.5">
                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                          Settled payout
                        </p>
                        <p className="mt-1 font-medium">{formatCurrency(summary.settled_amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          Pending {formatCurrency(summary.unsettled_amount)}
                        </p>
                      </div>
                      <div className="rounded-[0.85rem] border border-border/70 bg-muted/22 px-3 py-2.5">
                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                          Service groups
                        </p>
                        <p className="mt-1 font-medium">{serviceGroups.length}</p>
                        <p className="text-xs text-muted-foreground">
                          Expand to review each service
                        </p>
                      </div>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-border/70 px-3.5 pb-3.5 pt-3">
                  <div className="space-y-2.5">
                    {unsettledDestinationRecords.length > 0 ? (
                      <AdminBatchSettlementPanel
                        recordIds={unsettledDestinationRecords.map((record) => record.id)}
                        serviceLabel={summary.destination_title}
                        destinationTitle={summary.destination_title}
                        bookingCount={unsettledDestinationRecords.length}
                        grossAmount={unsettledDestinationRecords.reduce(
                          (sum, record) => sum + record.amount,
                          0
                        )}
                        title="Destination payout"
                        subtitle={`${unsettledDestinationRecords.length} unsettled booking${
                          unsettledDestinationRecords.length === 1 ? "" : "s"
                        } across all services in ${summary.destination_title}`}
                        toggleLabel="Settle destination payout"
                        submitLabel="Payout all services"
                        helperText="Record one payout for every unsettled booking under this destination. Once saved, all of those rows move to payout history automatically."
                      />
                    ) : (
                      <div className="rounded-[0.95rem] border border-border/70 bg-secondary/22 p-3">
                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                          Destination payout
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          All services in this destination are already settled.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Only history review remains for this destination.
                        </p>
                      </div>
                    )}

                    <ProgressiveList
                      initialCount={4}
                      step={3}
                      maxHeightClass="max-h-[min(54vh,26rem)]"
                      showMoreLabel="Show more services"
                      showLessLabel="Show fewer services"
                    >
                    {serviceGroups.map((serviceGroup) => (
                      <details
                        key={serviceGroup.key}
                        className="group rounded-[0.9rem] border border-border/70 bg-muted/18"
                      >
                        <summary className="list-none cursor-pointer p-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/75 text-muted-foreground">
                              <ChevronDown className="h-4 w-4 group-open:hidden" />
                              <ChevronUp className="hidden h-4 w-4 group-open:block" />
                            </span>
                            <div className="grid min-w-0 flex-1 gap-2 min-[520px]:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr),repeat(3,minmax(0,0.72fr))]">
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">{serviceGroup.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {serviceGroup.serviceType} / {serviceGroup.records.length} booking
                                  {serviceGroup.records.length === 1 ? "" : "s"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                                  Gross
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                  {formatCurrency(serviceGroup.totalGross)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                                  Payout rows
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                  {serviceGroup.records.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Ready to review
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                                  Pending payout
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                  {formatCurrency(serviceGroup.unsettledGross)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {serviceGroup.unsettledRecords.length} booking
                                  {serviceGroup.unsettledRecords.length === 1 ? "" : "s"} pending
                                </p>
                              </div>
                            </div>
                          </div>
                        </summary>

                        <div className="space-y-2.5 border-t border-border/70 px-3 pb-3 pt-3">
                          {serviceGroup.unsettledRecords.length > 0 ? (
                            <AdminBatchSettlementPanel
                              recordIds={serviceGroup.unsettledRecords.map((record) => record.id)}
                              serviceLabel={serviceGroup.title}
                              destinationTitle={summary.destination_title}
                              bookingCount={serviceGroup.unsettledRecords.length}
                              grossAmount={serviceGroup.unsettledRecords.reduce(
                                (sum, record) => sum + record.amount,
                                0
                              )}
                              toggleLabel="Settle service payout"
                              submitLabel="Payout this service"
                            />
                          ) : (
                            <div className="rounded-[0.95rem] border border-border/70 bg-secondary/22 p-3">
                              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                                Service payout
                              </p>
                              <p className="mt-1 text-sm font-medium text-foreground">
                                All bookings in this service are already settled.
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                These rows already belong in payout history.
                              </p>
                            </div>
                          )}

                          <div className="rounded-[0.85rem] border border-border/70 bg-card/85 p-2 sm:p-2.5">
                            <ProgressiveList
                              initialCount={6}
                              step={6}
                              maxHeightClass="max-h-[min(46vh,19rem)]"
                              itemsClassName="space-y-2"
                              showMoreLabel="Show more bookings"
                              showLessLabel="Show fewer bookings"
                            >
                              {serviceGroup.records.map((record) => (
                                <div
                                  key={record.id}
                                  className="rounded-[0.9rem] border border-border/70 bg-muted/15 p-3"
                                >
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 space-y-1">
                                      <p className="truncate font-medium text-foreground">
                                        {record.tourist_name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {record.service_date} / {record.payment_method_type ?? "gcash"}
                                      </p>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                                      <p className="text-lg font-semibold text-foreground">
                                        {formatCurrency(record.amount)}
                                      </p>
                                      <Link href={`/admin/financials/${record.id}` as Route}>
                                        <span className="inline-flex h-10 min-w-28 items-center justify-center rounded-[0.9rem] border border-border/80 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50">
                                          <ReceiptText className="mr-2 h-4 w-4" />
                                          Review
                                        </span>
                                      </Link>
                                    </div>
                                  </div>

                                  <div className="grid gap-2 min-[540px]:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-[0.8rem] border border-border/65 bg-card/90 px-3 py-2.5">
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        Guests
                                      </p>
                                      <p className="mt-1 text-sm text-foreground">
                                        {record.guest_count} guest{record.guest_count === 1 ? "" : "s"}
                                      </p>
                                    </div>
                                    <div className="rounded-[0.8rem] border border-border/65 bg-card/90 px-3 py-2.5">
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        Ticket
                                      </p>
                                      <p className="mt-1 truncate text-sm text-foreground">
                                        {record.ticket_code ?? "Pending"}
                                      </p>
                                    </div>
                                    <div className="rounded-[0.8rem] border border-border/65 bg-card/90 px-3 py-2.5">
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        Paid
                                      </p>
                                      <p className="mt-1 text-sm text-foreground">
                                        {new Date(record.paid_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="rounded-[0.8rem] border border-border/65 bg-card/90 px-3 py-2.5">
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        Status
                                      </p>
                                      <p
                                        className={cn(
                                          "mt-1 text-sm font-medium",
                                          record.settlement_status === "settled"
                                            ? "text-emerald-700"
                                            : "text-amber-700"
                                        )}
                                      >
                                        {record.settlement_status === "settled"
                                          ? "Payout settled"
                                          : "Pending payout"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </ProgressiveList>
                          </div>
                        </div>
                      </details>
                    ))}
                    </ProgressiveList>
                  </div>
                </div>
              </details>
            );
          })}
          </ProgressiveList>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Payout history lives on its own page</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Archived rows stay out of the active workspace so this page only shows what still needs payout attention.
              </p>
            </div>
            <Link href={"/admin/financials/history" as Route}>
              <Button variant="outline" size="sm">
                <FolderClock className="h-4 w-4" />
                Open payout history
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full border border-border/70 bg-muted/35 p-2 text-muted-foreground">
              <FolderClock className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-foreground">Keep the active page lean</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The history page holds archived settled records and permanent delete actions so the
                current payout page stays focused on what still needs work.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
