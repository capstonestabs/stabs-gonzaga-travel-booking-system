"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CalendarDays, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  clearOnsiteBookingDraft,
  readOnsiteBookingDraft,
  type OnsiteBookingDraft
} from "@/lib/onsite-booking-draft";
import { formatCurrency } from "@/lib/utils";

export function OnsiteBookingReview() {
  const router = useRouter();
  const [draft, setDraft] = useState<OnsiteBookingDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setDraft(readOnsiteBookingDraft());
    setIsLoading(false);
  }, []);

  async function confirmReservation() {
    if (!draft || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft.payload)
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to create your reservation.");

      clearOnsiteBookingDraft();
      setIsSubmitted(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create your reservation."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your reservation details...</p>;
  }

  if (!draft) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            This reservation review has expired or was already submitted.
          </p>
          <Button type="button" onClick={() => router.push("/destinations")}>
            Browse destinations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{draft.destinationTitle}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{draft.locationText}</p>
            </div>
            <Badge variant="warning">Pay onsite in cash</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-[0.9rem] bg-muted/45 p-3">
              <p className="text-muted-foreground">Service</p>
              <p className="mt-1 font-medium">{draft.serviceTitle}</p>
            </div>
            <div className="rounded-[0.9rem] bg-muted/45 p-3">
              <p className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /> Visit date</p>
              <p className="mt-1 font-medium">{draft.payload.serviceDate}</p>
            </div>
            <div className="rounded-[0.9rem] bg-muted/45 p-3">
              <p className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> Guests</p>
              <p className="mt-1 font-medium">{draft.payload.guestCount}</p>
            </div>
            <div className="rounded-[0.9rem] bg-muted/45 p-3">
              <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> Check-out</p>
              <p className="mt-1 font-medium">{draft.payload.checkOutDate} · {draft.payload.checkOutTime}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-y border-border/70 py-4">
            <span className="text-sm font-medium">Total amount due in cash</span>
            <span className="font-display text-xl font-semibold text-primary">{formatCurrency(draft.totalAmount)}</span>
          </div>

          <div className="rounded-[0.9rem] border border-amber-200 bg-amber-50 p-3.5 text-sm leading-6 text-amber-950">
            <p className="flex items-center gap-2 font-semibold"><Banknote className="h-4 w-4" /> Reserve now, pay onsite later</p>
            <p className="mt-1">Our staff will review this reservation first. After confirmation, you will receive a receipt to present at check-in.</p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="grid gap-2 sm:grid-cols-[auto,1fr]">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4" /> Change details
            </Button>
            <Button type="button" onClick={() => void confirmReservation()} disabled={isSubmitting}>
              {isSubmitting ? "Submitting reservation..." : "Confirm onsite reservation"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal open={isSubmitted} onClose={() => router.push("/account/current")} title="Booking Submitted">
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Your onsite reservation is on hold while our staff reviews it. Come back again after the staff confirmed your reservations.
          </p>
          <Button type="button" className="w-full" onClick={() => router.push("/account/current")}>
            Go to My Bookings
          </Button>
        </div>
      </Modal>
    </>
  );
}
