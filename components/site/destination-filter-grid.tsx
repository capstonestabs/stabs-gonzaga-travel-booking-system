"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronDown,
  Clock3,
  Flame,
  SlidersHorizontal
} from "lucide-react";

import { ListingCard } from "@/components/site/listing-card";
import type { Destination } from "@/lib/types";

type DestinationSort =
  | "popular"
  | "alphabetical"
  | "price_low"
  | "price_high"
  | "most_visited"
  | "newest";

const sortOptions: {
  value: DestinationSort;
  label: string;
  description: string;
  icon: typeof Flame;
}[] = [
  {
    value: "popular",
    label: "Popular destinations",
    description: "Our current featured picks",
    icon: Flame
  },
  {
    value: "alphabetical",
    label: "Alphabetical",
    description: "A to Z by destination name",
    icon: ArrowDownAZ
  },
  {
    value: "price_low",
    label: "Price: Low to high",
    description: "Start with the most affordable",
    icon: ArrowUpNarrowWide
  },
  {
    value: "price_high",
    label: "Price: High to low",
    description: "See premium options first",
    icon: ArrowDownWideNarrow
  },
  {
    value: "most_visited",
    label: "Most visited",
    description: "Based on completed bookings",
    icon: Flame
  },
  {
    value: "newest",
    label: "Newest first",
    description: "Recently added destinations",
    icon: Clock3
  }
];

function getLowestPrice(destination: Destination) {
  const prices = (destination.destination_services ?? [])
    .filter((service) => service.is_active)
    .map((service) => service.price_amount);
  return prices.length > 0 ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

export function DestinationFilterGrid({ destinations }: { destinations: Destination[] }) {
  const [sort, setSort] = useState<DestinationSort>("popular");
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const selectedOption = sortOptions.find((option) => option.value === sort) ?? sortOptions[0];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const sortedDestinations = useMemo(() => {
    const next = [...destinations];

    switch (sort) {
      case "alphabetical":
        return next.sort((a, b) => a.title.localeCompare(b.title));
      case "price_low":
        return next.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
      case "price_high":
        return next.sort((a, b) => getLowestPrice(b) - getLowestPrice(a));
      case "most_visited":
        return next.sort(
          (a, b) =>
            (b.completed_booking_count ?? 0) - (a.completed_booking_count ?? 0) ||
            a.title.localeCompare(b.title)
        );
      case "newest":
        return next.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      default:
        return next;
    }
  }, [destinations, sort]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div ref={filterRef} className="relative z-20">
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            className="group flex min-h-11 items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2 text-left shadow-[0_8px_24px_rgba(22,74,47,0.07)] transition hover:border-primary/35 hover:shadow-[0_10px_28px_rgba(22,74,47,0.12)] focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Sort by
              </span>
              <span className="block max-w-[12rem] truncate text-sm font-semibold text-foreground">
                {selectedOption.label}
              </span>
            </span>
            <ChevronDown
              className={`ml-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                isOpen ? "rotate-180 text-primary" : ""
              }`}
            />
          </button>

          <div
            role="listbox"
            aria-label="Sort destinations"
            className={`absolute right-0 top-[calc(100%+0.5rem)] w-[min(19rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-border/70 bg-card p-1.5 shadow-[0_18px_45px_rgba(22,74,47,0.16)] transition-all duration-200 ${
              isOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-2 scale-95 opacity-0"
            }`}
          >
            <div className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Arrange destinations
            </div>
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = option.value === sort;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSort(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/70"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                  {isSelected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sortedDestinations.map((destination) => (
          <ListingCard key={destination.id} destination={destination} />
        ))}
      </div>
    </div>
  );
}
