"use client";

import { useEffect } from "react";

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("ChunkLoadError");

    if (isChunkError) {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900 font-sans">
        <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-xl border border-slate-200 text-center space-y-4">
          <h1 className="text-xl font-black text-emerald-800">Gonzaga Travel Bookings</h1>
          <p className="text-xs text-slate-600 font-semibold leading-5">
            A new version of the system was deployed. Please reload the page to get the latest features.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs shadow-md hover:bg-emerald-900 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
