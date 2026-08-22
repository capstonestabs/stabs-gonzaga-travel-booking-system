"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export function ScrollReveal({
  children,
  className,
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    let settled = false;

    function reveal() {
      if (settled) return;
      settled = true;
      setIsVisible(true);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(node);

    // Zooming, resizing, or any layout shift (e.g. images inside this section
    // finishing their load after the observer's first geometry check) can leave
    // the observer never firing on the very first pass. Re-checking the node's
    // bounding rect on resize catches that without waiting on the observer.
    function handleResize() {
      if (settled || !node) return;
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < viewportHeight && rect.bottom > 0) {
        reveal();
      }
    }
    window.addEventListener("resize", handleResize);

    // Safety net: never leave content permanently invisible if the observer
    // fails to fire for any reason (scroll restoration quirks, extensions, etc.).
    const fallbackTimer = setTimeout(reveal, 1800);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal-on-scroll", isVisible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}