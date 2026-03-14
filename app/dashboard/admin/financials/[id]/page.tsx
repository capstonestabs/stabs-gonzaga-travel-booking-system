import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminDeleteFinancialRecordButton } from "@/components/forms/admin-delete-financial-record-button";
import { AdminFinancialSettlementForm } from "@/components/forms/admin-financial-settlement-form";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminFinancialRecordById } from "@/lib/repositories";
import { formatCurrency } from "@/lib/utils";

export default async function AdminFinancialRecordDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await requireRole(["admin"]);
  const record = await getAdminFinancialRecordById(id);

  if (!record) {
    notFound();
  }

  const isArchived = Boolean(record.archived_at);

  return (
    <DashboardShell
      role="admin"
      title="Review financial record"
      description="Check the full paid booking amount, payout settlement details, and whether the row already lives in payout history."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),20rem]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recorded transaction</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Booking-linked rows stay tied to the original tourist payment.
                </p>
              </div>
              <Link href={isArchived ? "/admin/financials/history" : "/admin/financials"}>
                <Button variant="outline" size="sm">
                  Back
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Destination</p>
              <p className="mt-2 font-medium text-foreground">{record.destination_title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{record.destination_location_text}</p>
            </div>
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Tourist</p>
              <p className="mt-2 font-medium text-foreground">{record.tourist_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {record.tourist_email ?? "No email recorded"}
              </p>
            </div>
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Visit date</p>
              <p className="mt-2 font-medium text-foreground">{record.service_date}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {record.guest_count} guest{record.guest_count === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Package</p>
              <p className="mt-2 font-medium text-foreground">
                {record.service_snapshot?.title ?? "Standard service"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {record.service_snapshot?.service_type ?? "standard"}
              </p>
            </div>
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Paid amount</p>
              <p className="mt-2 font-medium text-foreground">
                {formatCurrency(record.amount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {record.payment_method_type ?? "PayMongo checkout"} on{" "}
                {new Date(record.paid_at).toLocaleDateString()}
              </p>
            </div>
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Ticket code</p>
              <p className="mt-2 font-medium text-foreground">{record.ticket_code ?? "Pending"}</p>
            </div>
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-4 sm:col-span-2 xl:col-span-3">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Linked booking</p>
              <p className="mt-2 font-medium text-foreground">{record.booking_id ?? "Unavailable"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {record.deleted_booking_at
                  ? "The live booking has already been deleted from operational views."
                  : "The ledger row stays available even if the live booking is cleaned up later."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Settlement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
              <p>
                Record the actual staff payout reference here after release by GCash, bank transfer,
                or in-person release. Saving the payout moves this row to history automatically.
              </p>
              <AdminFinancialSettlementForm
                recordId={record.id}
                settlementStatus={record.settlement_status}
                receiptReference={record.receipt_reference}
                settlementNotes={record.settlement_notes}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/70">
              <CardTitle>{isArchived ? "History record" : "Automatic history move"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
              <p>
                {isArchived
                  ? "This payout is already archived in history. Delete it permanently only if you no longer need the record."
                  : "Once the staff payout is recorded, this active row moves to payout history automatically."}
              </p>
              {isArchived ? (
                <AdminDeleteFinancialRecordButton
                  recordId={record.id}
                  destinationTitle={record.destination_title}
                  redirectTo={"/admin/financials/history"}
                  mode="permanent"
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  No extra archive action is needed on active records anymore.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
