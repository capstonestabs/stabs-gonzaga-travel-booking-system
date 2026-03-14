import type { Route } from "next";
import Link from "next/link";

import { CancelBookingButton } from "@/components/forms/cancel-booking-button";
import { DeleteBookingButton } from "@/components/forms/delete-booking-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatBookingStatusLabel,
  formatReservationStatusLabel,
  getBookingTicketState,
  isBookingTicketExpired
} from "@/lib/booking-state";
import type { Booking } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const bookingBadgeVariantByStatus = {
  pending_payment: "warning",
  confirmed: "success",
  completed: "success",
  cancelled: "destructive"
} as const;

const paymentBadgeVariantByStatus = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  expired: "destructive",
  cancelled: "destructive"
} as const;

export function TouristBookingRecordCard({
  booking,
  mode = "active"
}: {
  booking: Booking;
  mode?: "active" | "history";
}) {
  const isExpiredPass = isBookingTicketExpired(booking);
  const canOpenTicket = Boolean(booking.ticket_code && booking.status !== "cancelled");
  const canClearHistory =
    booking.status === "completed" ||
    booking.status === "cancelled" ||
    booking.payment?.status === "expired" ||
    isExpiredPass;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 border-b border-border/70 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{booking.destination_snapshot.title}</CardTitle>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {booking.destination_snapshot.location_text} - {booking.service_date}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={bookingBadgeVariantByStatus[booking.status] ?? "warning"}>
            Booking: {formatBookingStatusLabel(booking.status)}
          </Badge>
          {isExpiredPass ? <Badge variant="warning">Expired pass</Badge> : null}
          <Badge
            variant={
              booking.payment?.status
                ? paymentBadgeVariantByStatus[booking.payment.status] ?? "warning"
                : "warning"
            }
          >
            Reservation: {formatReservationStatusLabel(booking.payment?.status ?? "pending")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2 2xl:grid-cols-5">
          <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
            <p className="text-muted-foreground">Package</p>
            <p className="mt-1 font-medium">
              {booking.service_snapshot?.title ?? "Standard service"}
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {booking.service_snapshot?.service_type ?? "standard"}
            </p>
          </div>
          <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
            <p className="text-muted-foreground">Guests</p>
            <p className="mt-1 font-medium">{booking.guest_count}</p>
          </div>
          <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
            <p className="text-muted-foreground">Total amount</p>
            <p className="mt-1 font-medium">{formatCurrency(booking.total_amount)}</p>
          </div>
          <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
            <p className="text-muted-foreground">Ticket</p>
            <p className="mt-1 font-medium">
              {booking.status === "cancelled"
                ? "Not available"
                : booking.ticket_code ?? "Issued after booking confirmation"}
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {getBookingTicketState(booking) === "valid"
                ? "valid on the scheduled date"
                : getBookingTicketState(booking) === "used"
                  ? "already used"
                  : getBookingTicketState(booking) === "expired"
                    ? "expired after the service date"
                    : getBookingTicketState(booking) === "pending"
                      ? "awaiting confirmation"
                      : "inactive"}
            </p>
          </div>
          <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
            <p className="text-muted-foreground">Booking ID</p>
            <p className="mt-1 break-all font-medium">{booking.id}</p>
          </div>
        </div>

        {mode === "active" && booking.status === "pending_payment" ? (
          <p className="rounded-[1rem] border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
            This reservation is still waiting for confirmation. If checkout is not completed, the
            5-minute slot hold will expire automatically and the record will move to history.
          </p>
        ) : null}

        {mode === "history" ? (
          <p className="rounded-[1rem] border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            This trip is kept in your history so you can review the result, reopen any available
            pass, or clear the record from your account when you no longer need it.
          </p>
        ) : null}

        {booking.status === "pending_payment" || canOpenTicket || (mode === "history" && canClearHistory) ? (
          <div className="grid gap-3 border-t border-border/60 pt-4 sm:flex sm:flex-wrap">
            {booking.status === "pending_payment" && booking.payment?.checkout_url ? (
              <>
                <a href={booking.payment.checkout_url}>
                  <Button>Continue reservation</Button>
                </a>
                <CancelBookingButton bookingId={booking.id} />
              </>
            ) : null}
            {canOpenTicket ? (
              <Link href={`/account/bookings/${booking.id}/ticket` as Route}>
                <Button variant="secondary">
                  {isExpiredPass
                    ? "View expired ticket"
                    : mode === "history"
                      ? "Open pass"
                      : "Open ticket"}
                </Button>
              </Link>
            ) : null}
            {mode === "history" && canClearHistory ? (
              <DeleteBookingButton
                bookingId={booking.id}
                label="Clear history"
                confirmMessage={
                  booking.status === "completed"
                    ? "Clear this completed booking from your history? The admin payout record stays on file, but this trip will no longer appear in your tourist account."
                    : booking.status === "cancelled"
                      ? "Clear this cancelled reservation from your history? This removes it from your tourist account only."
                      : "Clear this expired booking from your history? This removes it from your tourist account only."
                }
              />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
