import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  BedDouble,
  BusFront,
  CarFront,
  Check,
  ChevronRight,
  Compass,
  Info,
  MapPin,
  MessageSquare,
  ParkingCircle,
  Route as RouteIcon,
  ShowerHead,
  Store,
  Utensils,
  Wifi
} from "lucide-react";

import { DestinationServicesSection } from "@/components/site/destination-services-section";
import { DestinationGalleryLightbox } from "@/components/site/destination-gallery-lightbox";
import { GoogleMapsDirections } from "@/components/site/google-maps-directions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getBlueprintSceneBySeed } from "@/lib/blueprint";
import { getAbramMergedGuestRatePlan } from "@/lib/guest-pricing";
import { getDestinationBySlug } from "@/lib/repositories";
import { splitServicesByCategory } from "@/lib/service-categories";
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
  const { core: coreServices, additional: additionalServices } = splitServicesByCategory(
    destination.destination_services
  );
  const activeCoreServices = coreServices.filter((service) => service.is_active);
  const activeAdditionalServices = additionalServices.filter((service) => service.is_active);
  const mergedAbramRatePlan = getAbramMergedGuestRatePlan(
    destination.slug,
    destination.title,
    activeCoreServices
  );
  const destinationDetails = [
    destination.summary,
    destination.description,
    ...destination.inclusions,
    ...activeCoreServices.flatMap((service) => [service.title, service.description ?? "", service.service_type])
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

            <DestinationServicesSection
              destinationSlug={destination.slug}
              bookingType={destination.booking_type}
              category={destination.category}
              leadImage={leadImage}
              coreServices={activeCoreServices}
              additionalServices={activeAdditionalServices}
              mergedAbramRatePlan={mergedAbramRatePlan}
            />
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
