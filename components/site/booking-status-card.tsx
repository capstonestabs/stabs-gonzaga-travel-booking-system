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
  ticketCode?: string | null;
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
            </dl>
            <div className="grid gap-3 pt-1 sm:flex sm:flex-wrap">
              {state.data.paymentStatus === "pending" && state.data.checkoutUrl ? (
                <>
                  <a href={state.data.checkoutUrl}>
                    <Button className="w-full sm:w-auto">Continue reservation</Button>
                  </a>
                  <CancelBookingButton bookingId={bookingId} />
                </>
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
