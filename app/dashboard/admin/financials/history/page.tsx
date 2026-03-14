import type { Route } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { AdminBulkDeleteFinancialRecordsButton } from "@/components/forms/admin-bulk-delete-financial-records-button";
import { AdminDeleteFinancialRecordButton } from "@/components/forms/admin-delete-financial-record-button";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressiveList } from "@/components/ui/progressive-list";
import { requireRole } from "@/lib/auth";
import { getArchivedAdminFinancialRecords } from "@/lib/repositories";
import { formatCurrency } from "@/lib/utils";

export default async function AdminFinancialHistoryPage() {
  await requireRole(["admin"]);

  const records = await getArchivedAdminFinancialRecords();
  const totalGross = records.reduce((sum, record) => sum + record.amount, 0);
  const allRecordIds = records.map((record) => record.id);

  const recordsByDestination = new Map<string, typeof records>();
  for (const record of records) {
    const group = recordsByDestination.get(record.destination_id) ?? [];
    group.push(record);
    recordsByDestination.set(record.destination_id, group);
  }

  return (
    <DashboardShell
      role="admin"
      title="Payout history"
      description="Archived settled payouts live here. Review them when needed, or delete them permanently from history."
    >
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Archived payout summary</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Settled rows move here automatically so the active payout page stays focused and lighter.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {records.length ? (
                <AdminBulkDeleteFinancialRecordsButton
                  recordIds={allRecordIds}
                  label="Delete all history"
                  title="Delete all payout history?"
                  description="Remove every archived payout row from admin history? These rows will no longer appear on the payout history page."
                  redirectTo={"/admin/financials/history"}
                />
              ) : null}
              <Link href={"/admin/financials" as Route}>
                <Button variant="outline" size="sm">
                  Back to active financials
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Archived payouts
            </p>
            <p className="mt-1.5 font-display text-[1.35rem] font-semibold tracking-tight">
              {records.length}
            </p>
          </div>
          <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Archived amount</p>
            <p className="mt-1.5 font-display text-[1.35rem] font-semibold tracking-tight">
              {formatCurrency(totalGross)}
            </p>
            <p className="text-xs text-muted-foreground">Full paid amount recorded in history</p>
          </div>
          <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Destinations</p>
            <p className="mt-1.5 font-display text-[1.35rem] font-semibold tracking-tight">
              {recordsByDestination.size}
            </p>
            <p className="text-xs text-muted-foreground">Archived payout groups on file</p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <CardTitle>Archived payout records</CardTitle>
          <p className="text-sm text-muted-foreground">
            Open a destination only when you need to review or permanently clear older payout records.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payout history records yet.</p>
          ) : (
          <ProgressiveList
            initialCount={4}
            step={3}
            maxHeightClass="max-h-[min(72vh,40rem)]"
            showMoreLabel="Show more destinations"
            showLessLabel="Show fewer destinations"
          >
          {Array.from(recordsByDestination.entries()).map(([destinationId, destinationRecords]) => {
            const totalDestinationGross = destinationRecords.reduce((sum, record) => sum + record.amount, 0);
            const firstRecord = destinationRecords[0];

            return (
              <details
                key={destinationId}
                className="group rounded-[1rem] border border-border/70 bg-card/90"
              >
                <summary className="list-none cursor-pointer p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-1 rounded-full border border-border/70 bg-muted/35 p-2 text-muted-foreground transition-transform group-open:rotate-180">
                        <ChevronDown className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-[1.15rem] font-semibold tracking-tight text-foreground">
                          {firstRecord.destination_title}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {firstRecord.destination_location_text}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {destinationRecords.length} archived record
                          {destinationRecords.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[0.9rem] border border-border/70 bg-muted/22 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                          Archived amount
                        </p>
                        <p className="mt-1 font-medium">{formatCurrency(totalDestinationGross)}</p>
                      </div>
                      <div className="rounded-[0.9rem] border border-border/70 bg-muted/22 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                          Archived rows
                        </p>
                        <p className="mt-1 font-medium">{destinationRecords.length}</p>
                      </div>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-border/70 px-4 pb-4 pt-1">
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <AdminBulkDeleteFinancialRecordsButton
                        recordIds={destinationRecords.map((record) => record.id)}
                        label="Delete destination history"
                        title={`Delete history for ${firstRecord.destination_title}?`}
                        description={`Remove all archived payout rows for ${firstRecord.destination_title} from admin history? These rows will no longer appear on the payout history page.`}
                        redirectTo={"/admin/financials/history"}
                      />
                    </div>
                    <ProgressiveList
                      initialCount={6}
                      step={6}
                      maxHeightClass="max-h-[min(48vh,22rem)]"
                      showMoreLabel="Show more history rows"
                      showLessLabel="Show fewer history rows"
                    >
                    {destinationRecords.map((record) => (
                      <div
                        key={record.id}
                        className="grid gap-3 rounded-[0.95rem] border border-border/70 bg-muted/18 p-3.5 2xl:grid-cols-[minmax(0,1.2fr),minmax(0,0.9fr),auto]"
                      >
                        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1.1fr),repeat(3,minmax(0,0.62fr))]">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{record.tourist_name}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {record.service_snapshot?.title ?? "Standard service"} /{" "}
                              {record.service_date}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Archived{" "}
                              {record.archived_at
                                ? new Date(record.archived_at).toLocaleDateString()
                                : "now"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                              Receipt
                            </p>
                            <p className="mt-1 text-sm font-medium">
                              {record.receipt_reference ?? "Not recorded"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                              Paid amount
                            </p>
                            <p className="mt-1 text-sm font-medium">
                              {formatCurrency(record.amount)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                              Settled
                            </p>
                            <p className="mt-1 text-sm font-medium">
                              {record.settled_at
                                ? new Date(record.settled_at).toLocaleDateString()
                                : "Recorded"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Payout archived in history
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[0.9rem] border border-border/70 bg-card/85 p-3">
                          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                            Notes
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {record.settlement_notes?.trim()
                              ? record.settlement_notes
                              : "No payout notes were added for this archived record."}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 2xl:items-end">
                          <Link href={`/admin/financials/${record.id}` as Route}>
                            <span className="inline-flex h-9 w-full items-center justify-center rounded-[0.9rem] border border-border/80 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 sm:w-auto">
                              Review
                            </span>
                          </Link>
                          <AdminDeleteFinancialRecordButton
                            recordId={record.id}
                            destinationTitle={record.destination_title}
                            redirectTo={"/admin/financials/history"}
                            mode="permanent"
                          />
                        </div>
                      </div>
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
    </DashboardShell>
  );
}
