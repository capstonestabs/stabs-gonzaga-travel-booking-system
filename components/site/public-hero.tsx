"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";

import { blueprintScenes } from "@/lib/blueprint";
import { cn, formatCurrency } from "@/lib/utils";

export interface HeroDestinationCard {
  href: Route;
  title: string;
  summary: string;
  locationText: string;
  priceAmount: number | null;
  imageUrl: string;
}

const fallbackCards: HeroDestinationCard[] = blueprintScenes.map((scene, index) => ({
  href: "/destinations" as Route,
  title:
    index === 0
      ? "Wake up to Gonzaga views"
      : index === 1
        ? "Coastal escapes worth the trip"
        : "Find your next quiet getaway",
  summary:
    index === 0
      ? "Find scenic stays, peaceful shorelines, and relaxing places to start your next vacation."
      : index === 1
        ? "Browse handpicked places around Gonzaga and choose the one that fits your kind of escape."
        : "From nature views to restful stopovers, discover destinations made for slow and memorable trips.",
  locationText: "Gonzaga, Cagayan",
  priceAmount: null,
  imageUrl: scene.src
}));

export function PublicHero({ cards }: { cards: HeroDestinationCard[] }) {
  const slides = cards.length > 0 ? cards : fallbackCards;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[activeIndex] ?? slides[0];
  const hasMultipleSlides = slides.length > 1;

  return (
    <section className="pb-3 sm:pb-4 lg:pb-5">
      <div className="relative w-full overflow-hidden bg-[#0d4d31] shadow-[0_24px_58px_rgba(10,48,30,0.24)]">
          {slides.map((slide, index) => (
            <img
              key={`${slide.imageUrl}-${index}`}
              src={slide.imageUrl}
              alt={slide.title}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1300ms] ease-out",
                index === activeIndex ? "scale-100 opacity-100" : "scale-[1.05] opacity-0"
              )}
            />
          ))}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,18,12,0.7)_0%,rgba(4,18,12,0.28)_24%,transparent_42%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,30,19,0.88)_0%,rgba(6,30,19,0.74)_32%,rgba(6,30,19,0.2)_62%,rgba(6,30,19,0.62)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(111,201,152,0.22),transparent_28%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_20%)]" />

          <div className="absolute left-5 top-36 hidden h-28 w-px bg-white/56 lg:left-12 lg:block" />
          <div className="absolute right-5 top-40 hidden grid-cols-4 gap-1.5 lg:right-12 lg:grid">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} className="h-1.5 w-1.5 rounded-full bg-white/38" />
            ))}
          </div>

          <div className="relative grid min-h-[27rem] gap-5 px-4 pb-5 pt-[9.75rem] text-white sm:min-h-[31rem] sm:px-5 sm:pb-7 sm:pt-[11.25rem] md:pt-[12rem] lg:min-h-[44rem] lg:grid-cols-[minmax(0,1fr),minmax(14rem,17rem)] lg:gap-8 lg:px-10 lg:pb-10 lg:pt-32 xl:min-h-[88vh] xl:px-12 xl:pb-12 xl:pt-36">
            <div className="flex max-w-2xl flex-col justify-end">
              <p className="intro-animate text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white/74 max-[359px]:hidden sm:text-[0.76rem] sm:tracking-[0.34em]">
                Your next Gonzaga escape
              </p>
              <h1 className="intro-animate intro-delay-1 mt-3 font-display text-[clamp(2.15rem,13vw,5rem)] font-semibold uppercase leading-[0.88] tracking-tight sm:mt-4">
                Explore
                <br />
                Gonzaga
              </h1>
              <p className="intro-animate intro-delay-2 mt-1 font-display text-[clamp(1.45rem,9vw,3.3rem)] font-semibold uppercase leading-none tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.56)]">
                Destinations
              </p>

              <div className="intro-animate-soft intro-delay-3 mt-4 max-w-[min(100%,29rem)] space-y-3 rounded-[1.1rem] border border-white/12 bg-black/18 px-3.5 py-3.5 backdrop-blur-md sm:mt-5 sm:max-w-[31rem] sm:rounded-[1.2rem] sm:px-4 sm:py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/82">
                    Popular now
                  </span>
                </div>
                <p className="font-display text-[1.15rem] font-semibold leading-tight tracking-tight sm:text-[1.75rem]">
                  {activeSlide.title}
                </p>
                <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/74">
                  <MapPin className="h-3.5 w-3.5" />
                  {activeSlide.locationText}
                </p>
                <p className="max-w-lg text-sm leading-6 text-white/76 sm:text-[0.96rem] sm:leading-7">
                  {activeSlide.summary}
                </p>
              </div>

              <div className="intro-animate intro-delay-4 mt-3.5 flex flex-wrap items-center gap-3 sm:mt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((current) => (current - 1 + slides.length) % slides.length)
                    }
                    disabled={!hasMultipleSlides}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white transition hover:bg-white/18 disabled:cursor-default disabled:opacity-45 sm:h-10 sm:w-10"
                    aria-label="Previous destination slide"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((current) => (current + 1) % slides.length)}
                    disabled={!hasMultipleSlides}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white transition hover:bg-white/18 disabled:cursor-default disabled:opacity-45 sm:h-10 sm:w-10"
                    aria-label="Next destination slide"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {hasMultipleSlides ? (
                <div className="intro-animate intro-delay-5 mt-4 flex flex-wrap items-center gap-2.5 sm:mt-5 sm:gap-3">
                  {slides.slice(0, 6).map((slide, index) => (
                    <button
                      key={`${slide.href}-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        "h-2.5 rounded-full transition-all",
                        index === activeIndex
                          ? "w-10 bg-white"
                          : "w-2.5 bg-white/38 hover:bg-white/68"
                      )}
                      aria-label={`Show destination slide ${index + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>

              <div className="hidden xl:flex xl:items-end xl:justify-end xl:pb-10">
                <div className="intro-animate-soft intro-delay-4 w-full max-w-[18rem] rounded-[1.25rem] border border-white/12 bg-black/18 p-4 backdrop-blur-md">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/68">
                    Why travelers choose Gonzaga
                  </p>
                  <p className="mt-4 text-sm leading-7 text-white/76">
                    Wide coastal views, calm nature spots, and destination experiences made for
                    weekends away, family trips, and slow vacations.
                  </p>
                </div>
              </div>
            </div>
      </div>
    </section>
  );
}
