import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, MessageSquareText } from "lucide-react";

import { PublicHero } from "@/components/site/public-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { blueprintScenes, getBlueprintSceneBySeed } from "@/lib/blueprint";
import { getPublishedDestinations } from "@/lib/repositories";
import type { Destination } from "@/lib/types";
import { cn, pesoAmountToCentavos } from "@/lib/utils";

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }

  return hash;
}

function getPopularHomeDestinations(destinations: Destination[]) {
  const daySeed = new Date().toISOString().slice(0, 10);

  return [...destinations].sort((left, right) => {
    const leftMediaScore =
      (left.cover_url ? 20 : 0) + Math.min(left.destination_images?.length ?? 0, 5) * 4;
    const rightMediaScore =
      (right.cover_url ? 20 : 0) + Math.min(right.destination_images?.length ?? 0, 5) * 4;
    const leftFeaturedScore = left.featured ? 100 : 0;
    const rightFeaturedScore = right.featured ? 100 : 0;
    const leftTrendScore =
      leftFeaturedScore + leftMediaScore + (hashString(`${daySeed}:${left.slug}`) % 29);
    const rightTrendScore =
      rightFeaturedScore + rightMediaScore + (hashString(`${daySeed}:${right.slug}`) % 29);

    if (leftTrendScore !== rightTrendScore) {
      return rightTrendScore - leftTrendScore;
    }

    return left.title.localeCompare(right.title);
  });
}

function buildHeroCards(destinations: Destination[]) {
  if (destinations.length === 0) {
    return [];
  }

  return blueprintScenes.map((scene, index) => {
    const destination = destinations[index % destinations.length];
    const lowestActiveServicePrice =
      destination.destination_services
        ?.filter((s) => s.is_active)
        .sort((a, b) => a.price_amount - b.price_amount)[0]?.price_amount ?? null;

    return {
      href: `/listings/${destination.slug}` as Route,
      title: destination.title,
      summary: destination.summary,
      locationText: destination.location_text,
      priceAmount:
        lowestActiveServicePrice == null ? null : pesoAmountToCentavos(lowestActiveServicePrice),
      imageUrl: scene.src
    };
  });
}

export default async function HomePage() {
  let destinations = [] as Awaited<ReturnType<typeof getPublishedDestinations>>;
  let destinationsAvailable = true;

  try {
    destinations = await getPublishedDestinations();
  } catch {
    destinationsAvailable = false;
  }

  const popularDestinations = getPopularHomeDestinations(destinations);
  const featuredDestinations = popularDestinations.slice(0, 4);
  const heroCards = buildHeroCards(popularDestinations);
  const leadDestination = featuredDestinations[0] ?? null;
  const supportingDestinations = featuredDestinations.slice(1, 4);
  const hasSupportingDestinations = supportingDestinations.length > 0;

  return (
    <div className="pb-14">
      <PublicHero cards={heroCards} />
      <div className="page-shell">
        <div className="section-divider">
          <span className="section-divider-dots" />
        </div>
      </div>

      <section id="destinations" className="page-shell py-5 sm:py-8">
        <ScrollReveal className="mb-7 space-y-3 text-center">
          <div className="flex justify-center">
            <Badge variant="muted">Popular destinations</Badge>
          </div>
          <h2 className="mx-auto max-w-3xl section-title">
            Pick the place that fits the vacation you have in mind.
          </h2>
          <p className="mx-auto section-copy">
            Explore Gonzaga escapes with real prices, inspiring photos, and the details you need
            to plan a memorable stay before you book.
          </p>
        </ScrollReveal>

        {!destinationsAvailable ? (
          <ScrollReveal>
            <Card>
              <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                <p>Fresh Gonzaga escapes are taking a moment to load.</p>
                <p>Please try again shortly to continue exploring destination ideas and trip details.</p>
              </CardContent>
            </Card>
          </ScrollReveal>
        ) : !leadDestination ? (
          <ScrollReveal>
            <Card>
              <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                <p>New Gonzaga getaways are on the way.</p>
                <p>Destination pages with photos, rates, and trip details will appear here soon.</p>
              </CardContent>
            </Card>
          </ScrollReveal>
        ) : (
          <div className="space-y-4">
            <ScrollReveal className="min-w-0" delay={40}>
              <Link href={`/listings/${leadDestination.slug}`} className="group block">
                <article className="card-corner-accent relative min-h-[17rem] overflow-hidden rounded-[1.15rem] border border-border/70 bg-card shadow-[0_14px_30px_rgba(22,74,47,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(22,74,47,0.14)] sm:min-h-[24rem] sm:rounded-[1.35rem] lg:min-h-[27rem]">
                  <img
                    src={
                      leadDestination.cover_url ??
                      leadDestination.destination_images?.[0]?.image_url ??
                      getBlueprintSceneBySeed(leadDestination.slug).src
                    }
                    alt={leadDestination.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,36,24,0.04),rgba(7,36,24,0.22),rgba(7,36,24,0.8))]" />
                  <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 sm:left-6 sm:top-6">
                    <Badge variant="accent" className="shadow-lg">{leadDestination.category}</Badge>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-3.5 text-primary-foreground sm:p-6">
                    <div className="max-w-2xl space-y-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/82 sm:text-[11px]">
                        <MapPin className="h-3.5 w-3.5" />
                        {leadDestination.location_text}
                      </span>
                      <h3 className="font-display text-[1.35rem] font-semibold leading-[0.98] tracking-tight sm:text-[2.1rem] lg:text-[2.4rem]">
                        {leadDestination.title}
                      </h3>
                      <p className="max-w-xl text-sm leading-6 text-white/84 sm:text-[0.98rem]">
                        {leadDestination.summary}
                      </p>
                      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        Open destination
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </ScrollReveal>

            <div
              className={cn(
                "grid gap-3.5 sm:gap-4",
                supportingDestinations.length >= 3
                  ? "md:grid-cols-2 xl:grid-cols-4"
                  : supportingDestinations.length === 2
                    ? "md:grid-cols-2 xl:grid-cols-3"
                    : supportingDestinations.length === 1
                      ? "md:grid-cols-2"
                      : ""
              )}
            >
              {supportingDestinations.map((destination, index) => {
                const image =
                  destination.cover_url ??
                  destination.destination_images?.[0]?.image_url ??
                  getBlueprintSceneBySeed(destination.slug).src;

                return (
                  <ScrollReveal key={destination.id} delay={110 + index * 70}>
                    <Link href={`/listings/${destination.slug}`} className="group block h-full">
                      <article className="card-corner-accent flex h-full flex-col overflow-hidden rounded-[1.1rem] border border-border/70 bg-card p-3.5 shadow-[0_10px_24px_rgba(22,74,47,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(22,74,47,0.12)] sm:p-4.5">
                        <div className="relative h-32 overflow-hidden rounded-[0.95rem] sm:h-44">
                          <img
                            src={image}
                            alt={destination.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,36,24,0.04),rgba(7,36,24,0.26))]" />
                        </div>
                        <div className="min-w-0 flex flex-1 flex-col pt-3.5">
                          <div className="space-y-2">
                            <Badge variant="muted">{destination.category}</Badge>
                            <h3 className="line-clamp-2 font-display text-[1.08rem] font-semibold leading-tight tracking-tight sm:text-[1.2rem]">
                              {destination.title}
                            </h3>
                          </div>
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {destination.summary}
                          </p>
                          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">
                              <MapPin className="h-3.5 w-3.5" />
                              {destination.location_text}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary sm:text-[11px]">
                              Read more
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </ScrollReveal>
                );
              })}

              <ScrollReveal delay={hasSupportingDestinations ? 300 : 120}>
                <Card
                  className={cn(
                    "card-corner-accent overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,249,245,0.98))]",
                    !hasSupportingDestinations ? "md:max-w-xl" : ""
                  )}
                >
                  <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
                    <div className="space-y-2">
                      <Badge variant="muted">Need more details?</Badge>
                      <p className="max-w-md text-sm leading-6 text-muted-foreground">
                        Ask for more details, share a question, or plan your trip with more
                        confidence before you go.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:gap-3.5">
                      <Link href={"/feedback" as Route}>
                        <Button variant="secondary" className="w-full sm:w-auto">
                          Send feedback
                          <MessageSquareText className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={"/destinations" as Route}>
                        <Button className="w-full sm:w-auto">
                          All destinations
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </div>
        )}

      </section>
    </div>
  );
}
