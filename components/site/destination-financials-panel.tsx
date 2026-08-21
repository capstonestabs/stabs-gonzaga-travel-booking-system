"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ImageOff, ReceiptText, Search, UserRound, Wallet } from "lucide-react";

import { AdminBatchSettlementPanel } from "@/components/forms/admin-batch-settlement-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressiveList } from "@/components/ui/progressive-list";
import { formatServiceTypeLabel } from "@/lib/service-types";
import type { FinancialRecord } from "@/lib/types";
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

type StatusFilter = "all" | "settled" | "pending";
type GroupSort = "gross-desc" | "gross-asc" | "bookings-desc" | "bookings-asc";

const groupSortOptions: { value: GroupSort; label: string }[] = [
  { value: "gross-desc", label: "Highest gross" },
  { value: "gross-asc", label: "Lowest gross" },
  { value: "bookings-desc", label: "Most bookings" },
  { value: "bookings-asc", label: "Least bookings" }
];

function buildServiceGroups(records: FinancialRecord[]): ServiceGroup[] {
  const groups = new Map<string, ServiceGroup>();

  for (const record of records) {
    const serviceTitle = record.service_snapshot?.title ?? "Standard service";
    const serviceType = formatServiceTypeLabel(record.service_snapshot?.service_type, {
      category: record.destination_category
    });
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

/**
 * Full financial breakdown for a single destination: cover photo, summary
 * totals, an optional destination-wide settlement action, then a filterable,
 * sortable, per-service list of bookings with tourist avatars and service
 * photos. Used by Admin's Destination Financials detail page (readOnly
 * false, settlement enabled) and Staff's Financials page (readOnly true,
 * view only).
 */
export function DestinationFinancialsPanel({
  destinationTitle,
  records,
  readOnly = false,
  serviceImagesByServiceId = {},
  touristAvatarsByUserId = {},
  destinationCoverUrl = null
}: {
  destinationTitle: string;
  records: FinancialRecord[];
  readOnly?: boolean;
  serviceImagesByServiceId?: Record<string, string | null>;
  touristAvatarsByUserId?: Record<string, string | null>;
  destinationCoverUrl?: string | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [groupSort, setGroupSort] = useState<GroupSort>("gross-desc");

  const serviceGroups = useMemo(() => buildServiceGroups(records), [records]);
  const totalGross = records.reduce((sum, record) => sum + record.amount, 0);
  const settledAmount = records
    .filter((record) => record.settlement_status === "settled")
    .reduce((sum, record) => sum + record.amount, 0);
  const unsettledAmount = totalGross - settledAmount;
  const unsettledRecords = records.filter((record) => record.settlement_status !== "settled");

  function matchesFilters(record: FinancialRecord) {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesSearch = !normalizedQuery || record.tourist_name.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "settled" ? record.settlement_status === "settled" : record.settlement_status !== "settled");
    return matchesSearch && matchesStatus;
  }

  const displayedGroups = useMemo(() => {
    const withFilteredRecords = serviceGroups
      .map((group) => ({
        ...group,
        displayedRecords: group.records.filter(matchesFilters)
      }))
      .filter((group) => group.displayedRecords.length > 0);

    const sorted = [...withFilteredRecords];
    switch (groupSort) {
      case "gross-desc":
        return sorted.sort((a, b) => b.totalGross - a.totalGross);
      case "gross-asc":
        return sorted.sort((a, b) => a.totalGross - b.totalGross);
      case "bookings-desc":
        return sorted.sort((a, b) => b.records.length - a.records.length);
      case "bookings-asc":
        return sorted.sort((a, b) => a.records.length - b.records.length);
      default:
        return sorted;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceGroups, searchQuery, statusFilter, groupSort]);

  if (records.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-5 text-sm text-muted-foreground">
          No paid bookings recorded yet for this destination.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3.5">
      {destinationCoverUrl ? (
        <div className="flex items-center gap-3.5 rounded-[1.1rem] border border-border/70 bg-card/90 p-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[0.85rem] bg-muted">
            <img src={destinationCoverUrl} alt={destinationTitle} className="h-full w-full object-cover" />
          </div>
          <p className="min-w-0 truncate font-display text-lg font-semibold tracking-tight text-foreground">
            {destinationTitle}
          </p>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="inline-flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Financial summarysss
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-3 sm:p-3.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Gross paid</p>
              <p className="mt-1.5 font-display text-[1.35rem] font-semibold tracking-tight text-foreground">
                {formatCurrency(totalGross)}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {records.length} booking{records.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-3 sm:p-3.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Settled payout</p>
              <p className="mt-1.5 font-display text-[1.35rem] font-semibold tracking-tight text-foreground">
                {formatCurrency(settledAmount)}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">Already paid out</p>
            </div>
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-3 sm:p-3.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Pending payout</p>
              <p className="mt-1.5 font-display text-[1.35rem] font-semibold tracking-tight text-foreground">
                {formatCurrency(unsettledAmount)}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {unsettledRecords.length} booking{unsettledRecords.length === 1 ? "" : "s"} pending
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{totalGross > 0 ? Math.round((settledAmount / totalGross) * 100) : 0}% settled</span>
              <span>{totalGross > 0 ? Math.round((unsettledAmount / totalGross) * 100) : 0}% pending</span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${totalGross > 0 ? (settledAmount / totalGross) * 100 : 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!readOnly && unsettledRecords.length > 0 ? (
        <AdminBatchSettlementPanel
          recordIds={unsettledRecords.map((record) => record.id)}
          serviceLabel={destinationTitle}
          destinationTitle={destinationTitle}
          bookingCount={unsettledRecords.length}
          grossAmount={unsettledRecords.reduce((sum, record) => sum + record.amount, 0)}
          title="Destination payout"
          subtitle={`${unsettledRecords.length} unsettled booking${
            unsettledRecords.length === 1 ? "" : "s"
          } across all services in ${destinationTitle}`}
          toggleLabel="Settle destination payout"
          submitLabel="Payout all services"
          helperText="Record one payout for every unsettled booking under this destination. Once saved, all of those rows move to payout history automatically."
        />
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <CardTitle>Services &amp; bookings</CardTitle>
          <p className="text-sm text-muted-foreground">
            {readOnly
              ? "See which services generated these bookings and their payout status."
              : "Open a service group to review its bookings and record payouts where needed."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search tourist name..."
                aria-label="Search by tourist name"
                className="pl-9"
              />
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              {(["all", "settled", "pending"] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    statusFilter === status
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Sort
            </span>
            {groupSortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGroupSort(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  groupSort === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {displayedGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings match your filters.</p>
          ) : (
            <ProgressiveList
              initialCount={4}
              step={3}
              maxHeightClass="max-h-[min(60vh,32rem)]"
              showMoreLabel="Show more services"
              showLessLabel="Show fewer services"
            >
              {displayedGroups.map((serviceGroup) => (
                <details
                  key={serviceGroup.key}
                  className="group rounded-[0.95rem] border border-border/70 bg-card/90"
                >
                  <summary className="list-none cursor-pointer p-3 sm:p-3.5">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[0.7rem] bg-muted">
                        {serviceImagesByServiceId[serviceGroup.records[0]?.service_snapshot?.id ?? ""] ? (
                          <img
                            src={serviceImagesByServiceId[serviceGroup.records[0]?.service_snapshot?.id ?? ""]!}
                            alt={serviceGroup.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageOff className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/35 text-muted-foreground">
                        <ChevronDown className="h-4 w-4 group-open:hidden" />
                        <ChevronUp className="hidden h-4 w-4 group-open:block" />
                      </span>
                      <div className="grid min-w-0 flex-1 gap-2 min-[520px]:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr),repeat(3,minmax(0,0.72fr))]">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{serviceGroup.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {serviceGroup.serviceType} / {serviceGroup.displayedRecords.length} booking
                            {serviceGroup.displayedRecords.length === 1 ? "" : "s"} shown
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Gross</p>
                          <p className="mt-1 text-sm font-medium">{formatCurrency(serviceGroup.totalGross)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Bookings</p>
                          <p className="mt-1 text-sm font-medium">{serviceGroup.records.length}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Pending payout</p>
                          <p className="mt-1 text-sm font-medium">{formatCurrency(serviceGroup.unsettledGross)}</p>
                          <p className="text-xs text-muted-foreground">
                            {serviceGroup.unsettledRecords.length} pending
                          </p>
                        </div>
                      </div>
                    </div>
                  </summary>

                  <div className="space-y-2.5 border-t border-border/70 px-3 pb-3 pt-3">
                    {!readOnly && serviceGroup.unsettledRecords.length > 0 ? (
                      <AdminBatchSettlementPanel
                        recordIds={serviceGroup.unsettledRecords.map((record) => record.id)}
                        serviceLabel={serviceGroup.title}
                        destinationTitle={destinationTitle}
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
                          {serviceGroup.unsettledRecords.length === 0
                            ? "All bookings in this service are already settled."
                            : "Payout pending for this service."}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {serviceGroup.unsettledRecords.length === 0
                            ? "These rows already belong in payout history."
                            : "Admin will record this payout."}
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
                        {serviceGroup.displayedRecords.map((record) => (
                          <div
                            key={record.id}
                            className="rounded-[0.9rem] border border-border/70 bg-muted/15 p-3"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/70 bg-secondary/65">
                                  {touristAvatarsByUserId[record.user_id] ? (
                                    <img
                                      src={touristAvatarsByUserId[record.user_id]!}
                                      alt={record.tourist_name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center text-primary">
                                      <UserRound className="h-4 w-4" />
                                    </span>
                                  )}
                                </span>
                                <div className="min-w-0 space-y-0.5">
                                  <p className="truncate font-medium text-foreground">{record.tourist_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {record.service_date} / {record.payment_method_type ?? "gcash"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                                <p className="text-lg font-semibold text-foreground">
                                  {formatCurrency(record.amount)}
                                </p>
                                {!readOnly ? (
                                  <Link href={`/admin/financials/${record.id}` as Route}>
                                    <span className="inline-flex h-10 min-w-28 items-center justify-center rounded-[0.9rem] border border-border/80 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50">
                                      <ReceiptText className="mr-2 h-4 w-4" />
                                      Review
                                    </span>
                                  </Link>
                                ) : null}
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
                                  {record.settlement_status === "settled" ? "Payout settled" : "Pending payout"}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}