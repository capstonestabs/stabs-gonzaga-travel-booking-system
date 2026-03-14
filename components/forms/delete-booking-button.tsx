"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { cn } from "@/lib/utils";

export function DeleteBookingButton({
  bookingId,
  label,
  confirmMessage,
  size = "sm",
  className
}: {
  bookingId: string;
  label?: string;
  confirmMessage?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE"
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to delete the booking.");
      }

      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to delete the booking."
      );
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="space-y-2">
        <Button
          type="button"
          variant="destructive"
          size={size}
          className={cn("w-full sm:w-auto", className)}
          disabled={isPending}
          onClick={() => setIsDialogOpen(true)}
        >
          {isPending ? "Deleting..." : label ?? "Delete booking"}
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <ConfirmationDialog
        open={isDialogOpen}
        title="Clear this booking?"
        description={
          confirmMessage ??
          "Delete this booking record? This permanently removes the booking and payment details from the system."
        }
        confirmLabel={label ?? "Delete booking"}
        confirmVariant="destructive"
        isPending={isPending}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={async () => {
          setIsDialogOpen(false);
          await handleDelete();
        }}
      />
    </>
  );
}
