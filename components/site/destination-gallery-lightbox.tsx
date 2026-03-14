"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

import { cn } from "@/lib/utils";

export function DestinationGalleryLightbox({
  images,
  title
}: {
  images: string[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const safeImages = useMemo(
    () => images.filter((image, index, source) => Boolean(image) && source.indexOf(image) === index),
    [images]
  );

  useEffect(() => {
    if (activeIndex == null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (safeImages.length < 2) {
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current == null ? 0 : (current + 1) % safeImages.length
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current == null ? 0 : (current - 1 + safeImages.length) % safeImages.length
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, safeImages.length]);

  if (safeImages.length === 0) {
    return null;
  }

  const currentIndex = activeIndex ?? 0;
  const currentImage = activeIndex == null ? null : safeImages[currentIndex];

  return (
    <>
      <section className="space-y-4 rounded-[1.35rem] border border-border/70 bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Gallery</p>
            <h2 className="font-display text-[1.5rem] font-semibold tracking-tight">
              View destination photos
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {safeImages.length} photo{safeImages.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "group relative overflow-hidden rounded-[1rem] border border-border/70 bg-muted text-left",
                index === 0 && safeImages.length > 2
                  ? "min-h-[14rem] sm:col-span-2 sm:row-span-2 sm:min-h-[21rem]"
                  : "min-h-[11rem]"
              )}
            >
              <img
                src={image}
                alt={`${title} photo ${index + 1}`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,36,24,0.05),rgba(7,36,24,0.42))]" />
              <div className="absolute inset-x-0 bottom-0 flex justify-end p-4 text-primary-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3 py-1 text-xs font-medium">
                  Open image
                  <Expand className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {currentImage ? (
        <div
          className="fixed inset-0 z-[80] bg-black/78 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setActiveIndex(null)}
        >
          <div className="relative mx-auto flex h-full max-w-6xl items-center justify-center">
            {safeImages.length > 1 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex((current) =>
                    current == null ? 0 : (current - 1 + safeImages.length) % safeImages.length
                  );
                }}
                className="absolute left-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white transition hover:bg-black/50 sm:left-3"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex(null);
              }}
              className="absolute right-0 top-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white transition hover:bg-black/50 sm:right-3 sm:top-3"
              aria-label="Close image viewer"
            >
              <X className="h-5 w-5" />
            </button>

            <div
              className="relative w-full max-w-5xl overflow-hidden rounded-[1.35rem] border border-white/14 bg-black/20"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={currentImage}
                alt={`${title} gallery image ${currentIndex + 1}`}
                className="max-h-[82vh] w-full object-contain"
              />
            </div>

            {safeImages.length > 1 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex((current) =>
                    current == null ? 0 : (current + 1) % safeImages.length
                  );
                }}
                className="absolute right-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white transition hover:bg-black/50 sm:right-3"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
