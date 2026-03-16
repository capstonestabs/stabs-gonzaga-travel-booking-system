"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  const [isMounted, setIsMounted] = useState(false);
  const safeImages = useMemo(
    () => images.filter((image, index, source) => Boolean(image) && source.indexOf(image) === index),
    [images]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

      {currentImage && isMounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] bg-black/82 px-3 py-4 backdrop-blur-sm sm:p-6"
              onClick={() => setActiveIndex(null)}
              role="dialog"
              aria-modal="true"
              aria-label={`${title} gallery viewer`}
            >
              <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center gap-3 sm:gap-4">
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-0 sm:px-1">
                  <div className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-medium text-white">
                    {currentIndex + 1} / {safeImages.length}
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveIndex(null);
                    }}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white transition hover:bg-black/50"
                    aria-label="Close image viewer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div
                  className="flex min-h-0 w-full flex-1 items-center justify-center pt-12 sm:pt-14"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="relative flex w-full max-w-5xl items-center justify-center overflow-hidden rounded-[1.15rem] border border-white/14 bg-black/20 px-2 py-3 sm:rounded-[1.35rem] sm:px-4 sm:py-4">
                    <img
                      src={currentImage}
                      alt={`${title} gallery image ${currentIndex + 1}`}
                      className="mx-auto max-h-[72vh] w-auto max-w-full object-contain sm:max-h-[80vh]"
                    />
                  </div>
                </div>

                {safeImages.length > 1 ? (
                  <div
                    className="flex w-full max-w-sm items-center justify-between gap-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((current) =>
                          current == null ? 0 : (current - 1 + safeImages.length) % safeImages.length
                        )
                      }
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 text-sm font-medium text-white transition hover:bg-black/50"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((current) =>
                          current == null ? 0 : (current + 1) % safeImages.length
                        )
                      }
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 text-sm font-medium text-white transition hover:bg-black/50"
                      aria-label="Next image"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
