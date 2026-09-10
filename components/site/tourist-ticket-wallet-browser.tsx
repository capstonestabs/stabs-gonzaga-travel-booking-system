"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Banknote, CreditCard, Download, Eye, MapPin, Users } from "lucide-react";

import { BookingTicketCard } from "@/components/site/booking-ticket-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { createGuestTicketVerificationUrl, getBookingGuestTickets } from "@/lib/guest-tickets";
import { getBookingTicketState, isBookingTicketExpired } from "@/lib/booking-state";
import type { Booking } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const ticketBadgeVariantByState = {
  valid: "success",
  used: "success",
  expired: "warning",
  pending: "warning",
  cancelled: "destructive"
} as const;

export function TouristTicketWalletBrowser({ bookings }: { bookings: Booking[] }) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  return (
    <>
      <div className="space-y-3">
        {bookings.map((booking) => {
          const ticketState = getBookingTicketState(booking);
          const isExpired = isBookingTicketExpired(booking);
          const paymentIsOnsite = booking.payment_mode === "onsite";

          return (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="flex flex-col gap-3 border-b border-border/70 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{booking.destination_snapshot.title}</CardTitle>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {booking.destination_snapshot.location_text} · {booking.service_date}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={ticketBadgeVariantByState[ticketState] ?? "warning"}>
                    {ticketState === "valid"
                      ? "Ready to present"
                      : ticketState === "used"
                        ? "Already used"
                        : ticketState === "expired"
                          ? "Expired pass"
                          : "Waiting confirmation"}
                  </Badge>
                  <Badge variant={paymentIsOnsite ? "warning" : "accent"}>
                    {paymentIsOnsite ? <Banknote className="mr-1 h-3 w-3" /> : <CreditCard className="mr-1 h-3 w-3" />}
                    {paymentIsOnsite ? "Onsite" : "Online"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
                    <p className="text-muted-foreground">Package</p>
                    <p className="mt-1 font-medium">{booking.service_snapshot?.title ?? "Standard service"}</p>
                  </div>
                  <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
                    <p className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3.5 w-3.5" /> Guests</p>
                    <p className="mt-1 font-medium">{booking.guest_count}</p>
                  </div>
                  <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
                    <p className="text-muted-foreground">Amount</p>
                    <p className="mt-1 font-medium">{formatCurrency(booking.total_amount)}</p>
                  </div>
                  <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
                    <p className="text-muted-foreground">Ticket code</p>
                    <p className="mt-1 break-all font-mono text-xs font-medium">{booking.ticket_code}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setSelectedBooking(booking)}>
                    <Eye className="h-4 w-4" /> Preview QR details
                  </Button>
                  <Link href={`/account/bookings/${booking.id}/ticket` as Route}>
                    <Button type="button" variant="outline">
                      <Download className="h-4 w-4" /> Open and download
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title="Ticket preview"
        className="sm:max-w-2xl"
      >
        {selectedBooking ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-semibold">{selectedBooking.destination_snapshot.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedBooking.service_snapshot?.title ?? "Standard service"}</p>
              </div>
              <Badge variant={selectedBooking.payment_mode === "onsite" ? "warning" : "accent"}>
                {selectedBooking.payment_mode === "onsite" ? "Onsite payment" : "Online payment"}
              </Badge>
            </div>

            <div className="grid gap-2 rounded-[0.95rem] border border-border/70 bg-muted/35 p-3 text-sm sm:grid-cols-3">
              <div><p className="text-muted-foreground">Visit date</p><p className="mt-1 font-medium">{selectedBooking.service_date}</p></div>
              <div><p className="text-muted-foreground">Guests</p><p className="mt-1 font-medium">{selectedBooking.guest_count}</p></div>
              <div><p className="text-muted-foreground">Total</p><p className="mt-1 font-medium">{formatCurrency(selectedBooking.total_amount)}</p></div>
            </div>

            {selectedBooking.ticket_code ? (
              <BookingTicketCard
                ticketCode={getBookingGuestTickets(selectedBooking)[0]?.ticketCode ?? selectedBooking.ticket_code}
                verificationUrl={createGuestTicketVerificationUrl(selectedBooking.id, 1)}
                referenceCode={selectedBooking.id.split("-")[0].toUpperCase()}
                guestName={selectedBooking.contact_name}
                isExpired={isBookingTicketExpired(selectedBooking)}
              />
            ) : null}

            {selectedBooking.payment_mode === "onsite" && selectedBooking.onsite_receipt ? (
              <div className="rounded-[0.95rem] border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-950">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">Onsite receipt preview</p>
                  <Badge variant="warning">Cash</Badge>
                </div>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div><dt className="text-amber-800">Receipt code</dt><dd className="font-mono font-bold">{selectedBooking.onsite_receipt.receipt_code}</dd></div>
                  <div><dt className="text-amber-800">Amount due</dt><dd className="font-semibold">{formatCurrency(selectedBooking.total_amount)}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-amber-800">Instruction</dt><dd>Present this receipt at check-in and pay in cash.</dd></div>
                </dl>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
