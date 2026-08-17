"use client";

import { useState } from "react";
import { ArrowUpRight, LocateFixed, Map as MapIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GoogleMapsDirections({
  destinationQuery,
  mapsUrl
}: {
  destinationQuery: string;
  mapsUrl: string;
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function openGpsDirections() {
    if (!("geolocation" in navigator)) {
      setMessage("GPS location is not available in this browser. Use View on map instead.");
      return;
    }

    setIsLocating(true);
    setMessage("Requesting your current location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const origin = `${coords.latitude},${coords.longitude}`;
        const directionsUrl = new URL("https://www.google.com/maps/dir/");
        directionsUrl.searchParams.set("api", "1");
        directionsUrl.searchParams.set("origin", origin);
        directionsUrl.searchParams.set("destination", destinationQuery);
        directionsUrl.searchParams.set("travelmode", "driving");
        window.location.assign(directionsUrl.toString());
      },
      (error) => {
        setIsLocating(false);
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access or use View on map."
            : "Your current location could not be detected. Try again or use View on map."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  return (
    <div className="mt-6 space-y-2.5">
      <Button type="button" size="lg" className="w-full" onClick={openGpsDirections} disabled={isLocating}>
        <LocateFixed className="h-4 w-4" />
        {isLocating ? "Finding your location…" : "Directions from my GPS location"}
      </Button>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full")}
      >
        <MapIcon className="h-4 w-4" />
        View destination on map
        <ArrowUpRight className="h-4 w-4" />
      </a>
      {message ? <p role="status" className="text-center text-xs leading-5 text-muted-foreground">{message}</p> : null}
      <p className="text-center text-[11px] leading-5 text-muted-foreground">
        GPS is used only to open live directions in Google Maps and is not stored by STABS.
      </p>
    </div>
  );
}
