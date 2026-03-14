"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CompleteBookingButton } from "@/components/forms/complete-booking-button";
import { DeleteBookingButton } from "@/components/forms/delete-booking-button";
import { ProgressiveList } from "@/components/ui/progressive-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { isBookingTicketExpired } from "@/lib/booking-state";
import type { Booking } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

function getBookingBadgeVariant(status: string) {
  switch (status) {
    case "confirmed":
    case "completed":
      return "success" as const;
    case "pending_payment":
      return "warning" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "muted" as const;
  }
}

export function StaffBookingsManager({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"complete" | "delete" | null>(null);
  const [dialogMode, setDialogMode] = useState<"complete" | "delete" | null>(null);

  const allBookingIds = useMemo(() => bookings.map((booking) => booking.id), [bookings]);

  const completeEligibleIds = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "confirmed" && !isBookingTicketExpired(booking))
        .map((booking) => booking.id),
    [bookings]
  );

  const deleteEligibleIds = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            booking.status === "cancelled" || booking.status === "completed"
        )
        .map((booking) => booking.id),
    [bookings]
  );

  const selectedCompleteIds = selectedIds.filter((id) => completeEligibleIds.includes(id));
  const selectedDeleteIds = selectedIds.filter((id) => deleteEligibleIds.includes(id));

  function toggleSelection(bookingId: string) {
    setError(null);
    setSelectedIds((current) =>
      current.includes(bookingId)
        ? current.filter((id) => id !== bookingId)
        : [...current, bookingId]
    );
  }

  async function runBulkAction(mode: "complete" | "delete") {
    const actionableIds = mode === "complete" ? selectedCompleteIds : selectedDeleteIds;
    const invalidCount = selectedIds.length - actionableIds.length;

    if (selectedIds.length === 0) {
      setError("Select at least one booking first.");
      return;
    }

    if (actionableIds.length === 0) {
      setError(
        mode === "complete"
          ? "Select confirmed upcoming bookings to mark as completed."
          : "Select cancelled bookings or completed bookings to delete."
      );
      return;
    }

    if (invalidCount > 0) {
      setError(
        mode === "complete"
          ? "Only confirmed upcoming bookings can be marked as completed."
          : "Only cancelled bookings or completed bookings can be deleted."
      );
      return;
    }

    setError(null);
    setPendingAction(mode);

    try {
      const response = await fetch(
        mode === "complete" ? "/api/staff/bookings/batch-complete" : "/api/staff/bookings/batch-delete",
        {
          method: mode === "complete" ? "POST" : "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ bookingIds: actionableIds })
        }
      );
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          body.error ??
            (mode === "complete"
              ? "Unable to mark the selected bookings as completed."
              : "Unable to delete the selected bookings.")
        );
      }

      setSelectedIds([]);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : mode === "complete"
            ? "Unable to mark the selected bookings as completed."
            : "Unable to delete the selected bookings."
      );
      setPendingAction(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <div className="flex flex-col gap-3">
          <div>
            <CardTitle>Bookings</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Latest booking records for this staff account.
            </p>
          </div>

          {bookings.length > 0 ? (
            <div className="rounded-[1rem] border border-border/70 bg-muted/30 p-3.5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Bulk actions
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{selectedIds.length}</span>
                    {" / "}Ready to complete:{" "}
                    <span className="font-medium text-foreground">{completeEligibleIds.length}</span>
                    {" / "}Ready to delete:{" "}
                    <span className="font-medium text-foreground">{deleteEligibleIds.length}</span>
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() => {
                      setError(null);
                      setSelectedIds(allBookingIds);
                    }}
                  >
                    Select all shown
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() => {
                      setError(null);
                      setSelectedIds(completeEligibleIds);
                    }}
                  >
                    Select ready to complete
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() => {
                      setError(null);
                      setSelectedIds(deleteEligibleIds);
                    }}
                  >
                    Select deletable
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="min-h-11"
                    onClick={() => setDialogMode("complete")}
                    disabled={selectedIds.length === 0 || pendingAction !== null}
                  >
                    {pendingAction === "complete"
                      ? "Saving..."
                      : "Mark selected as completed"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="min-h-11"
                    onClick={() => setDialogMode("delete")}
                    disabled={selectedIds.length === 0 || pendingAction !== null}
                  >
                    {pendingAction === "delete" ? "Deleting..." : "Delete selected"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-11"
                    onClick={() => {
                      setError(null);
                      setSelectedIds([]);
                    }}
                    disabled={selectedIds.length === 0 || pendingAction !== null}
                  >
                    Clear selection
                  </Button>
                </div>
              </div>
              {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-5">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bookings have been received for your destination yet.
          </p>
        ) : (
          <ProgressiveList
            initialCount={6}
            step={6}
            maxHeightClass="max-h-[72vh]"
            showMoreLabel="Show more bookings"
            showLessLabel="Show fewer bookings"
          >
            {bookings.map((booking) => {
              const expired = isBookingTicketExpired(booking);
              const canComplete = booking.status === "confirmed" && !expired;
              const canDelete =
                booking.status === "cancelled" || booking.status === "completed";
              const checked = selectedIds.includes(booking.id);

              return (
                <div
                  key={booking.id}
                  className={cn(
                    "grid gap-4 rounded-[1rem] border border-border/70 bg-card/85 p-4 sm:p-5 xl:grid-cols-[auto,1.15fr,0.75fr,0.75fr,0.95fr]",
                    checked ? "ring-1 ring-primary/35" : ""
                  )}
                >
                  <label className="flex items-start justify-center pt-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelection(booking.id)}
                      className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                      aria-label={`Select booking ${booking.id}`}
                    />
                  </label>

                  <div className="space-y-1">
                    <p className="font-medium">{booking.destination_snapshot.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Package: {booking.service_snapshot?.title ?? "Standard service"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.contact_name} | {booking.contact_email}
                    </p>
                    <p className="text-sm text-muted-foreground">{booking.contact_phone}</p>
                    <p className="text-xs text-muted-foreground">
                      Ticket: {booking.ticket_code ?? "Issued after payment confirmation"}
                    </p>
                  </div>

                  <div className="rounded-[0.95rem] bg-muted/45 px-3.5 py-3 sm:px-4">
                    <p className="text-sm text-muted-foreground">Service date</p>
                    <p className="mt-1 font-medium">{booking.service_date}</p>
                    <p className="text-sm text-muted-foreground">{booking.guest_count} guests</p>
                  </div>

                  <div className="rounded-[0.95rem] bg-muted/45 px-3.5 py-3 sm:px-4">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="mt-1 font-medium">{formatCurrency(booking.total_amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex h-full flex-col gap-3 rounded-[0.95rem] bg-muted/45 px-3.5 py-3.5 sm:px-4 sm:py-4">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getBookingBadgeVariant(booking.status)}>
                      {booking.status.replace("_", " ")}
                    </Badge>
                    {expired ? <Badge variant="warning">expired / no-show</Badge> : null}
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {canComplete ? <p>Ready for bulk complete</p> : null}
                      {canDelete ? <p>Ready for bulk delete</p> : null}
                    </div>
                    <div className="mt-auto space-y-3 border-t border-border/55 pt-3">
                      {canComplete ? <CompleteBookingButton bookingId={booking.id} /> : null}
                      {booking.status === "confirmed" && expired ? (
                        <p className="text-xs text-muted-foreground">
                          This booking date has passed without completion. The pass is now expired and can no longer be used.
                        </p>
                      ) : null}
                      {canDelete ? (
                        <DeleteBookingButton
                          bookingId={booking.id}
                          className="w-full justify-center"
                          confirmMessage="Delete this booking from the staff list? Cancelled and completed bookings can be removed. Active bookings stay protected until they are completed or cancelled."
                        />
                      ) : null}
                      {booking.status !== "cancelled" && booking.status !== "completed" ? (
                        <p className="text-xs text-muted-foreground">
                          This record stays protected until the booking is completed or cancelled.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </ProgressiveList>
        )}
      </CardContent>

      <ConfirmationDialog
        open={dialogMode === "complete"}
        title="Mark selected bookings as completed?"
        description="Only confirmed upcoming bookings can be completed. Make sure the service has already been delivered before you continue."
        confirmLabel="Mark selected as completed"
        confirmVariant="default"
        isPending={pendingAction === "complete"}
        onClose={() => setDialogMode(null)}
        onConfirm={async () => {
          setDialogMode(null);
          await runBulkAction("complete");
        }}
      />
      <ConfirmationDialog
        open={dialogMode === "delete"}
        title="Delete selected bookings?"
        description="Only cancelled bookings or completed bookings can be deleted. Active bookings stay protected until they are completed or cancelled."
        confirmLabel="Delete selected"
        confirmVariant="destructive"
        isPending={pendingAction === "delete"}
        onClose={() => setDialogMode(null)}
        onConfirm={async () => {
          setDialogMode(null);
          await runBulkAction("delete");
        }}
      />
    </Card>
  );
}
