"use client";

import { useState } from "react";
import {
  CalendarCheck2,
  Check,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";

import { BookingForm } from "@/components/forms/booking-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAbramMergedGuestRatePlan } from "@/lib/guest-pricing";
import { formatServiceTypeLabel } from "@/lib/service-types";
import { getBookableServices, getAdditionalServices } from "@/lib/service-categories";
import type { DestinationService, ListingCategory, UserRole } from "@/lib/types";
import { cn, formatPesoCurrency } from "@/lib/utils";

interface BrowserService {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  priceLabel: string;
  unitLabel: string;
  capacity: number;
  isMergedAbram: boolean;
}

export function BookingServiceBrowser({
  destinationId,
  destinationSlug,
  destinationTitle,
  locationText,
  category,
  services,
  coverUrl,
  initialServiceId,
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
  services: DestinationService[];
  coverUrl?: string | null;
  initialServiceId?: string;
  viewerRole?: UserRole | null;
  defaultContactName?: string;
  defaultContactEmail?: string;
  defaultContactPhone?: string;
  policies?: string[];
}) {
  const activeServices = services.filter((service) => service.is_active);
  const coreServices = getBookableServices(activeServices);
  const additionalServicesList = getAdditionalServices(activeServices);
  const mergedAbramRatePlan = getAbramMergedGuestRatePlan(
    destinationSlug,
    destinationTitle,
    activeServices
  );
  const browserServices: BrowserService[] = mergedAbramRatePlan
    ? [
        {
          id: mergedAbramRatePlan.primaryService.id,
          title: mergedAbramRatePlan.title,
          description: "Add Adult and Child visitors together in one resort reservation.",
          imageUrl: mergedAbramRatePlan.primaryService.image_url || coverUrl || null,
          priceLabel: `From ${formatPesoCurrency(
            Math.min(
              mergedAbramRatePlan.adult.priceAmount,
              mergedAbramRatePlan.child.priceAmount
            )
          )}`,
          unitLabel: `Adult ${formatPesoCurrency(mergedAbramRatePlan.adult.priceAmount)} · Child ${formatPesoCurrency(mergedAbramRatePlan.child.priceAmount)}`,
          capacity: mergedAbramRatePlan.primaryService.daily_capacity,
          isMergedAbram: true
        }
      ]
    : coreServices.map((service) => ({
        id: service.id,
        title: service.title,
        description: service.description || "Reserve this active destination service.",
        imageUrl: service.image_url || coverUrl || null,
        priceLabel: formatPesoCurrency(service.price_amount),
        unitLabel: `per ${formatServiceTypeLabel(service.service_type, { category })}`,
        capacity: service.daily_capacity,
        isMergedAbram: false
      }));
  const fallbackServiceId = browserServices[0]?.id ?? "";
  const requestedServiceId = browserServices.some((service) => service.id === initialServiceId)
    ? initialServiceId ?? fallbackServiceId
    : fallbackServiceId;
  const [selectedServiceId, setSelectedServiceId] = useState(requestedServiceId);
  const [selectedAdditionalServiceIds, setSelectedAdditionalServiceIds] = useState<string[]>([]);
  const selectedService = browserServices.find((service) => service.id === selectedServiceId);
  const selectedAdditionalServices = additionalServicesList.filter((service) =>
    selectedAdditionalServiceIds.includes(service.id)
  );

  const toggleAdditionalService = (serviceId: string) => {
    setSelectedAdditionalServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    );
  };

  const bookingForm = (serviceId: string) => (
    <BookingForm
      destinationId={destinationId}
      destinationSlug={destinationSlug}
      destinationTitle={destinationTitle}
      locationText={locationText}
      category={category}
      services={services}
      initialServiceId={serviceId}
      hideServiceSelector
      viewerRole={viewerRole}
      defaultContactName={defaultContactName}
      defaultContactEmail={defaultContactEmail}
      defaultContactPhone={defaultContactPhone}
      policies={policies}
      additionalServices={selectedAdditionalServices}
    />
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1.25fr,0.75fr,0.65fr] overflow-hidden rounded-[1rem] border border-border/70 bg-card shadow-[0_8px_24px_rgba(22,74,47,0.06)] sm:grid-cols-[1.4fr,0.8fr,0.8fr]">
        <a href="#booking-services" className="flex min-w-0 items-center gap-2.5 border-r border-border/70 px-3 py-3 sm:px-4">
          <CalendarCheck2 className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Date</p>
            <p className="truncate text-xs font-semibold sm:text-sm">Choose below</p>
          </div>
        </a>
        <a href="#booking-services" className="flex min-w-0 items-center gap-2 border-r border-border/70 px-3 py-3 sm:px-4">
          <Users className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Guests</p>
            <p className="truncate text-xs font-semibold sm:text-sm">Add next</p>
          </div>
        </a>
        <div className="flex min-w-0 items-center gap-2 px-3 py-3 sm:px-4">
          <span className="text-base font-bold text-primary">₱</span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Currency</p>
            <p className="truncate text-xs font-semibold sm:text-sm">PHP</p>
          </div>
        </div>
      </div>

      <div id="booking-services" className="scroll-mt-28 lg:hidden">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Core Services</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Choose and book</h2>
          </div>
          <Badge variant="muted">{browserServices.length} available</Badge>
        </div>

        <div className="space-y-4">
          {browserServices.map((service) => {
            const isSelected = service.id === selectedServiceId;
            return (
              <div key={service.id} className="space-y-2.5">
                <ServiceBookingCard
                  service={service}
                  category={category}
                  selected={isSelected}
                  onBook={() => setSelectedServiceId(service.id)}
                />
                {isSelected ? (
                  <Card className="border-primary/25 shadow-[0_14px_34px_rgba(22,74,47,0.1)]">
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-start justify-between gap-3 border-b border-border/70 pb-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Book this service</p>
                          <h3 className="mt-1 font-display text-xl font-semibold">{service.title}</h3>
                        </div>
                        <Badge variant="accent">Selected</Badge>
                      </div>
                      {additionalServicesList.length > 0 ? (
                        <div className="mb-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Additional Services</p>
                          <div className="grid gap-2">
                            {additionalServicesList.map((addon) => {
                              const isSelected = selectedAdditionalServiceIds.includes(addon.id);
                              return (
                                <button
                                  key={addon.id}
                                  type="button"
                                  onClick={() => toggleAdditionalService(addon.id)}
                                  className={`flex items-center justify-between rounded-[0.85rem] border px-3 py-2.5 text-left transition ${
                                    isSelected
                                      ? "border-primary bg-primary/5"
                                      : "border-border/70 hover:border-primary/30"
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">{addon.title}</p>
                                    <p className="text-xs text-muted-foreground">{formatPesoCurrency(addon.price_amount)}</p>
                                  </div>
                                  {isSelected ? <Badge variant="accent">Added</Badge> : <Badge variant="muted">Add</Badge>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                      {bookingForm(service.id)}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(17rem,0.62fr),minmax(36rem,1.38fr)]">
        <section className="space-y-3">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Core Services</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Choose what to book</h2>
            </div>
            <Badge variant="muted">{browserServices.length} available</Badge>
          </div>
          {browserServices.map((service) => (
            <ServiceBookingCard
              key={service.id}
              service={service}
              category={category}
              selected={service.id === selectedServiceId}
              onBook={() => setSelectedServiceId(service.id)}
            />
          ))}
        </section>

        <aside className="self-start lg:sticky lg:top-24">
          <Card className="border-primary/20 shadow-[0_16px_40px_rgba(22,74,47,0.1)]">
            <CardContent className="p-4 xl:p-5">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-border/70 pb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Complete your booking</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold">{selectedService?.title}</h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {locationText}</p>
                </div>
                <Badge variant="accent">Selected</Badge>
              </div>
              {selectedService && additionalServicesList.length > 0 ? (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Add-ons</p>
                  <div className="grid gap-2">
                    {additionalServicesList.map((addon) => {
                      const isSelected = selectedAdditionalServiceIds.includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAdditionalService(addon.id)}
                          className={`flex items-center justify-between rounded-[0.85rem] border px-3 py-2.5 text-left transition ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border/70 hover:border-primary/30"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{addon.title}</p>
                            <p className="text-xs text-muted-foreground">{formatPesoCurrency(addon.price_amount)}</p>
                          </div>
                          {isSelected ? <Badge variant="accent">Added</Badge> : <Badge variant="muted">Add</Badge>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {selectedServiceId ? bookingForm(selectedServiceId) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ServiceBookingCard({
  service,
  category,
  selected,
  onBook
}: {
  service: BrowserService;
  category: ListingCategory;
  selected: boolean;
  onBook: () => void;
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[1.15rem] border bg-card transition duration-200",
        selected
          ? "border-primary shadow-[0_12px_30px_rgba(22,74,47,0.1)] ring-1 ring-primary/15"
          : "border-border/70 hover:border-primary/30"
      )}
    >
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-semibold tracking-tight">{service.title}</h3>
              {selected ? <Badge variant="accent">Selected</Badge> : null}
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{service.description}</p>
          </div>
          <span className="shrink-0 text-right text-xs text-muted-foreground">
            Max {service.capacity}
          </span>
        </div>

        {service.imageUrl ? (
          <div className="relative mt-3 min-h-[12rem] overflow-hidden rounded-[0.95rem] bg-muted sm:min-h-[15rem]">
            <img src={service.imageUrl} alt={service.title} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3 pt-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" /> Core service
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> Up to {service.capacity} guests</span>
          <span className="inline-flex items-center gap-1.5"><CalendarCheck2 className="h-3.5 w-3.5 text-primary" /> Choose date after Book</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> Secure checkout</span>
          {service.isMergedAbram ? <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Adult + Child together</span> : null}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr),minmax(9rem,0.82fr)] items-stretch border-t border-border/70 bg-muted/20">
        <div className="flex min-w-0 items-center gap-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{category === "stay" ? "Rooms" : "Guests"}</p>
            <p className="truncate text-sm font-semibold text-primary">{service.priceLabel}</p>
            <p className="truncate text-[10px] text-muted-foreground">{service.unitLabel}</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <div className="border-l border-border/70 p-2">
          <Button className="h-full min-h-12 w-full rounded-[0.9rem]" onClick={onBook}>
            {selected ? "Booking open" : "Book"}
          </Button>
        </div>
      </div>
      <p className="px-4 py-2 text-right text-[10px] text-muted-foreground">You won&apos;t be charged yet</p>
    </article>
  );
}
