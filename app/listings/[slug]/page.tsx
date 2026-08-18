import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  BedDouble,
  BusFront,
  CalendarCheck2,
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Info,
  MapPin,
  MessageSquare,
  ParkingCircle,
  Route as RouteIcon,
  ShowerHead,
  Store,
  Users,
  Utensils,
  Wifi
} from "lucide-react";

import { DestinationGalleryLightbox } from "@/components/site/destination-gallery-lightbox";
import { GoogleMapsDirections } from "@/components/site/google-maps-directions";
import { PackageBookingAction } from "@/components/site/package-booking-action";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getBlueprintSceneBySeed } from "@/lib/blueprint";
import { getAbramMergedGuestRatePlan } from "@/lib/guest-pricing";
import { getDestinationBySlug } from "@/lib/repositories";
import { formatServiceTypeLabel } from "@/lib/service-types";
import { formatOpenWeekdays, formatOperatingTime } from "@/lib/service-schedule";
import { cn, formatPesoCurrency } from "@/lib/utils";

type AmenityDefinition = {
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
};

const amenityDefinitions: AmenityDefinition[] = [
  { label: "Parking", description: "Vehicle parking or a designated parking area", icon: ParkingCircle, keywords: ["parking", "car park"] },
  { label: "Wi-Fi", description: "Internet access for guests and visitors", icon: Wifi, keywords: ["wi-fi", "wifi", "internet"] },
  { label: "Food & dining", description: "Restaurant, café, or meal service", icon: Utensils, keywords: ["restaurant", "dining", "meal", "food", "breakfast", "lunch", "dinner"] },
  { label: "Accommodation", description: "Rooms, cottages, or overnight stays", icon: BedDouble, keywords: ["room", "stay", "accommodation", "cottage", "cabin", "overnight", "lodging"] },
  { label: "Tour guide", description: "Local guide or assisted tour experience", icon: Compass, keywords: ["guide", "guided", "tour"] },
  { label: "Restrooms", description: "Guest comfort and washroom facilities", icon: ShowerHead, keywords: ["restroom", "toilet", "bathroom", "washroom", "shower"] },
  { label: "Accessible", description: "Accessibility support for visitors", icon: Accessibility, keywords: ["accessible", "accessibility", "wheelchair", "ramp", "pwd"] },
  { label: "Transport", description: "Shuttle, transfer, or transport service", icon: BusFront, keywords: ["shuttle", "transfer", "transport", "pickup", "pick-up"] }
];

function matchesAmenity(haystack: string, keywords: string[]) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

export default async function ListingPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let destination = null;
  let loadError = false;

  try {
    destination = await getDestinationBySlug(slug);
  } catch {
    loadError = true;
  }

  if (!destination && !loadError) {
    notFound();
  }

  if (!destination) {
    return (
      <div className="page-shell space-y-6 py-8 sm:py-10">
        <div className="space-y-3">
          <div className="gradient-chip w-fit">Destination unavailable</div>
          <h1 className="page-title">This destination is taking a quick pause.</h1>
          <p className="page-intro">
            Please try again in a moment, or explore another Gonzaga stop while this page loads back in.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-4 sm:p-5">
            <p className="text-sm leading-7 text-muted-foreground">
              The details could not be reached just now. A quick refresh usually brings the page
              back.
            </p>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/destinations">
                <Badge variant="accent" className="inline-flex h-10 items-center px-4 text-sm">
                  Back to destinations
                </Badge>
              </Link>
              <Link href="/">
                <Badge variant="muted" className="inline-flex h-10 items-center px-4 text-sm">
                  Back to home
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const galleryImages = Array.from(
    new Map(
      [destination.cover_url, ...(destination.destination_images ?? []).map((image) => image.image_url)]
        .filter(Boolean)
        .map((imageUrl) => [imageUrl, imageUrl])
    ).values()
  ) as string[];
  const leadImage = galleryImages[0] ?? getBlueprintSceneBySeed(destination.slug).src;
  const displayGalleryImages = galleryImages.length > 0 ? galleryImages : [leadImage];
  const activeServices = (destination.destination_services ?? []).filter((service) => service.is_active);
  const mergedAbramRatePlan = getAbramMergedGuestRatePlan(
    destination.slug,
    destination.title,
    activeServices
  );
  const displayedPackageServices = mergedAbramRatePlan
    ? [mergedAbramRatePlan.primaryService]
    : activeServices;
  const destinationDetails = [
    destination.summary,
    destination.description,
    ...destination.inclusions,
    ...activeServices.flatMap((service) => [service.title, service.description ?? "", service.service_type])
  ]
    .join(" ")
    .toLowerCase();
  const availableAmenities = amenityDefinitions.filter((amenity) =>
    matchesAmenity(destinationDetails, amenity.keywords)
  );
  const displayedAmenities = availableAmenities.length
    ? availableAmenities
    : [
        {
          label: "Visitor assistance",
          description: "Contact the destination team for available on-site facilities",
          icon: Info,
          keywords: []
        }
      ];
  const destinationMapQuery = [
    destination.location_text,
    destination.city,
    destination.province,
    "Philippines"
  ]
    .filter(Boolean)
    .join(", ");
  const mapQuery = encodeURIComponent(destinationMapQuery);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const placeLabel = destination.city || destination.province || "Gonzaga";

  return (
    <div className="pb-12">
      <div className="page-shell space-y-4 py-4 sm:space-y-5 sm:py-6 lg:py-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-hidden text-xs text-muted-foreground">
          <Link href="/destinations" className="shrink-0 font-medium transition-colors hover:text-primary">
            Destinations
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{destination.city || destination.province || "Gonzaga"}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-foreground">{destination.title}</span>
        </nav>

        <section className="flex flex-col gap-4">
          <div className="max-w-4xl space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">{destination.category}</Badge>
              <Badge variant="muted">
                {destination.booking_type === "walk-in" ? "Walk-in welcome" : "Online booking"}
              </Badge>
            </div>
            <h1 className="font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[2.75rem] lg:text-[3.2rem]">
              {destination.title}
            </h1>
            <a
              href="#location"
              className="inline-flex items-start gap-2 text-sm leading-6 text-muted-foreground transition-colors hover:text-primary"
            >
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" />
              <span className="underline decoration-border underline-offset-4">{destination.location_text}</span>
            </a>
          </div>
        </section>

        <DestinationGalleryLightbox
          images={displayGalleryImages}
          title={destination.title}
          layout="hero"
        />
      </div>

      <div className="page-shell space-y-5 pb-5 sm:space-y-6 sm:pb-7">
        <ScrollReveal>
          <section className="max-w-4xl py-2 sm:py-4" aria-labelledby="destination-about-title">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              About this destination
            </p>
            <h2 id="destination-about-title" className="section-title mt-3">
              A closer look at {destination.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              {destination.summary}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              {destination.description}
            </p>
          </section>
        </ScrollReveal>

        {destination.inclusions.length > 0 || destination.policies.length > 0 ? (
          <ScrollReveal delay={60}>
            <section className="grid gap-4 sm:grid-cols-2" aria-label="Visitor information and policies">
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-display text-2xl font-semibold">What is included</h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {destination.inclusions.length
                      ? destination.inclusions.map((item) => <li key={item}>{item}</li>)
                      : <li>Contact the destination for current inclusions.</li>}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-display text-2xl font-semibold">House rules and cancellation</h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {destination.policies.length
                      ? destination.policies.map((policy) => <li key={policy}>{policy}</li>)
                      : <li>Confirmed, unused bookings may be cancelled before check-in, subject to payout status.</li>}
                  </ul>
                </CardContent>
              </Card>
            </section>
          </ScrollReveal>
        ) : null}

        <ScrollReveal delay={80}>
          <section id="location" className="scroll-mt-36 space-y-4" aria-labelledby="location-title">
            <div>
              <div className="gradient-chip">Find your way</div>
              <h2 id="location-title" className="section-title mt-3">Location</h2>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="grid gap-0 p-0 lg:grid-cols-[minmax(0,1.35fr),minmax(20rem,0.65fr)]">
                <div className="relative min-h-[20rem] overflow-hidden bg-muted sm:min-h-[25rem]">
                  <iframe
                    src={mapEmbedUrl}
                    title={`Map showing ${destination.title}`}
                    className="absolute inset-0 h-full w-full border-0 grayscale-[12%]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/10 to-transparent" />
                </div>

                <div className="flex flex-col p-4 sm:p-6 lg:p-7">
                  <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(22,74,47,0.2)]">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Complete address</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">{destination.location_text}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {[destination.city, destination.province, "Philippines"].filter(Boolean).join(", ")}
                  </p>

                  <div className="my-6 h-px bg-border/70" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nearby reference points</p>
                  <div className="mt-3 space-y-3 text-sm">
                    {[
                      { icon: Store, label: `${placeLabel} town center`, distance: "Check live route" },
                      { icon: RouteIcon, label: "Nearest main road", distance: "Check live route" },
                      { icon: CarFront, label: "Local transport access", distance: "Check live route" }
                    ].map(({ icon: Icon, label, distance }) => (
                      <div key={label} className="flex items-center gap-3 rounded-[0.9rem] bg-muted/45 px-3 py-2.5">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="min-w-0 flex-1 font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">{distance}</span>
                      </div>
                    ))}
                  </div>

                  <GoogleMapsDirections
                    destinationQuery={destinationMapQuery}
                    mapsUrl={mapsUrl}
                  />
                </div>
              </CardContent>
            </Card>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <section id="services" className="scroll-mt-36 space-y-4" aria-labelledby="services-title">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="gradient-chip">Comfort & convenience</div>
                <h2 id="services-title" className="section-title mt-3">Services</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Facilities confirmed in the destination details and packages. Contact the team for anything not listed.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {displayedAmenities.map(({ label, description, icon: Icon }) => (
                <article key={label} className="flex gap-3.5 rounded-[1.1rem] border border-border/70 bg-card p-4 shadow-[0_8px_22px_rgba(22,74,47,0.045)] transition-colors hover:border-primary/25">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-secondary text-primary">
                    <Icon className="h-[1.15rem] w-[1.15rem]" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold">{label}</h3>
                      <Check className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                  </div>
                </article>
              ))}
            </div>

            {activeServices.length > 0 ? (
              <div className="pt-2">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.85rem] bg-primary text-primary-foreground">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-semibold">Available packages</h3>
                    <p className="text-xs text-muted-foreground">Compare the details and book your preferred option.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {displayedPackageServices.map((service) => {
                    const packageTitle = mergedAbramRatePlan?.title ?? service.title;
                    const startingPrice = mergedAbramRatePlan
                      ? Math.min(
                          mergedAbramRatePlan.adult.priceAmount,
                          mergedAbramRatePlan.child.priceAmount
                        )
                      : service.price_amount;
                    const servicePhotos = service.image_urls?.length
                      ? service.image_urls
                      : service.image_url ? [service.image_url] : [];

                    return (
                      <article key={service.id} className="rounded-[1.2rem] border border-border/70 bg-card p-3 shadow-[0_10px_28px_rgba(22,74,47,0.055)] sm:p-4">
                        <div className="mb-3 flex items-start justify-between gap-3 px-1 sm:mb-4">
                          <div>
                            <h4 className="font-display text-2xl font-semibold tracking-tight">{packageTitle}</h4>
                            <p className="mt-1 text-xs text-muted-foreground">Book this option through the destination&apos;s secure reservation flow.</p>
                          </div>
                          <Badge variant="muted" className="shrink-0">
                            {formatServiceTypeLabel(service.service_type, { category: destination.category })}
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
                                <Users className="h-3.5 w-3.5 text-primary" /> Up to {service.daily_capacity} guest{service.daily_capacity === 1 ? "" : "s"}
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
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Starting rate</p>
                                  <p className="mt-1 font-display text-3xl font-semibold text-primary">
                                    {formatPesoCurrency(startingPrice)}
                                  </p>
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    {mergedAbramRatePlan
                                      ? "per guest, based on type"
                                      : `per ${formatServiceTypeLabel(service.service_type, { category: destination.category })}`}
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
                                  destinationSlug={destination.slug}
                                  bookingType={destination.booking_type}
                                  category={destination.category}
                                  options={displayedPackageServices.map((packageService) => ({
                                    id: packageService.id,
                                    title: mergedAbramRatePlan?.title ?? packageService.title,
                                    priceLabel: formatPesoCurrency(
                                      mergedAbramRatePlan
                                        ? Math.min(
                                            mergedAbramRatePlan.adult.priceAmount,
                                            mergedAbramRatePlan.child.priceAmount
                                          )
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
              </div>
            ) : null}
          </section>
        </ScrollReveal>
      </div>

      <div className="page-shell">
        <section aria-labelledby="destination-support-title">
          <Card>
            <CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr),auto] lg:items-center">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-secondary text-primary">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="destination-support-title" className="font-display text-xl font-semibold">
                    Share your feedback
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Tell the tourism team about this destination.
                  </p>
                </div>
              </div>
              <div>
                <Link
                  href={`/feedback?destinationId=${destination.id}` as Route}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  <MessageSquare className="h-4 w-4" /> Feedback
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
