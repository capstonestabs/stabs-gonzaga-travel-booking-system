"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCw, AlertTriangle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-reload on ChunkLoadError caused by Vercel deployment chunk mismatch
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("failed to fetch");

    if (isChunkError) {
      const storageKey = "stabs_chunk_reload_attempts";
      const attempts = Number(sessionStorage.getItem(storageKey) ?? "0");
      if (attempts < 2) {
        sessionStorage.setItem(storageKey, String(attempts + 1));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="page-shell flex items-center justify-center py-16 sm:py-24">
      <Card className="w-full max-w-md border border-slate-200 shadow-xl dark:border-slate-800">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Page updated or temporarily unavailable
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-5">
              The application received a new update or experienced a transient connection hiccup.
              Reloading the page will restore the latest features.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row justify-center">
            <Button
              onClick={() => {
                sessionStorage.removeItem("stabs_chunk_reload_attempts");
                window.location.reload();
              }}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs gap-2"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Reload Page
            </Button>
            <Button
              variant="outline"
              onClick={() => reset()}
              className="text-xs font-semibold"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
