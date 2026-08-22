"use client";

import { useState } from "react";
import type { Route } from "next";
import { CalendarCheck2, Check, Clock3, Info, Sparkles, Users } from "lucide-react";

import { PackageBookingAction } from "@/components/site/package-booking-action";
import { Badge } from "@/components/ui/badge";
import { formatServiceTypeLabel } from "@/lib/service-types";
import { formatOpenWeekdays, formatOperatingTime } from "@/lib/service-schedule";
import type { DestinationService, ListingCategory } from "@/lib/types";
import { formatPesoCurrency } from "@/lib/utils";

type MergedAbramRatePlan = {
  title: string;
  primaryService: DestinationService;
  adult: { priceAmount: number };
  child: { priceAmount: number };
} | null;

export function DestinationServicesSection({
  destinationSlug,
  bookingType,
  category,
  leadImage,
  coreServices,
  additionalServices,
  mergedAbramRatePlan
}: {
  destinationSlug: string;
  bookingType: "online" | "walk-in";
  category: ListingCategory;
  leadImage: string;
  coreServices: DestinationService[];
  additionalServices: DestinationService[];
  mergedAbramRatePlan: MergedAbramRatePlan;
}) {
  const [filter, setFilter] = useState<"all" | "core" | "additional">("all");

  const displayedPackageServices = mergedAbramRatePlan
    ? [mergedAbramRatePlan.primaryService]
    : coreServices;

  const showCore = filter === "all" || filter === "core";
  const showAdditional = filter === "all" || filter === "additional";

  if (coreServices.length === 0 && additionalServices.length === 0) {
    return null;
  }

  return (
    <div className="pt-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.85rem] bg-primary text-primary-foreground">
            <Clock3 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-2xl font-semibold">Available packages</h3>
            <p className="text-xs text-muted-foreground">Compare the details and book your preferred option.</p>
          </div>
        </div>

        <div className="inline-flex w-fit gap-1 rounded-full border border-border/70 bg-muted/30 p-1">
          <FilterTab label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterTab label="Core Services" active={filter === "core"} onClick={() => setFilter("core")} />
          <FilterTab
            label="Additional Services"
            active={filter === "additional"}
            onClick={() => setFilter("additional")}
          />
        </div>
      </div>

      {showCore && displayedPackageServices.length > 0 ? (
        <div className="space-y-5">
          {displayedPackageServices.map((service) => {
            const packageTitle = mergedAbramRatePlan?.title ?? service.title;
            const startingPrice = mergedAbramRatePlan
              ? Math.min(mergedAbramRatePlan.adult.priceAmount, mergedAbramRatePlan.child.priceAmount)
              : service.price_amount;
            const servicePhotos = service.image_urls?.length
              ? service.image_urls
              : service.image_url
                ? [service.image_url]
                : [];

            return (
              <article
                key={service.id}
                className="rounded-[1.2rem] border border-border/70 bg-card p-3 shadow-[0_10px_28px_rgba(22,74,47,0.055)] sm:p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3 px-1 sm:mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-2xl font-semibold tracking-tight">{packageTitle}</h4>
                      <Badge variant="accent">Bookable Package</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Book this option through the destination&apos;s secure reservation flow.
                    </p>
                  </div>
                  <Badge variant="muted" className="shrink-0">
                    {formatServiceTypeLabel(service.service_type, { category })}
                  </Badge>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr),minmax(22rem,0.95fr)]">
                  <div className="min-w-0">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[1rem] bg-muted">
                      <img
                        src={servicePhotos[0] || leadImage}
                        alt={service.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-[1.025]"
                      />
                      <Badge variant="muted" className="absolute bottom-3 left-3 border-white/60 bg-black/55 text-white shadow-sm backdrop-blur-sm">
                        Package photo
                      </Badge>
                    </div>

                    {servicePhotos.length > 1 ? (
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {servicePhotos.slice(1, 5).map((url, photoIndex) => (
                          <img
                            key={`${url}-${photoIndex}`}
                            src={url}
                            alt={`${service.title} photo ${photoIndex + 2}`}
                            className="aspect-[4/3] w-full rounded-[0.7rem] object-cover"
                          />
                        ))}
                      </div>
                    ) : null}

                    {service.description ? (
                      <details className="group mt-3 rounded-[0.9rem] bg-muted/35 px-3.5 py-3">
                        <summary className="cursor-pointer list-none text-sm font-semibold text-primary marker:hidden">
                          See package description
                        </summary>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p>
                      </details>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-b border-border/70 pb-3 text-xs font-medium text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" /> Up to {service.daily_capacity} guest
                        {service.daily_capacity === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-accent" /> Confirmed service
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarCheck2 className="h-3.5 w-3.5 text-primary" /> Date checked during booking
                      </span>
                    </div>

                    {service.unit_count || service.unit_label || service.features?.length ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-border/70 pb-3">
                        {service.unit_count || service.unit_label ? (
                          <Badge variant="accent">
                            {service.unit_count ?? ""} {service.unit_label ?? "Units"}
                          </Badge>
                        ) : null}
                        {service.features?.map((feature) => (
                          <Badge key={feature} variant="muted">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="overflow-hidden rounded-[1rem] border border-primary/25 bg-background">
                    <div className="bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                      Direct booking rate
                    </div>
                    <div className="flex min-h-[18rem] flex-col p-4">
                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr),auto] sm:items-start">
                        <div className="space-y-2.5 text-sm">
                          <p className="flex items-start gap-2">
                            <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>Up to {service.daily_capacity} guest{service.daily_capacity === 1 ? "" : "s"}</span>
                          </p>
                          <p className="flex items-start gap-2 text-emerald-700">
                            <Check className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>Availability confirmed before checkout</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>Secure online payment</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>
                              {service.opening_time && service.closing_time
                                ? `${formatOperatingTime(service.opening_time)} – ${formatOperatingTime(service.closing_time)}`
                                : "Operating hours available from staff"}
                              {` · ${formatOpenWeekdays(service.open_weekdays)}`}
                            </span>
                          </p>
                          {service.operating_remarks ? (
                            <p className="flex items-start gap-2 text-muted-foreground">
                              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>{service.operating_remarks}</span>
                            </p>
                          ) : null}
                          {mergedAbramRatePlan ? (
                            <p className="flex items-start gap-2">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>Adults and children in one reservation</span>
                            </p>
                          ) : null}
                        </div>

                        <div className="text-left sm:min-w-40 sm:text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                            Starting rate
                          </p>
                          <p className="mt-1 font-display text-3xl font-semibold text-primary">
                            {formatPesoCurrency(startingPrice)}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {mergedAbramRatePlan
                              ? "per guest, based on type"
                              : `per ${formatServiceTypeLabel(service.service_type, { category })}`}
                          </p>
                        </div>
                      </div>

                      {mergedAbramRatePlan ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant="muted">Adult {formatPesoCurrency(mergedAbramRatePlan.adult.priceAmount)}</Badge>
                          <Badge variant="muted">Child {formatPesoCurrency(mergedAbramRatePlan.child.priceAmount)}</Badge>
                        </div>
                      ) : null}

                      <div className="mt-auto pt-4">
                        <PackageBookingAction
                          destinationSlug={destinationSlug}
                          bookingType={bookingType}
                          category={category === "stay" ? "stay" : "tour"}
                          options={displayedPackageServices.map((packageService) => ({
                            id: packageService.id,
                            title: mergedAbramRatePlan?.title ?? packageService.title,
                            priceLabel: formatPesoCurrency(
                              mergedAbramRatePlan
                                ? Math.min(mergedAbramRatePlan.adult.priceAmount, mergedAbramRatePlan.child.priceAmount)
                                : packageService.price_amount
                            )
                          }))}
                          initialServiceId={service.id}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {showCore && showAdditional && additionalServices.length > 0 ? (
        <div className="my-6 h-px bg-border/60" />
      ) : null}

      {showAdditional ? (
        additionalServices.length > 0 ? (
          <div className="space-y-3.5">
            {filter === "additional" ? (
              <p className="text-sm leading-6 text-muted-foreground">
                Optional extras you can arrange alongside your booking — ask the destination team to include these when you arrive.
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {additionalServices.map((service) => {
                const photo = service.image_url || service.image_urls?.[0] || leadImage;
                return (
                  <article
                    key={service.id}
                    className="group overflow-hidden rounded-[1rem] border border-border/70 bg-card shadow-[0_6px_16px_rgba(22,74,47,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_14px_28px_rgba(22,74,47,0.09)]"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted sm:aspect-[4/3]">
                      <img
                        src={photo}
                        alt={service.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:py-1 sm:text-[10px]">
                        <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Add-on
                      </span>
                    </div>
                    <div className="space-y-1.5 p-2.5 sm:space-y-2 sm:p-3.5">
                      <h4 className="font-display text-sm font-semibold leading-snug tracking-tight text-foreground line-clamp-1 sm:text-base">
                        {service.title}
                      </h4>
                      {service.description ? (
                        <p className="hidden text-xs leading-5 text-muted-foreground line-clamp-2 sm:block">
                          {service.description}
                        </p>
                      ) : null}
                      <div className="flex items-baseline gap-1 border-t border-border/60 pt-1.5 sm:pt-2">
                        <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground sm:text-[10px]">
                          From
                        </span>
                        <span className="font-display text-sm font-semibold text-primary sm:text-base">
                          {formatPesoCurrency(service.price_amount)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : filter === "additional" ? (
          <div className="rounded-[1.1rem] border border-dashed border-border/70 bg-muted/25 px-5 py-10 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-semibold text-foreground/80">No additional services yet</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              This destination hasn&apos;t listed any add-ons like life vests, spa access, or similar extras yet.
            </p>
          </div>
        ) : null
      ) : null}
      
    </div>
  );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}