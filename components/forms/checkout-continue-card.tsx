"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CreditCard, MapPin, ShieldCheck, Smartphone, Users, WalletCards } from "lucide-react";

import { clearCheckoutDraft, readCheckoutDraft, type CheckoutDraft } from "@/lib/checkout-draft";
import type { UserRole } from "@/lib/types";
import { formatCurrency, pesoAmountToCentavos } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CheckoutContinueCard({
  viewerRole,
  viewerEmail,
  requiresAccount,
  paymentMethods,
  pendingBooking
}: {
  viewerRole: UserRole | null;
  viewerEmail: string | null;
  requiresAccount: boolean;
  paymentMethods: string[];
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const paymentMethodLabels: Record<string, string> = {
    gcash: "GCash",
    card: "Credit or debit card",
    grab_pay: "GrabPay",
    paymaya: "Maya",
    billease: "BillEase"
  };

  useEffect(() => {
    setDraft(readCheckoutDraft());
    setIsLoading(false);
  }, []);

  async function handleContinueToPayment() {
    if (!draft) {
      return;
    }

    if (!termsAccepted) {
      setError("Accept the destination policies and Privacy Notice before continuing.");
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
          guestTypes: draft.guestTypes,
          guestDetails: draft.guestDetails,
          contactName: draft.contactName,
          contactEmail: draft.contactEmail,
          contactPhone: draft.contactPhone,
          notes: draft.notes,
          termsAccepted,
          additionalServices: draft.additionalServices
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
    draft.guestTypes && draft.guestPricing
      ? draft.guestTypes.reduce(
          (total, guestType) =>
            total +
            (guestType === "child"
              ? draft.guestPricing!.child.priceAmount
              : draft.guestPricing!.adult.priceAmount),
          0
        )
      : draft.category === "stay"
        ? draft.priceAmount
        : draft.priceAmount * draft.guestCount;
  const adultGuestCount = draft.guestTypes?.filter((type) => type === "adult").length ?? 0;
  const childGuestCount = draft.guestTypes?.filter((type) => type === "child").length ?? 0;

  const additionalServicesList = (draft.serviceSnapshot as any)?.additional_services ?? [];
  const addonsTotalAmount = additionalServicesList.reduce((sum: number, addon: any) => {
    return sum + (pesoAmountToCentavos(addon.price_amount) * addon.quantity);
  }, 0);
  const grandTotalAmount = totalAmount + addonsTotalAmount;
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
              <Badge variant="muted">
                {draft.guestTypes ? "Adult & Child rates" : `${formatCurrency(draft.priceAmount)} each`}
              </Badge>
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
                {draft.guestTypes
                  ? `${adultGuestCount} Adult, ${childGuestCount} Child`
                  : `${draft.guestCount} guest${draft.guestCount > 1 ? "s" : ""}`}
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
          <div className="gradient-chip w-fit">Payment method</div>
          <CardTitle>{formatCurrency(grandTotalAmount)}</CardTitle>
          <CardDescription>
            {viewerRole === "user"
              ? "You are signed in and ready to continue."
              : "Create or sign in to your account before you continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6">
          <div>
            <p className="text-sm font-semibold">Supported secure payment options</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Choose your preferred option on PayMongo&apos;s secure payment page.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {paymentMethods.map((method) => {
                const MethodIcon = method === "card" ? CreditCard : method === "billease" ? WalletCards : Smartphone;
                return (
                  <div key={method} className="flex items-center gap-2.5 rounded-[0.9rem] border border-border/70 bg-card px-3 py-2.5 text-xs font-medium">
                    <MethodIcon className="h-4 w-4 text-primary" />
                    {paymentMethodLabels[method] ?? method}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-border/70 bg-muted/45 px-4 py-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Guests</span>
              <span className="font-medium">{draft.guestCount}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-muted-foreground">
                {draft.guestTypes ? "Adult guests" : draft.category === "stay" ? "Per stay unit" : "Per guest"}
              </span>
              <span className="font-medium">
                {draft.guestTypes && draft.guestPricing
                  ? `${adultGuestCount} × ${formatCurrency(draft.guestPricing.adult.priceAmount)}`
                  : formatCurrency(draft.priceAmount)}
              </span>
            </div>
            {draft.guestTypes && draft.guestPricing ? (
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Child guests</span>
                <span className="font-medium">{childGuestCount} × {formatCurrency(draft.guestPricing.child.priceAmount)}</span>
              </div>
            ) : null}
            {additionalServicesList.length > 0 && (
              <div className="border-t border-dashed border-border/60 pt-3 mt-3 space-y-3">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                  Additional Services
                </p>
                {additionalServicesList.map((addon: any) => (
                  <div key={addon.id} className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground text-xs">{addon.title} (Qty: {addon.quantity})</span>
                    <span className="font-medium text-xs">
                      {formatCurrency(pesoAmountToCentavos(addon.price_amount) * addon.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-border/70 pt-3">
              <span className="font-medium">Estimated total</span>
              <span className="font-semibold">{formatCurrency(grandTotalAmount)}</span>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Pending reservations may be cancelled immediately. Confirmed, unused bookings may be
            cancelled with a full refund before check-in if the destination payout is not settled.
          </div>

          {draft.policies?.length ? (
            <div className="rounded-[1.2rem] border border-border/70 p-4 text-sm">
              <p className="font-semibold">Destination policies and requirements</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {draft.policies.map((policy) => <li key={policy}>{policy}</li>)}
              </ul>
            </div>
          ) : null}

          <label className="flex items-start gap-3 rounded-[1rem] border border-border/70 bg-muted/30 p-3 text-sm leading-6">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              I accept the destination policies, cancellation terms, and <Link href={"/privacy" as Route} target="_blank" className="font-semibold text-primary underline">Privacy Notice</Link>.
            </span>
          </label>

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
                disabled={isPending || !termsAccepted || Boolean(viewerRole && viewerRole !== "user")}
                onClick={() => {
                  void handleContinueToPayment();
                }}
              >
                {isPending ? "Opening secure payment..." : "Continue to secure payment"}
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
