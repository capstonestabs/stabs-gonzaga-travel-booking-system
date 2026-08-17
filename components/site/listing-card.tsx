import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBlueprintSceneBySeed } from "@/lib/blueprint";
import type { Destination } from "@/lib/types";

export function ListingCard({ destination }: { destination: Destination }) {
  const leadImage =
    destination.cover_url ??
    destination.destination_images?.[0]?.image_url ??
    getBlueprintSceneBySeed(destination.slug).src;

  const activeServiceCount =
    destination.destination_services?.filter((service) => service.is_active).length ?? 0;
  const availabilityLabel =
    destination.booking_type === "walk-in"
      ? "Walk-in destination"
      : activeServiceCount > 0
        ? `${activeServiceCount} service${activeServiceCount === 1 ? "" : "s"} available`
        : "Services coming soon";

  return (
    <article className="card-corner-accent group flex h-full flex-col overflow-hidden rounded-[1.15rem] border border-border/70 bg-card shadow-[0_10px_24px_rgba(22,74,47,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(22,74,47,0.1)]">
      <div className="relative h-44 overflow-hidden bg-[linear-gradient(135deg,rgba(28,74,47,0.94),rgba(51,109,74,0.82),rgba(175,214,188,0.68))] p-4 text-primary-foreground sm:h-56">
        {leadImage ? (
          <>
            <img
              src={leadImage}
              alt={destination.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,41,27,0.12),rgba(12,41,27,0.68))]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_34%)]" />
        )}
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="accent" className="shadow-lg">
              {destination.category}
            </Badge>
          </div>
          <div>
            <h3 className="mt-2 font-display text-[1.45rem] font-semibold leading-tight sm:text-[1.6rem]">
              {destination.title}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-3.5 sm:p-4">
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {destination.summary}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {destination.location_text}
          </span>
          <span className="font-medium text-emerald-700">
            {availabilityLabel}
          </span>
        </div>

        <Link href={`/listings/${destination.slug}`} className="mt-auto">
          <Button variant="secondary" className="w-full justify-between">
            View destination
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </article>
  );
}
