"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export function OnsiteReceiptCard({ booking }: { booking: Booking }) {
  const [showDetails, setShowDetails] = useState(false);
  const receipt = booking.onsite_receipt;

  if (!receipt) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-[0.95rem] border border-amber-200 bg-amber-50/60 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">
            Your onsite payment receipt
          </p>
          <p className="mt-1 text-sm text-amber-950">
            Present this at check-in and pay the amount below in cash.
          </p>
        </div>
        <Badge variant="warning">Awaiting onsite payment</Badge>
      </div>
      <div className="flex items-center justify-between gap-3 border-y border-amber-200 py-3">
        <span className="text-xs text-amber-800">Receipt code</span>
        <span className="font-mono text-lg font-bold tracking-[0.14em] text-amber-950">
          {receipt.receipt_code}
        </span>
      </div>
      {showDetails ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-amber-800">Destination</dt>
            <dd className="font-medium text-amber-950">{booking.destination_snapshot.title}</dd>
          </div>
          <div>
            <dt className="text-xs text-amber-800">Service</dt>
            <dd className="font-medium text-amber-950">{booking.service_snapshot?.title ?? "Standard service"}</dd>
          </div>
          <div>
            <dt className="text-xs text-amber-800">Date</dt>
            <dd className="font-medium text-amber-950">{booking.service_date}</dd>
          </div>
          <div>
            <dt className="text-xs text-amber-800">Guests</dt>
            <dd className="font-medium text-amber-950">{booking.guest_count}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-amber-800">Total amount due</dt>
            <dd className="mt-0.5 text-lg font-semibold text-amber-950">{formatCurrency(booking.total_amount)}</dd>
          </div>
        </dl>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="w-full border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100"
        onClick={() => setShowDetails((current) => !current)}
      >
        {showDetails ? "Hide receipt details" : "View receipt details"}
      </Button>
    </div>
  );
}
