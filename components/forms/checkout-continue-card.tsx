"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, MapPin, ShieldCheck, Users } from "lucide-react";

import { clearCheckoutDraft, readCheckoutDraft, type CheckoutDraft } from "@/lib/checkout-draft";
import type { UserRole } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CheckoutContinueCard({
  viewerRole,
  viewerEmail,
  requiresAccount,
  pendingBooking
}: {
  viewerRole: UserRole | null;
  viewerEmail: string | null;
  requiresAccount: boolean;
  pendingBooking?: {
    id: string;
    destinationTitle: string;
    serviceTitle: string;
    serviceDate: string;
    checkoutUrl: string | null;
  } | null;
}) {
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(readCheckoutDraft());
    setIsLoading(false);
  }, []);

  async function handleContinueToPayment() {
    if (!draft) {
      return;
    }

    if (requiresAccount && !viewerRole) {
      window.location.assign(
        `/sign-in?redirectTo=${encodeURIComponent("/checkout/continue")}`
      );
      return;
    }

    if (viewerRole && viewerRole !== "user") {
      setError("Bookings require a traveler account. Sign in with the right account to continue.");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          destinationId: draft.destinationId,
          serviceId: draft.serviceId,
          serviceDate: draft.serviceDate,
          guestCount: draft.guestCount,
          contactName: draft.contactName,
          contactEmail: draft.contactEmail,
          contactPhone: draft.contactPhone,
          notes: draft.notes
        })
      });

      if (response.status === 401) {
        window.location.assign(
          `/sign-in?redirectTo=${encodeURIComponent("/checkout/continue")}`
        );
        return;
      }

      const body = (await response.json()) as { error?: string; checkoutUrl?: string };
      if (!response.ok || !body.checkoutUrl) {
        throw new Error(body.error ?? "Unable to continue right now.");
      }

      clearCheckoutDraft();
      window.location.assign(body.checkoutUrl);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to continue right now."
      );
    } finally {
      setIsPending(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading your trip details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!draft) {
    return (
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="gradient-chip w-fit">Checkout</div>
          <CardTitle>{pendingBooking ? "Reservation still in progress" : "No checkout in progress"}</CardTitle>
          <CardDescription>
            {pendingBooking
              ? "A recent reservation is still waiting for you. Open it below instead of starting over."
              : "Choose a destination and service first, then come back here when you are ready to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5">
          {pendingBooking ? (
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/35 px-4 py-4 text-sm">
              <p className="font-medium text-foreground">{pendingBooking.destinationTitle}</p>
              <p className="mt-1 text-muted-foreground">{pendingBooking.serviceTitle}</p>
              <p className="mt-1 text-muted-foreground">{pendingBooking.serviceDate}</p>
            </div>
          ) : null}
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            {pendingBooking ? (
              <>
                <Link href={`/bookings/${pendingBooking.id}/status` as Route}>
                  <Button className="w-full sm:w-auto">Open reservation status</Button>
                </Link>
                {pendingBooking.checkoutUrl ? (
                  <a href={pendingBooking.checkoutUrl}>
                    <Button variant="secondary" className="w-full sm:w-auto">
                      Continue reservation
                    </Button>
                  </a>
                ) : null}
                <Link href="/account">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Back to my bookings
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/#destinations">
                  <Button className="w-full sm:w-auto">Browse destinations</Button>
                </Link>
                {!viewerRole ? (
                  <Link href="/sign-in">
                    <Button variant="secondary" className="w-full sm:w-auto">Sign in</Button>
                  </Link>
                ) : (
                  <Link href="/account">
                    <Button variant="secondary" className="w-full sm:w-auto">Back to my bookings</Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAmount =
    draft.category === "stay" ? draft.priceAmount : draft.priceAmount * draft.guestCount;
  const authRedirect = `/sign-in?redirectTo=${encodeURIComponent("/checkout/continue")}`;
  const signUpRedirect = `/sign-up?redirectTo=${encodeURIComponent("/checkout/continue")}`;

  return (
    <div className="grid w-full max-w-[68rem] gap-4 sm:gap-5 lg:grid-cols-[1.05fr,0.95fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/40 px-4 py-4 sm:px-6 sm:py-6">
          <div className="gradient-chip w-fit">Booking review</div>
          <CardTitle>Review your trip before confirmation</CardTitle>
          <CardDescription>
            Your date is held for a few minutes only after you continue. Confirmed bookings are
            final, so this is your moment to double-check the details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6">
          <div className="rounded-[1.5rem] border border-border/70 bg-card px-4 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{draft.category}</Badge>
              <Badge variant="muted">{formatCurrency(draft.priceAmount)} each</Badge>
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">
              {draft.destinationTitle}
            </h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {draft.locationText}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {draft.serviceDate}
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                {draft.guestCount} guest{draft.guestCount > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {draft.serviceSnapshot?.title ?? "Service"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border/70 bg-background px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Contact name
              </p>
              <p className="mt-2 font-medium">{draft.contactName}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Contact email
              </p>
              <p className="mt-2 font-medium">{draft.contactEmail}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Contact phone
              </p>
              <p className="mt-2 font-medium">{draft.contactPhone}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notes</p>
              <p className="mt-2 font-medium text-foreground/80">
                {draft.notes || "No extra notes added yet."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Link href={`/listings/${draft.destinationSlug}`}>
              <Button variant="secondary" className="w-full sm:w-auto">Edit details</Button>
            </Link>
            <button
              type="button"
              onClick={() => {
                clearCheckoutDraft();
                setDraft(null);
              }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear checkout
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
          <div className="gradient-chip w-fit">Confirmation step</div>
          <CardTitle>{formatCurrency(totalAmount)}</CardTitle>
          <CardDescription>
            {viewerRole === "user"
              ? "You are signed in and ready to continue."
              : "Create or sign in to your account before you continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6">
          <div className="rounded-[1.6rem] border border-border/70 bg-muted/45 px-4 py-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Guests</span>
              <span className="font-medium">{draft.guestCount}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-muted-foreground">
                {draft.category === "stay" ? "Per stay unit" : "Per guest"}
              </span>
              <span className="font-medium">{formatCurrency(draft.priceAmount)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-border/70 pt-3">
              <span className="font-medium">Estimated total</span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Confirmed bookings are final. If you leave this unfinished, the temporary slot hold
            expires after 5 minutes.
          </div>

          {viewerRole && viewerRole !== "user" ? (
            <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Staff and admin accounts cannot complete traveler bookings.
            </div>
          ) : null}

          {!viewerRole && requiresAccount ? (
            <div className="space-y-3">
              <Link href={signUpRedirect as Route} className="block">
                <Button className="w-full justify-between">
                  Create account to continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={authRedirect as Route} className="block">
                <Button variant="secondary" className="w-full">
                  Sign in instead
                </Button>
              </Link>
              <p className="text-sm leading-6 text-muted-foreground">
                Your trip details stay saved in this browser, so you can come right back after
                creating your account.
              </p>
            </div>
          ) : null}

          {viewerRole === "user" || !requiresAccount ? (
            <div className="space-y-3">
              {viewerEmail ? (
                <p className="text-sm text-muted-foreground">
                  Signed in as <span className="font-medium text-foreground">{viewerEmail}</span>
                </p>
              ) : null}
              <Button
                className="w-full justify-between"
                disabled={isPending || Boolean(viewerRole && viewerRole !== "user")}
                onClick={() => {
                  void handleContinueToPayment();
                }}
              >
                {isPending ? "Opening secure step..." : "Continue to confirm booking"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
