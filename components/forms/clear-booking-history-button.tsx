"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { History, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function ClearBookingHistoryButton({
  count
}: {
  count: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleClear() {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/bookings/history", {
        method: "DELETE"
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to clear your booking history.");
      }

      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to clear your booking history."
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="w-full sm:w-auto"
        disabled={isPending || count === 0}
        onClick={() => setIsDialogOpen(true)}
      >
        {isPending ? (
          "Clearing..."
        ) : (
          <>
            <History className="h-4 w-4" />
            Clear all history
          </>
        )}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <ConfirmationDialog
        open={isDialogOpen}
        title="Clear booking history?"
        description="Remove every completed, cancelled, and expired booking from your tourist history? Active reservations stay in your dashboard."
        confirmLabel="Clear all history"
        confirmVariant="destructive"
        icon={<Trash2 className="h-5 w-5" />}
        isPending={isPending}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={async () => {
          setIsDialogOpen(false);
          await handleClear();
        }}
      />
    </div>
  );
}
