"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CreditCard, LayoutGrid, List } from "lucide-react";

import { TouristBookingRecordCard } from "@/components/site/tourist-booking-record-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Booking, PaymentMode } from "@/lib/types";
import { formatBookingStatusLabel } from "@/lib/booking-state";
import { formatCurrency } from "@/lib/utils";

type PaymentFilter = "all" | PaymentMode;
type ViewMode = "cards" | "table";

export function TouristBookingHistoryBrowser({ bookings }: { bookings: Booking[] }) {
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const filteredBookings = useMemo(
    () =>
      paymentFilter === "all"
        ? bookings
        : bookings.filter((booking) => booking.payment_mode === paymentFilter),
    [bookings, paymentFilter]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[0.95rem] border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Payment
          </span>
          {(["all", "online", "onsite"] as PaymentFilter[]).map((filter) => (
            <Button
              key={filter}
              type="button"
              size="sm"
              variant={paymentFilter === filter ? "default" : "outline"}
              onClick={() => setPaymentFilter(filter)}
              className="min-h-9 rounded-md px-3 text-xs"
            >
              {filter === "all" ? "All" : filter === "online" ? "Online payment" : "Onsite"}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <span className="text-xs text-muted-foreground">View</span>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "cards" ? "default" : "outline"}
            onClick={() => setViewMode("cards")}
            className="min-h-9 rounded-md px-3 text-xs"
            aria-label="Card view"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Cards
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            className="min-h-9 rounded-md px-3 text-xs"
            aria-label="Table view"
          >
            <List className="h-3.5 w-3.5" /> Table
          </Button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="rounded-[0.95rem] border border-border/70 bg-card p-5 text-sm text-muted-foreground">
          No booking history matches this payment filter.
        </div>
      ) : viewMode === "cards" ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <TouristBookingRecordCard key={booking.id} booking={booking} mode="history" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[0.95rem] border border-border/70 bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border/70 bg-muted/35 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Destination</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Guests</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="align-top hover:bg-muted/25">
                  <td className="px-4 py-3 font-medium">{booking.destination_snapshot.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {booking.service_snapshot?.title ?? "Standard service"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{booking.service_date}</td>
                  <td className="px-4 py-3">{booking.guest_count}</td>
                  <td className="px-4 py-3">
                    <Badge variant={booking.payment_mode === "onsite" ? "warning" : "accent"}>
                      <CreditCard className="mr-1 h-3 w-3" />
                      {booking.payment_mode === "onsite" ? "Onsite" : "Online"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {formatCurrency(booking.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={booking.status === "declined" || booking.status === "cancelled" ? "destructive" : "success"}>
                      {formatBookingStatusLabel(booking.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {booking.ticket_code ? (
                      <Link href={`/account/bookings/${booking.id}/ticket` as Route}>
                        <Button type="button" size="sm" variant="outline" className="min-h-9 rounded-md px-3 text-xs">
                          Open
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">No ticket</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
