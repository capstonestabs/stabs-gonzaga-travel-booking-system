"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  className
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsVisible(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => setIsVisible(true));

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(frame);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-4">
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-[1.4rem] border border-border/70 bg-card shadow-[0_24px_60px_rgba(0,0,0,0.25)] transition-all duration-200 sm:max-w-lg",
          isVisible ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-4 opacity-0 sm:scale-95",
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/70 bg-card/95 px-4 py-3 backdrop-blur-sm sm:px-5">
          {title ? (
            <div className="flex min-w-0 items-start gap-3">
              {icon ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  {icon}
                </span>
              ) : null}
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold sm:text-lg">{title}</h2>
                {description ? (
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground sm:text-sm">{description}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}