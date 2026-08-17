"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PackageOption = {
  id: string;
  title: string;
  priceLabel: string;
};

export function PackageBookingAction({
  destinationSlug,
  bookingType,
  category,
  options,
  initialServiceId
}: {
  destinationSlug: string;
  bookingType: "online" | "walk-in";
  category: "stay" | "tour";
  options: PackageOption[];
  initialServiceId: string;
}) {
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const selectedOption =
    options.find((option) => option.id === selectedServiceId) ?? options[0];
  const destinationHref =
    bookingType === "walk-in"
      ? `/listings/${destinationSlug}#location`
      : `/listings/${destinationSlug}/book?serviceId=${selectedOption?.id ?? initialServiceId}`;
  const hasMultipleOptions = options.length > 1;

  return (
    <div className="border-t border-border/70 pt-3.5">
      <p className="mb-2 text-right text-[11px] text-muted-foreground">
        {bookingType === "walk-in" ? "Contact the destination before visiting." : "You won&apos;t be charged yet."}
      </p>
      <div className="grid grid-cols-[minmax(0,1fr),minmax(8.5rem,0.8fr)] overflow-hidden rounded-[1rem] border border-border bg-background shadow-[0_8px_20px_rgba(22,74,47,0.06)]">
        <label className="relative flex min-w-0 flex-col justify-center px-3.5 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            {category === "stay" ? "Room / package" : "Experience"}
          </span>
          {hasMultipleOptions ? (
            <>
              <select
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
                className="mt-0.5 h-6 w-full appearance-none truncate bg-transparent pr-6 text-sm font-semibold text-foreground outline-none"
                aria-label={category === "stay" ? "Choose room or package" : "Choose experience"}
              >
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title} — {option.priceLabel}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-muted-foreground" />
            </>
          ) : (
            <span className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {selectedOption?.title}
            </span>
          )}
        </label>
        <div className="border-l border-border p-2">
          <Link
            href={destinationHref as Route}
            className={cn(buttonVariants({ size: "lg" }), "h-full min-h-12 w-full rounded-[0.85rem]")}
          >
            {bookingType === "walk-in" ? "View location" : "Book"}
          </Link>
        </div>
      </div>
    </div>
  );
}
