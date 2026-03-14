"use client";

import { useEffect } from "react";

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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
      <button
        type="button"
        aria-label="Close confirmation"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
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
          "relative w-full max-w-md rounded-[1.2rem] border border-border/80 bg-card p-4 shadow-[0_28px_80px_rgba(14,30,20,0.24)] sm:p-5 lg:p-6"
        )}
      >
        <div className="space-y-2">
          {icon ? (
            <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-border/70 bg-secondary/55 text-primary">
              {icon}
            </span>
          ) : null}
          <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
  );
}
