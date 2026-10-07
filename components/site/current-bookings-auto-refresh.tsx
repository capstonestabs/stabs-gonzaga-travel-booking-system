"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 15_000;

function hasActiveInteraction() {
  const activeElement = document.activeElement;
  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement ||
    activeElement instanceof HTMLButtonElement
  );
}

export function CurrentBookingsAutoRefresh() {
  const router = useRouter();
  const refreshInProgress = useRef(false);

  useEffect(() => {
    const refresh = () => {
      if (
        document.visibilityState !== "visible" ||
        hasActiveInteraction() ||
        refreshInProgress.current
      ) {
        return;
      }

      refreshInProgress.current = true;
      router.refresh();

      window.setTimeout(() => {
        refreshInProgress.current = false;
      }, 1_000);
    };

    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [router]);

  return null;
}
