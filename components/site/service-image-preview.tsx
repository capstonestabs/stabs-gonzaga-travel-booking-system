"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, X } from "lucide-react";

import { cn } from "@/lib/utils";

export function ServiceImagePreview({
  imageUrl,
  title,
  buttonClassName,
  imageClassName
}: {
  imageUrl: string;
  title: string;
  buttonClassName?: string;
  imageClassName?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(true);
        }}
        className={cn(
          "group relative overflow-hidden rounded-[0.85rem] border border-border/70 bg-muted/40",
          buttonClassName
        )}
        aria-label={`Open ${title} image`}
      >
        <img
          src={imageUrl}
          alt={title}
          className={cn("h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]", imageClassName)}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,36,24,0.03),rgba(7,36,24,0.4))]" />
        <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/35 px-2 py-1 text-[10px] font-medium text-white">
          View
          <Expand className="h-3 w-3" />
        </span>
      </button>

      {isOpen && isMounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] bg-black/82 px-3 py-4 backdrop-blur-sm sm:p-6"
              onClick={() => setIsOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label={`${title} image viewer`}
            >
              <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center gap-3 sm:gap-4">
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-0 sm:px-1">
                  <div className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-medium text-white">
                    Service image
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsOpen(false);
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
                      src={imageUrl}
                      alt={title}
                      className="mx-auto max-h-[72vh] w-auto max-w-full object-contain sm:max-h-[80vh]"
                    />
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
