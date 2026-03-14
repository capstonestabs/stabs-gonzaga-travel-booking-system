"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { cn } from "@/lib/utils";

export function CancelBookingButton({
  bookingId,
  label = "Cancel reservation",
  confirmMessage = "Cancel this reservation now? The held slot will be released immediately.",
  size = "sm",
  variant = "outline",
  className
}: {
  bookingId: string;
  label?: string;
  confirmMessage?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleCancel() {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST"
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to cancel the reservation.");
      }

      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to cancel the reservation."
      );
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="space-y-2">
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn("w-full sm:w-auto", className)}
          disabled={isPending}
          onClick={() => setIsDialogOpen(true)}
        >
          {isPending ? "Cancelling..." : label}
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <ConfirmationDialog
        open={isDialogOpen}
        title="Cancel this reservation?"
        description={confirmMessage}
        confirmLabel={label}
        confirmVariant="destructive"
        isPending={isPending}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={async () => {
          setIsDialogOpen(false);
          await handleCancel();
        }}
      />
    </>
  );
}
