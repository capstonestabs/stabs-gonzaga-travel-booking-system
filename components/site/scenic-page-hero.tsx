"use client";

import { useEffect, useState } from "react";

import { blueprintScenes } from "@/lib/blueprint";
import { cn } from "@/lib/utils";

export function ScenicPageHero({
  badge,
  title,
  intro,
  meta,
  asideTitle,
  asideText
}: {
  badge: string;
  title: string;
  intro: string;
  meta?: string | null;
  asideTitle?: string;
  asideText?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % blueprintScenes.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="pb-5 sm:pb-6">
      <div className="relative w-full overflow-hidden bg-[#0d4d31] shadow-[0_24px_58px_rgba(10,48,30,0.24)]">
        {blueprintScenes.map((scene, index) => (
          <img
            key={scene.src}
            src={scene.src}
            alt={scene.alt}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1300ms] ease-out",
              index === activeIndex ? "scale-100 opacity-100" : "scale-[1.05] opacity-0"
            )}
          />
        ))}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,18,12,0.72)_0%,rgba(4,18,12,0.3)_24%,transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,30,19,0.9)_0%,rgba(6,30,19,0.76)_32%,rgba(6,30,19,0.26)_62%,rgba(6,30,19,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(111,201,152,0.22),transparent_28%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_20%)]" />
        <div className="absolute left-5 top-32 hidden h-24 w-px bg-white/52 lg:left-12 lg:block" />

        <div className="page-shell relative">
          <div className="grid min-h-[18rem] gap-5 px-0 pb-6 pt-32 text-white sm:min-h-[22rem] sm:gap-6 sm:pb-10 sm:pt-36 lg:min-h-[25rem] lg:grid-cols-[minmax(0,1fr),minmax(15rem,18rem)] lg:items-end lg:pb-12 lg:pt-36">
            <div className="max-w-3xl">
              <span className="intro-animate inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/86 backdrop-blur-md">
                {badge}
              </span>
              <h1 className="intro-animate intro-delay-1 mt-4 max-w-3xl font-display text-[1.95rem] font-semibold leading-[0.94] tracking-tight sm:text-[3rem] lg:text-[4rem]">
                {title}
              </h1>
              <p className="intro-animate intro-delay-2 mt-4 max-w-2xl text-sm leading-7 text-white/82 sm:text-[0.98rem]">
                {intro}
              </p>
              {meta ? (
                <p className="intro-animate intro-delay-3 mt-4 inline-flex rounded-full border border-white/14 bg-black/16 px-3 py-1.5 text-[11px] font-medium text-white/84 backdrop-blur-md">
                  {meta}
                </p>
              ) : null}
            </div>

            <div className="hidden lg:flex lg:justify-end">
              <div className="intro-animate-soft intro-delay-4 w-full max-w-[17rem] rounded-[1.2rem] border border-white/12 bg-black/18 p-4 backdrop-blur-md">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/68">
                  {asideTitle ?? "Gonzaga journeys"}
                </p>
                <p className="mt-4 text-sm leading-7 text-white/76">
                  {asideText ??
                    "Discover scenic stops, peaceful stays, and destination pages made to help you plan with ease."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
