"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CancelBookingButton } from "@/components/forms/cancel-booking-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBookingStatusLabel, formatReservationStatusLabel } from "@/lib/booking-state";

interface BookingStatusResponse {
  bookingStatus: "pending_payment" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "expired" | "cancelled";
  checkoutUrl?: string | null;
  amount?: number;
  currency?: string;
  destinationTitle?: string;
  serviceTitle?: string | null;
  serviceDate?: string;
  guestCount?: number;
  guestBreakdown?: {
    adult_count?: number;
    child_count?: number;
    guest_types?: Array<"adult" | "child">;
  } | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  refundStatus?: string | null;
  refundAmount?: number | null;
  refundReference?: string | null;
  contactEmail?: string;
  contactPhone?: string;
  emailReceiptEnabled?: boolean;
  ticketCode?: string | null;
  serviceSnapshot?: {
    id: string;
    title: string;
    description: string | null;
    price_amount: number;
    service_type: string;
    guest_breakdown?: {
      adult_count: number;
      child_count: number;
      guest_types: Array<"adult" | "child">;
      adult_rate: number;
      child_rate: number;
    };
    guest_details?: Array<{
      name: string;
      type: "adult" | "child";
    }>;
    additional_services?: Array<{
      id: string;
      title: string;
      price_amount: number;
      quantity: number;
      subtotal: number;
    }>;
  } | null;
}

const badgeVariantByStatus: Record<string, "default" | "warning" | "success" | "destructive"> = {
  pending_payment: "warning",
  pending: "warning",
  confirmed: "success",
  paid: "success",
  completed: "success",
  failed: "destructive",
  expired: "destructive",
  cancelled: "destructive"
};

export function BookingStatusCard({
  bookingId,
  accessToken = null
}: {
  bookingId: string;
  accessToken?: string | null;
}) {
  const [state, setState] = useState<{
    data: BookingStatusResponse | null;
    error: string | null;
    loading: boolean;
  }>({
    data: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    let active = true;
    let interval: NodeJS.Timeout | undefined;

    async function loadStatus() {
      try {
        const params = new URLSearchParams();
        if (accessToken) {
          params.set("access", accessToken);
        }

        const response = await fetch(
          `/api/bookings/${bookingId}/status${params.size ? `?${params.toString()}` : ""}`,
          {
            cache: "no-store"
          }
        );
        const body = (await response.json()) as BookingStatusResponse & { error?: string };

        if (!response.ok) {
          throw new Error(body.error ?? "Unable to load booking status.");
        }

        if (!active) {
          return;
        }

        setState({
          data: body,
          error: null,
          loading: false
        });

        if (
          body.paymentStatus === "paid" ||
          body.paymentStatus === "failed" ||
          body.paymentStatus === "expired"
        ) {
          if (interval) {
            clearInterval(interval);
          }
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          data: null,
          error: error instanceof Error ? error.message : "Unable to load booking status.",
          loading: false
        });
      }
    }

    void loadStatus();
    interval = setInterval(() => {
      void loadStatus();
    }, 4000);

    return () => {
      active = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [bookingId]);

  const bookingStatus = state.data?.bookingStatus ?? "pending_payment";
  const reservationStatus = state.data?.paymentStatus ?? "pending";
  const paymentMethodLabels: Record<string, string> = {
    card: "Credit or debit card",
    gcash: "GCash",
    grab_pay: "GrabPay",
    paymaya: "Maya",
    billease: "BillEase"
  };

  const statusMessage =
    reservationStatus === "pending"
      ? "Your reservation is still waiting for you. If you do not finish in time, the date hold expires automatically."
      : reservationStatus === "failed" || reservationStatus === "expired" || bookingStatus === "cancelled"
        ? "This reservation did not go through. The date hold has already been released, and you can choose another plan anytime."
        : bookingStatus === "confirmed" || bookingStatus === "completed"
          ? "Your trip is confirmed. You can return to your bookings anytime or open your pass below."
          : null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="gradient-chip w-fit">Booking return</div>
        <CardTitle>Booking status</CardTitle>
        <CardDescription>
          Check the latest update for this reservation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {state.loading ? <p className="text-sm text-muted-foreground">Checking booking state...</p> : null}
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.data ? (
          <>
            <ol className="grid gap-2 rounded-[1rem] border border-border/70 bg-muted/25 p-2 sm:grid-cols-4">
              {["Date", "Guest information", "Payment", "Confirmation"].map((label, index) => {
                const isComplete = state.data?.paymentStatus === "paid" || index < 3;
                const isCurrent = index === 3 && state.data?.paymentStatus === "paid";
                return (
                  <li key={label} className={`rounded-[0.8rem] px-3 py-2 text-center text-[11px] font-semibold ${isCurrent ? "bg-primary text-primary-foreground" : isComplete ? "bg-secondary text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap gap-3">
              <Badge variant={badgeVariantByStatus[state.data.bookingStatus] ?? "default"}>
                Booking: {formatBookingStatusLabel(state.data.bookingStatus)}
              </Badge>
              <Badge variant={badgeVariantByStatus[state.data.paymentStatus] ?? "default"}>
                Reservation: {formatReservationStatusLabel(state.data.paymentStatus)}
              </Badge>
            </div>
            {statusMessage ? (
              <p className="rounded-[1rem] border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
                {statusMessage}
              </p>
            ) : null}
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Listing</dt>
                <dd className="font-medium">{state.data.destinationTitle ?? "Booking"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Package</dt>
                <dd className="font-medium">{state.data.serviceTitle ?? "Standard service"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-medium">
                  {state.data.amount && state.data.currency
                    ? new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: state.data.currency
                      }).format(state.data.amount / 100)
                    : "Pending"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ticket code</dt>
                <dd className="font-medium">{state.data.ticketCode ?? "Issued after booking confirmation"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Booking date</dt>
                <dd className="font-medium">{state.data.serviceDate ?? "Pending"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Guests</dt>
                <dd className="font-medium">
                  {state.data.guestBreakdown
                    ? `${state.data.guestBreakdown.adult_count ?? 0} Adult, ${state.data.guestBreakdown.child_count ?? 0} Child`
                    : `${state.data.guestCount ?? 0} guest${state.data.guestCount === 1 ? "" : "s"}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment method</dt>
                <dd className="font-medium">{state.data.paymentMethod ? paymentMethodLabels[state.data.paymentMethod] ?? state.data.paymentMethod : "Pending"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Transaction time</dt>
                <dd className="font-medium">
                  {state.data.paidAt
                    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(state.data.paidAt))
                    : "Pending"}
                </dd>
              </div>
            </dl>
            {state.data.serviceSnapshot?.additional_services && state.data.serviceSnapshot.additional_services.length > 0 && (
              <div className="border-t border-dashed border-border/80 pt-4 mt-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Billing Breakdown</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Resort/Package Cost:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP"
                      }).format(
                        (state.data.amount ?? 0) / 100 -
                          (state.data.serviceSnapshot.additional_services.reduce(
                            (sum, add) => sum + add.price_amount * add.quantity,
                            0
                          ))
                      )}
                    </span>
                  </div>
                  {state.data.serviceSnapshot.additional_services.map((addon) => (
                    <div key={addon.id} className="flex justify-between">
                      <span className="text-muted-foreground">{addon.title} (Qty: {addon.quantity}):</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP"
                        }).format(addon.price_amount * addon.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {state.data.paymentStatus === "paid" ? (
              <p className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                {state.data.emailReceiptEnabled ? (
                  <>A detailed booking receipt is being sent to <strong>{state.data.contactEmail}</strong>. For assistance, use your reference number above when contacting support.</>
                ) : (
                  <>Your booking is confirmed. PayMongo sends its payment receipt to <strong>{state.data.contactEmail}</strong>; keep the booking reference above for support inquiries.</>
                )}
              </p>
            ) : null}
            {state.data.refundStatus ? (
              <p className="rounded-[1rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                Refund status: <strong>{state.data.refundStatus.replaceAll("_", " ")}</strong>
                {state.data.refundAmount ? ` · ${new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(state.data.refundAmount / 100)}` : ""}
                {state.data.refundReference ? ` · Reference ${state.data.refundReference}` : ""}
              </p>
            ) : null}
            <div className="grid gap-3 pt-1 sm:flex sm:flex-wrap">
              {state.data.paymentStatus === "pending" && state.data.checkoutUrl ? (
                <>
                  <a href={state.data.checkoutUrl}>
                    <Button className="w-full sm:w-auto">Continue reservation</Button>
                  </a>
                  <CancelBookingButton bookingId={bookingId} />
                </>
              ) : null}
              {state.data.paymentStatus === "paid" && state.data.bookingStatus === "confirmed" ? (
                <CancelBookingButton
                  bookingId={bookingId}
                  label="Cancel and request refund"
                  confirmMessage="Cancel this confirmed reservation and request a full refund? This cannot be undone. Refund processing time depends on the payment provider."
                />
              ) : null}
              {state.data.ticketCode ? (
                <Link href={`/account/bookings/${bookingId}/ticket` as Route}>
                  <Button variant="secondary" className="w-full sm:w-auto">Open ticket</Button>
                </Link>
              ) : null}
              <Link href="/account">
                <Button variant="outline" className="w-full sm:w-auto">Back to my bookings</Button>
              </Link>
              {(state.data.paymentStatus === "failed" ||
                state.data.paymentStatus === "expired" ||
                state.data.bookingStatus === "cancelled") ? (
                <Link href="/destinations">
                  <Button variant="secondary" className="w-full sm:w-auto">Back to destinations</Button>
                </Link>
              ) : null}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
