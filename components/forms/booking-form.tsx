"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AvailabilityCalendarPanel } from "@/components/forms/availability-calendar-panel";
import { AbramBookingWizard } from "@/components/forms/abram-booking-wizard";
import { ServiceImagePreview } from "@/components/site/service-image-preview";
import { Button } from "@/components/ui/button";
import { ExpandableText } from "@/components/ui/expandable-text";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAvailabilityState } from "@/lib/availability";
import { formatServiceWindowLabel } from "@/lib/booking-state";
import { writeCheckoutDraft } from "@/lib/checkout-draft";
import { formatServiceTypeLabel, normalizeServiceTypeLabel } from "@/lib/service-types";
import { getAbramMergedGuestRatePlan } from "@/lib/guest-pricing";
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
  initialServiceId,
  hideServiceSelector = false,
  viewerRole,
  defaultContactName,
  defaultContactEmail,
  defaultContactPhone,
  policies = []
}: {
  destinationId: string;
  destinationSlug: string;
  destinationTitle: string;
  locationText: string;
  category: ListingCategory;
  services?: DestinationService[];
  initialServiceId?: string;
  hideServiceSelector?: boolean;
  viewerRole?: UserRole | null;
  defaultContactName?: string;
  defaultContactEmail?: string;
  defaultContactPhone?: string;
  policies?: string[];
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceDate, setServiceDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [guestCount, setGuestCount] = useState(1);
  const [guestNames, setGuestNames] = useState<string[]>([defaultContactName ?? ""]);
  const bookableServices = services.filter((service) => service.is_active);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    bookableServices.some((service) => service.id === initialServiceId)
      ? initialServiceId ?? ""
      : bookableServices[0]?.id ?? ""
  );
  const [availability, setAvailability] = useState<AvailabilitySnapshot | null>(null);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);

  const selectedService = bookableServices.find((s) => s.id === selectedServiceId) ?? null;

  const basePriceCentavos = selectedService
    ? category === "stay"
      ? pesoAmountToCentavos(selectedService.price_amount)
      : pesoAmountToCentavos(selectedService.price_amount) * guestCount
    : 0;

  const localGrandTotalCentavos = basePriceCentavos;

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
    if (
      initialServiceId &&
      bookableServices.some((service) => service.id === initialServiceId)
    ) {
      setSelectedServiceId(initialServiceId);
      setServiceDate("");
      setCheckOutDate("");
      setCheckOutTime("12:00");
      setAvailability(null);
      setError(null);
    }
  }, [initialServiceId]);

  useEffect(() => {
    if (!serviceDate) {
      setCheckOutDate("");
      return;
    }

    setCheckOutDate((current) => {
      if (!current) {
        return serviceDate;
      }
      return current < serviceDate ? serviceDate : current;
    });
  }, [serviceDate]);

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

      if (!checkOutDate || !checkOutTime) {
        throw new Error("Select a check-out date and time before continuing.");
      }

      if (!availabilityState.canBook) {
        throw new Error(availabilityState.message);
      }

      if (!selectedService) {
        throw new Error("Please select a service package first.");
      }

      const guestDetails = guestNames.slice(0, guestCount).map((name) => ({
        name: name.trim(),
        type: "adult" as const
      }));
      if (guestDetails.length !== guestCount || guestDetails.some((guest) => guest.name.length < 2)) {
        throw new Error("Enter the full name of every guest so each QR pass can be issued correctly.");
      }

      writeCheckoutDraft({
        destinationId,
        destinationSlug,
        destinationTitle,
        locationText,
        category,
        priceAmount: pesoAmountToCentavos(selectedService.price_amount),
        serviceDate,
        checkOutDate,
        checkOutTime,
        guestCount,
        guestDetails,
        contactName: String(formData.get("contactName") ?? ""),
        contactEmail: String(formData.get("contactEmail") ?? ""),
        contactPhone: String(formData.get("contactPhone") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        policies,
        serviceId: selectedService.id,
        serviceSnapshot: {
          id: selectedService.id,
          title: selectedService.title,
          description: selectedService.description,
          price_amount: selectedService.price_amount,
          service_type: normalizeServiceTypeLabel(selectedService.service_type, category),
          additional_services: []
        },
        additionalServices: []
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

  const mergedAbramRatePlan = getAbramMergedGuestRatePlan(
    destinationSlug,
    destinationTitle,
    bookableServices
  );

  if (mergedAbramRatePlan) {
    return (
      <AbramBookingWizard
        destinationId={destinationId}
        destinationSlug={destinationSlug}
        destinationTitle={destinationTitle}
        locationText={locationText}
        category={category}
        ratePlan={mergedAbramRatePlan}
        viewerRole={viewerRole}
        defaultContactName={defaultContactName}
        defaultContactEmail={defaultContactEmail}
        defaultContactPhone={defaultContactPhone}
        policies={policies}
      />
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-4 sm:space-y-[1.125rem]"
    >
      <div className="rounded-[1.15rem] border border-border/70 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground xl:hidden">
        Take one last look at the trip details first. Your chosen date is only held for a few
        minutes after you continue.
      </div>

      {hideServiceSelector ? null : bookableServices.length === 0 ? (
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
                    <ServiceImagePreview
                      imageUrl={service.image_url}
                      title={service.title}
                      buttonClassName="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
                    />
                  ) : null}
                  <div className="grid min-w-0 gap-1">
                    <span className="text-sm font-medium text-foreground">
                      {service.title}
                    </span>
                    {service.description ? (
                      <ExpandableText
                        text={service.description}
                        className="min-w-0"
                        textClassName="text-xs leading-5 text-muted-foreground"
                        collapsedClassName="line-clamp-2"
                        expandLabel="More"
                        collapseLabel="Less"
                      />
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
                    {formatServiceTypeLabel(service.service_type, {
                      category,
                      includeSlash: true
                    })}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedService ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(21rem,1.05fr),minmax(19rem,0.95fr)] xl:items-start">
          <AvailabilityCalendarPanel
            destinationId={destinationId}
            serviceId={selectedService.id}
            selectedDate={serviceDate}
            onSelectDate={(nextDate) => {
              setError(null);
              setServiceDate(nextDate);
            }}
            compactDesktop
          />

          <div className="space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr),8rem] xl:grid-cols-[minmax(0,1fr),7.5rem]">
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

                {serviceDate ? (
                  <div className="mt-3 space-y-2.5 rounded-[0.9rem] border border-border/70 bg-background px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                      Select check-out date & time
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Check-out date</span>
                        <Input
                          type="date"
                          value={checkOutDate}
                          min={serviceDate}
                          onChange={(event) => {
                            setError(null);
                            setCheckOutDate(event.target.value);
                          }}
                          required
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Check-out time</span>
                        <Input
                          type="time"
                          value={checkOutTime}
                          onChange={(event) => {
                            setError(null);
                            setCheckOutTime(event.target.value);
                          }}
                          required
                        />
                      </label>
                    </div>
                  </div>
                ) : null}
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
                    const nextCount = Math.max(1, Number(event.target.value || 1));
                    setGuestCount(nextCount);
                    setGuestNames((current) =>
                      Array.from(
                        { length: nextCount },
                        (_, index) => current[index] ?? (index === 0 ? defaultContactName ?? "" : "")
                      )
                    );
                  }}
                  required
                />
              </label>
            </div>

            <div className={`rounded-[1rem] border px-3.5 py-3 text-sm ${availabilityToneClass}`}>
              {isAvailabilityLoading ? "Checking live availability..." : availabilityState.message}
            </div>

            {viewerRole === "user" ? (
              <div className="space-y-3.5">
                <div className="space-y-2.5 rounded-[1rem] border border-border/70 bg-muted/30 p-3.5">
                  <div>
                    <p className="text-sm font-medium">Guest names</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Each guest receives an individual ticket and scannable QR code.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    {guestNames.slice(0, guestCount).map((name, index) => (
                      <label key={index} className="block space-y-1.5">
                        <span className="text-xs font-medium">Guest {index + 1} full name</span>
                        <Input
                          value={name}
                          onChange={(event) => {
                            const nextName = event.target.value;
                            setGuestNames((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index ? nextName : entry
                              )
                            );
                            setError(null);
                          }}
                          autoComplete="name"
                          required
                          minLength={2}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">Contact name</span>
                    <Input
                      name="contactName"
                      placeholder="Full name"
                      defaultValue={defaultContactName}
                      required
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">Email</span>
                    <Input
                      name="contactEmail"
                      type="email"
                      placeholder="name@example.com"
                      defaultValue={defaultContactEmail}
                      required
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">Phone</span>
                    <Input
                      name="contactPhone"
                      placeholder="+63 917 000 0000"
                      defaultValue={defaultContactPhone}
                      required
                    />
                  </label>

                  <label className="block space-y-1.5 sm:col-span-2 xl:col-span-1 2xl:col-span-2">
                    <span className="text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span></span>
                    <Textarea
                      name="notes"
                      className="min-h-20 resize-y"
                      placeholder="Requests or arrival notes"
                    />
                  </label>
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <div className="grid grid-cols-[minmax(0,0.72fr),minmax(10rem,1fr)] gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-[0.9rem] border-2 border-primary/20 bg-background px-3 py-2.5">
                    <span className="text-xs font-medium">Total</span>
                    <span className="font-display text-lg font-semibold text-primary">
                      {formatCurrency(localGrandTotalCentavos)}
                    </span>
                  </div>

                  <Button
                    className="h-full min-h-11 w-full"
                    type="submit"
                    disabled={
                      isPending ||
                      !availabilityState.canBook ||
                      isAvailabilityLoading ||
                      !serviceDate ||
                      !checkOutDate ||
                      !checkOutTime
                    }
                  >
                    {isPending ? "Saving checkout..." : "Continue to checkout"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border-2 border-primary/20 bg-background px-3.5 py-3">
                  <span className="text-sm font-medium text-muted-foreground">Estimated Total</span>
                  <span className="font-display text-xl font-semibold text-muted-foreground">
                    {formatCurrency(localGrandTotalCentavos)}
                  </span>
                </div>
                <p className="text-center text-sm leading-6 text-muted-foreground">
                  Sign in with your traveler account when you are ready to reserve this date.
                </p>
                <Link href="/sign-in" className="block">
                  <Button className="h-11 w-full" variant="secondary" type="button">
                    Sign in to Book
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-[1rem] border border-border/70 bg-muted/35 px-3.5 py-3.5 text-sm leading-6 text-muted-foreground">
          Choose one of the packages above to view open dates and continue planning your trip.
        </div>
      )}
    </form>
  );
}
