"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function DeleteFeedbackButton({
  feedbackId,
  authorName
}: {
  feedbackId: string;
  authorName: string;
}) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: "DELETE"
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to delete this feedback.");
      }

      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to delete this feedback."
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        disabled={isPending}
        onClick={() => setIsDialogOpen(true)}
      >
        {isPending ? "Deleting..." : "Delete feedback"}
      </Button>
      <ConfirmationDialog
        open={isDialogOpen}
        title="Delete this feedback?"
        description={`Remove the feedback from ${authorName} from this destination inbox? This cannot be undone.`}
        confirmLabel="Delete feedback"
        confirmVariant="destructive"
        isPending={isPending}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={async () => {
          setIsDialogOpen(false);
          await handleDelete();
        }}
      />
    </div>
  );
}
