"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AvailabilityCalendarPanel } from "@/components/forms/availability-calendar-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAvailabilityState } from "@/lib/availability";
import { formatServiceWindowLabel } from "@/lib/booking-state";
import { writeCheckoutDraft } from "@/lib/checkout-draft";
import type { AvailabilitySnapshot, DestinationService, ListingCategory, UserRole } from "@/lib/types";
import { formatCurrency, formatPesoCurrency, pesoAmountToCentavos } from "@/lib/utils";
import Link from "next/link";

export function BookingForm({
  destinationId,
  destinationSlug,
  destinationTitle,
  locationText,
  category,
  services = [],
  viewerRole,
  defaultContactName,
  defaultContactEmail,
  defaultContactPhone
}: {
  destinationId: string;
  destinationSlug: string;
  destinationTitle: string;
  locationText: string;
  category: ListingCategory;
  services?: DestinationService[];
  viewerRole?: UserRole | null;
  defaultContactName?: string;
  defaultContactEmail?: string;
  defaultContactPhone?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceDate, setServiceDate] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const bookableServices = services.filter((service) => service.is_active);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    bookableServices[0]?.id ?? ""
  );
  const [availability, setAvailability] = useState<AvailabilitySnapshot | null>(null);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);

  const selectedService = bookableServices.find((s) => s.id === selectedServiceId) ?? null;

  useEffect(() => {
    if (bookableServices.length === 0) {
      setSelectedServiceId("");
      return;
    }

    if (!bookableServices.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId(bookableServices[0]?.id ?? "");
    }
  }, [bookableServices, selectedServiceId]);

  useEffect(() => {
    if (!serviceDate || !selectedServiceId) {
      setAvailability(null);
      return;
    }

    let isActive = true;

    async function loadAvailability() {
      setIsAvailabilityLoading(true);

      try {
        const response = await fetch(
          `/api/destinations/${destinationId}/availability?serviceDate=${encodeURIComponent(serviceDate)}&serviceId=${encodeURIComponent(selectedServiceId)}`,
          {
            cache: "no-store"
          }
        );
        const body = (await response.json()) as {
          error?: string;
          availability?: AvailabilitySnapshot | null;
        };

        if (!response.ok) {
          throw new Error(body.error ?? "Unable to load availability.");
        }

        if (isActive) {
          setError(null);
          setAvailability(body.availability ?? null);
        }
      } catch (availabilityError) {
        if (isActive) {
          setAvailability(null);
          setError(
            availabilityError instanceof Error
              ? availabilityError.message
              : "Unable to load availability."
          );
        }
      } finally {
        if (isActive) {
          setIsAvailabilityLoading(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      isActive = false;
    };
  }, [destinationId, serviceDate, selectedServiceId]);

  async function handleSubmit(formData: FormData) {
    if (viewerRole && viewerRole !== "user") {
      setError("Bookings can only be completed with a traveler account.");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const availabilityState = getAvailabilityState(availability, guestCount);
      if (!serviceDate) {
        throw new Error("Choose a service date before continuing.");
      }

      if (!availabilityState.canBook) {
        throw new Error(availabilityState.message);
      }

      if (!selectedService) {
        throw new Error("Please select a service package first.");
      }

      writeCheckoutDraft({
        destinationId,
        destinationSlug,
        destinationTitle,
        locationText,
        category,
        priceAmount: pesoAmountToCentavos(selectedService.price_amount),
        serviceDate,
        guestCount,
        contactName: String(formData.get("contactName") ?? ""),
        contactEmail: String(formData.get("contactEmail") ?? ""),
        contactPhone: String(formData.get("contactPhone") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        serviceId: selectedService.id,
        serviceSnapshot: {
          id: selectedService.id,
          title: selectedService.title,
          description: selectedService.description,
          price_amount: selectedService.price_amount,
          service_type: selectedService.service_type
        }
      });
      router.push("/checkout/continue" as Route);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to prepare your checkout."
      );
    } finally {
      setIsPending(false);
    }
  }

  const availabilityState = getAvailabilityState(availability, guestCount);
  const availabilityToneClass =
    availabilityState.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : availabilityState.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : availabilityState.tone === "destructive"
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : "border-border/70 bg-muted/45 text-muted-foreground";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-4 sm:space-y-[1.125rem]"
    >
      <div className="rounded-[1.15rem] border border-border/70 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
        Take one last look at the trip details first. Your chosen date is only held for a few
        minutes after you continue.
      </div>

      {bookableServices.length === 0 ? (
        <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive">
          There are no bookable packages here right now. Check back soon for fresh dates and offers.
        </div>
      ) : (
        <div className="space-y-3">
          <span className="text-sm font-medium">Choose a package</span>
          <div className="grid gap-2.5">
            {bookableServices.map((service) => (
              <label
                key={service.id}
                className={`grid cursor-pointer select-none grid-cols-[auto,minmax(0,1fr)] gap-3 rounded-[0.95rem] border p-3.5 transition-colors hover:border-primary/50 sm:p-4 ${
                  selectedServiceId === service.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border/70"
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    type="radio"
                    name="serviceId"
                    value={service.id}
                    className="sr-only"
                    checked={selectedServiceId === service.id}
                    onChange={() => {
                      setError(null);
                      setSelectedServiceId(service.id);
                    }}
                  />
                  {service.image_url ? (
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[0.85rem] border border-border/70 bg-muted/40 sm:h-16 sm:w-16">
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="grid min-w-0 gap-1">
                    <span className="text-sm font-medium text-foreground">
                      {service.title}
                    </span>
                    {service.description ? (
                      <span className="text-xs leading-5 text-muted-foreground line-clamp-2">
                        {service.description}
                      </span>
                    ) : null}
                    <span className="text-[11px] leading-5 text-muted-foreground">
                      {formatServiceWindowLabel({
                        availabilityStartDate: service.availability_start_date,
                        availabilityEndDate: service.availability_end_date
                      })}
                    </span>
                  </div>
                </div>
                <div className="col-span-full flex items-end justify-between gap-3 border-t border-border/60 pt-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Rate
                    </p>
                    <span className="text-base font-semibold tracking-tight text-foreground">
                      {formatPesoCurrency(service.price_amount)}
                    </span>
                  </div>
                  <p className="text-[10px] tracking-[0.14em] text-muted-foreground">
                    {category === "stay" ? "/ stay" : "/ person"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedService ? (
        <AvailabilityCalendarPanel
          destinationId={destinationId}
          serviceId={selectedService.id}
          selectedDate={serviceDate}
          onSelectDate={(nextDate) => {
            setError(null);
            setServiceDate(nextDate);
          }}
        />
      ) : null}

      {selectedService ? (
        <>
              <div className="rounded-[1rem] border border-border/70 bg-muted/30 px-3.5 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Selected date
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {serviceDate || "Choose a date from the calendar above"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {`Bookable window: ${formatServiceWindowLabel({
                availabilityStartDate: selectedService.availability_start_date,
                availabilityEndDate: selectedService.availability_end_date
              })}.`}
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Guests</span>
            <Input
              name="guestCount"
              type="number"
              min={1}
              max={selectedService.daily_capacity ?? 200}
              value={guestCount}
              onChange={(event) => {
                setError(null);
                setGuestCount(Number(event.target.value || 1));
              }}
              required
            />
          </label>

          <div className={`rounded-[1rem] border px-3.5 py-3 text-sm ${availabilityToneClass}`}>
            {isAvailabilityLoading ? "Checking live availability..." : availabilityState.message}
          </div>

          {viewerRole === "user" ? (
            <div className="space-y-4 pt-2 sm:space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Contact name</span>
                <Input
                  name="contactName"
                  placeholder="Full name"
                  defaultValue={defaultContactName}
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Email</span>
                <Input
                  name="contactEmail"
                  type="email"
                  placeholder="name@example.com"
                  defaultValue={defaultContactEmail}
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Phone</span>
                <Input
                  name="contactPhone"
                  placeholder="+63 917 000 0000"
                  defaultValue={defaultContactPhone}
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Notes</span>
                <Textarea
                  name="notes"
                  placeholder="Dietary requests, arrival notes, pickup details, or anything staff should know."
                />
              </label>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border-2 border-primary/20 bg-background px-3.5 py-3">
                <span className="text-sm font-medium">Total</span>
                <span className="font-display text-xl font-semibold text-primary">
                  {formatCurrency(
                    category === "stay"
                      ? pesoAmountToCentavos(selectedService.price_amount)
                      : pesoAmountToCentavos(selectedService.price_amount) * guestCount
                  )}
                </span>
              </div>

              <Button
                className="w-full h-11"
                type="submit"
                disabled={isPending || !availabilityState.canBook || isAvailabilityLoading}
              >
                {isPending ? "Saving checkout..." : "Continue to checkout"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-4 sm:space-y-[1.125rem]">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border-2 border-primary/20 bg-background px-3.5 py-3">
                <span className="text-sm font-medium text-muted-foreground">Estimated Total</span>
                <span className="font-display text-xl font-semibold text-muted-foreground">
                  {formatCurrency(
                    category === "stay"
                      ? pesoAmountToCentavos(selectedService.price_amount)
                      : pesoAmountToCentavos(selectedService.price_amount) * guestCount
                  )}
                </span>
              </div>
              <p className="text-center text-sm leading-6 text-muted-foreground">
                Sign in with your traveler account when you are ready to reserve this date.
              </p>
              <Link href="/sign-in" className="block">
                <Button className="w-full h-11" variant="secondary" type="button">
                  Sign in to Book
                </Button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-[1rem] border border-border/70 bg-muted/35 px-3.5 py-3.5 text-sm leading-6 text-muted-foreground">
          Choose one of the packages above to view open dates and continue planning your trip.
        </div>
      )}
    </form>
  );
}
