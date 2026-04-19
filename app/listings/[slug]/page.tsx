import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ShieldCheck, Users } from "lucide-react";

import { BookingForm } from "@/components/forms/booking-form";
import { DestinationGalleryLightbox } from "@/components/site/destination-gallery-lightbox";
import { ServiceImagePreview } from "@/components/site/service-image-preview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExpandableText } from "@/components/ui/expandable-text";
import { getCurrentUserContext } from "@/lib/auth";
import { getBlueprintSceneBySeed } from "@/lib/blueprint";
import { getDestinationBySlug } from "@/lib/repositories";
import { formatServiceTypeLabel } from "@/lib/service-types";
import { formatPesoCurrency } from "@/lib/utils";

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

  const viewer = await getCurrentUserContext();
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

  return (
    <div className="pb-12">
      <div className="page-shell py-4 sm:py-6 lg:py-8">
        <section className="overflow-hidden rounded-[1.55rem] border border-border/70 bg-card shadow-[0_16px_36px_rgba(22,74,47,0.08)]">
          <div className="relative min-h-[15rem] overflow-hidden sm:min-h-[24rem] lg:min-h-[29rem]">
            <img
              src={leadImage}
              alt={destination.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,36,23,0.16),rgba(8,36,23,0.22),rgba(8,36,23,0.72))]" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground sm:p-7 lg:p-8">
              <div className="max-w-3xl space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="accent">{destination.category}</Badge>
                  <Badge variant="muted" className="border-white/20 bg-black/20 text-white">
                    {destination.booking_type === "walk-in" ? "Walk-in" : "Online booking"}
                  </Badge>
                </div>
                <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-[2.8rem] lg:text-[3.35rem]">
                  {destination.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-primary-foreground/88 sm:text-base">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {destination.location_text}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {activeServices.length} active service{activeServices.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="page-shell grid gap-4 xl:grid-cols-[minmax(0,1fr),20.5rem] 2xl:grid-cols-[minmax(0,1fr),22rem]">
        <section className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 p-4 sm:p-[1.125rem] lg:grid-cols-[minmax(0,1.15fr),minmax(14rem,0.85fr)]">
              <div className="space-y-2.5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  About this destination
                </p>
                <h2 className="font-display text-[1.6rem] font-semibold tracking-tight">
                  Plan the stop that fits your trip.
                </h2>
                <p className="text-sm leading-7 text-muted-foreground">{destination.summary}</p>
                <p className="text-sm leading-7 text-muted-foreground">{destination.description}</p>
              </div>

              <div className="grid gap-2.5 rounded-[1.05rem] border border-border/70 bg-muted/35 p-3.5 text-sm text-muted-foreground">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Location
                  </p>
                  <p className="mt-1 font-medium text-foreground">{destination.location_text}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Booking mode
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {destination.booking_type === "walk-in"
                      ? "Walk-in / contact first"
                      : "Online booking available"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Available services
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {activeServices.length} active service{activeServices.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Contact email
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {destination.staff_profile?.contact_email || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Contact phone
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {destination.staff_profile?.contact_phone || "Not provided"}
                  </p>
                </div>
                <p className="border-t border-border/70 pt-3 text-sm leading-6 text-muted-foreground">
                  {destination.booking_type === "walk-in"
                    ? "This place welcomes direct inquiries and walk-in visits. Use the contact details below before you head over."
                    : "Choose the package that fits your trip, check the open days, and continue only when the plan feels right."}
                </p>
              </div>
            </CardContent>
          </Card>

          <DestinationGalleryLightbox images={displayGalleryImages} title={destination.title} />

          <div className="grid gap-3.5 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3.5 p-4 sm:p-5">
                <h2 className="font-display text-[1.55rem] font-semibold tracking-tight">
                  What&apos;s included
                </h2>
                <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {destination.inclusions.map((item) => (
                    <li key={item} className="flex gap-3">
                      <ShieldCheck className="mt-1 h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3.5 p-4 sm:p-5">
                <h2 className="font-display text-[1.55rem] font-semibold tracking-tight">
                  Policies
                </h2>
                <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {destination.policies.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="grid gap-3.5 p-4 sm:p-[1.125rem] lg:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pick your package</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {destination.booking_type === "walk-in"
                    ? "Browse the listed packages and rates first, then contact the destination before you go."
                    : `Browse the package rates and choose the one that fits your ${destination.category === "stay" ? "stay" : "trip"} best.`}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {destination.booking_type === "walk-in" ? "Visit style" : "Plan your date"}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {destination.booking_type === "walk-in"
                    ? "This destination handles visits and inquiries directly, so you can message or call ahead before heading over."
                    : "Pick your package, choose a day that works for you, and continue when you are ready."}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {destination.booking_type === "walk-in" ? "Before you go" : "Confirmation"}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {destination.booking_type === "walk-in"
                    ? "Check the address, phone, and email first so you know who to contact before visiting."
                    : "Once your trip is confirmed, your pass will be ready in your account for your visit."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3.5 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-[1.125rem]">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Contact the destination
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  Ask about schedules, walk-in arrangements, or destination details before you go.
                </p>
              </div>
              <div className="grid gap-2 text-sm text-foreground sm:min-w-0">
                <p>
                  <span className="font-medium text-muted-foreground">Email:</span>{" "}
                  {destination.staff_profile?.contact_email || "Not provided"}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">Phone:</span>{" "}
                  {destination.staff_profile?.contact_phone || "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-[1.125rem]">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Feedback</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Send destination-specific feedback to the assigned tourism staff.
                </p>
              </div>
              <Link href={`/feedback?destinationId=${destination.id}` as Route}>
                <Badge variant="accent">Leave feedback</Badge>
              </Link>
            </CardContent>
          </Card>
        </section>

        <aside className="min-w-0">
          <Card className="xl:sticky xl:top-24">
            <CardContent className="space-y-4 p-4 sm:p-[1.125rem]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {destination.booking_type === "walk-in" ? "Visit or contact" : "Choose a service"}
                </p>
                <h3 className="mt-2 font-display text-[1.4rem] font-semibold tracking-tight">
                  {activeServices.length
                    ? `${activeServices.length} active service${activeServices.length === 1 ? "" : "s"}`
                    : "No services available"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {destination.booking_type === "walk-in"
                    ? "Review the packages first, then contact the destination directly or walk in using the details below."
                    : viewer?.role === "user"
                      ? "Your account is ready. Choose the package and date that fit your trip best."
                      : "Browse the packages and open dates first. Sign in when you are ready to reserve."}
                </p>
              </div>

              {destination.booking_type === "walk-in" ? (
                <div className="space-y-3.5 rounded-[1.15rem] border border-border/70 bg-muted/50 px-4 py-4 text-sm leading-6">
                  <p className="font-medium text-foreground">Walk in or contact the destination first</p>
                  <p className="text-muted-foreground">
                    This place handles reservations and inquiries directly, so online slot booking is not available here.
                  </p>
                  <div className="space-y-2 pt-2">
                    <p>
                      <span className="font-medium text-muted-foreground">Address:</span>{" "}
                      {destination.location_text}
                    </p>
                    <p>
                      <span className="font-medium text-muted-foreground">Email:</span>{" "}
                      {destination.staff_profile?.contact_email || "Not provided"}
                    </p>
                    <p>
                      <span className="font-medium text-muted-foreground">Phone:</span>{" "}
                      {destination.staff_profile?.contact_phone || "Not provided"}
                    </p>
                  </div>

                  {activeServices.length ? (
                    <div className="space-y-2.5 rounded-[1rem] border border-border/70 bg-background px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Available services
                      </p>
                      <div className="space-y-2.5">
                        {activeServices.map((service) => (
                          <div
                            key={service.id}
                            className="rounded-[0.9rem] border border-border/70 bg-muted/25 px-3 py-3"
                          >
                            <div className="grid grid-cols-[auto,minmax(0,1fr)] gap-3">
                              {service.image_url ? (
                                <ServiceImagePreview
                                  imageUrl={service.image_url}
                                  title={service.title}
                                  buttonClassName="h-16 w-16 shrink-0"
                                />
                              ) : null}
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-sm font-semibold text-foreground">{service.title}</p>
                                {service.description ? (
                                  <ExpandableText
                                    text={service.description}
                                    textClassName="text-xs leading-5 text-muted-foreground"
                                    collapsedClassName="line-clamp-2"
                                    expandLabel="More"
                                    collapseLabel="Less"
                                  />
                                ) : null}
                                {service.availability_start_date || service.availability_end_date ? (
                                  <p className="text-[11px] leading-5 text-muted-foreground">
                                    {service.availability_start_date ?? "Now"} to{" "}
                                    {service.availability_end_date ?? "Open-ended"}
                                  </p>
                                ) : null}
                              </div>
                              <div className="col-span-full flex items-end justify-between gap-3 border-t border-border/60 pt-2.5">
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                                    Rate
                                  </p>
                                  <span className="text-base font-semibold text-foreground">
                                    {formatPesoCurrency(service.price_amount)}
                                  </span>
                                </div>
                                <p className="text-[10px] tracking-[0.14em] text-muted-foreground">
                                  {formatServiceTypeLabel(service.service_type, {
                                    category: destination.category,
                                    includeSlash: true
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <BookingForm
                  destinationId={destination.id}
                  destinationSlug={destination.slug}
                  destinationTitle={destination.title}
                  locationText={destination.location_text}
                  category={destination.category}
                  services={destination.destination_services ?? []}
                  viewerRole={viewer?.role}
                  defaultContactName={viewer?.profile?.full_name ?? ""}
                  defaultContactEmail={viewer?.email ?? ""}
                  defaultContactPhone={viewer?.profile?.phone ?? ""}
                />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
