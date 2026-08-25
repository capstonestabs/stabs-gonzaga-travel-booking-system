"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { ListingCard } from "@/components/site/listing-card";
import { Button } from "@/components/ui/button";
import type { Destination } from "@/lib/types";

interface PaginatedDestinationGridProps {
  destinations: Destination[];
}

export function PaginatedDestinationGrid({ destinations }: PaginatedDestinationGridProps) {
  const [page, setPage] = useState(1);
  const perPage = 12;
  const totalPages = Math.max(1, Math.ceil(destinations.length / perPage));
  const start = (page - 1) * perPage;
  const pageDestinations = destinations.slice(start, start + perPage);

  if (totalPages <= 1) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination) => (
          <ListingCard key={destination.id} destination={destination} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {pageDestinations.map((destination) => (
          <ListingCard key={destination.id} destination={destination} />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
          className="gap-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Previous
        </Button>

        <span className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
          className="gap-2"
        >
          Next
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
