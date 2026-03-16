"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmationDialog({
  open,
  title,
  description,
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  isPending = false,
  onConfirm,
  onClose
}: {
  open: boolean;
  title: string;
  description: string;
  icon?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isPending, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="dialog-overlay fixed inset-0 z-[120] flex min-h-[100dvh] items-center justify-center p-4 sm:p-5 lg:p-6">
      <button
        type="button"
        aria-label="Close confirmation"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]"
        onClick={() => {
          if (!isPending) {
            onClose();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "dialog-pop-in relative mx-auto w-full max-w-[28rem] overflow-hidden rounded-[1.35rem] border border-border/80 bg-card shadow-[0_32px_90px_rgba(14,30,20,0.28)]"
        )}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/0 via-primary/70 to-primary/0" />
        <div className="space-y-4 p-5 sm:p-6">
          <div className="space-y-3 text-center sm:text-left">
            {icon ? (
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] border border-primary/20 bg-primary/10 text-primary sm:mx-0">
                {icon}
              </span>
            ) : null}
            <div className="space-y-2">
              <h3 className="font-display text-[1.35rem] font-semibold tracking-tight text-foreground sm:text-[1.45rem]">
                {title}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              onClick={() => {
                void onConfirm();
              }}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? "Processing..." : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
