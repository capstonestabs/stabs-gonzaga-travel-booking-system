"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isInternalPageUrl(url: URL) {
  return (
    typeof window !== "undefined" &&
    url.origin === window.location.origin &&
    !url.pathname.startsWith("/api")
  );
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const routeKey = useMemo(
    () => `${pathname}?${searchParams?.toString() ?? ""}`,
    [pathname, searchParams]
  );

  useEffect(() => {
    setIsNavigating(false);
  }, [routeKey]);

  useEffect(() => {
    const root = document.documentElement;

    if (isNavigating) {
      root.dataset.routePending = "true";
    } else {
      delete root.dataset.routePending;
    }

    return () => {
      delete root.dataset.routePending;
    };
  }, [isNavigating]);

  useEffect(() => {
    let fallbackTimer: number | null = null;

    function startPendingState() {
      setIsNavigating(true);

      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }

      fallbackTimer = window.setTimeout(() => {
        setIsNavigating(false);
      }, 12000);
    }

    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (!anchor) {
        return;
      }

      if (
        anchor.hasAttribute("download") ||
        anchor.getAttribute("target") === "_blank" ||
        anchor.getAttribute("rel")?.includes("external")
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      let nextUrl: URL;
      try {
        nextUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (!isInternalPageUrl(nextUrl)) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      if (
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search
      ) {
        return;
      }

      startPendingState();
    }

    function handleDocumentSubmit(event: SubmitEvent) {
      if (event.defaultPrevented) {
        return;
      }

      const form = event.target as HTMLFormElement | null;
      if (!form) {
        return;
      }

      if ((form.getAttribute("target") || "").toLowerCase() === "_blank") {
        return;
      }

      const method = (form.getAttribute("method") || "get").toLowerCase();
      if (method !== "get") {
        return;
      }

      const action = form.getAttribute("action") || window.location.href;

      let nextUrl: URL;
      try {
        nextUrl = new URL(action, window.location.href);
      } catch {
        return;
      }

      if (!isInternalPageUrl(nextUrl)) {
        return;
      }

      startPendingState();
    }

    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("submit", handleDocumentSubmit, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("submit", handleDocumentSubmit, true);

      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, []);

  if (!isNavigating) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="pointer-events-none fixed inset-0 z-[115] cursor-wait"
    >
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-primary/12">
        <div className="navigation-progress-bar h-full w-1/3 rounded-full bg-primary shadow-[0_0_18px_rgba(22,74,47,0.4)]" />
      </div>
      <div className="absolute inset-0 bg-transparent" />
      <div className="absolute left-1/2 top-4 -translate-x-1/2 sm:top-5">
        <div className="dialog-pop-in inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/15 bg-card/96 px-4 py-2 text-sm font-medium text-foreground shadow-[0_12px_30px_rgba(14,30,20,0.14)] backdrop-blur">
          <span className="h-2.5 w-2.5 rounded-full bg-primary navigation-progress-pulse" />
          Opening page...
        </div>
      </div>
    </div>
  );
}
