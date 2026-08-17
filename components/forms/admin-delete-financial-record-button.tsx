"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function AdminDeleteFinancialRecordButton({
  recordId,
  destinationTitle,
  redirectTo,
  mode = "archive",
  disabled = false
}: {
  recordId: string;
  destinationTitle: string;
  redirectTo?: Route;
  mode?: "archive" | "permanent";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isPermanent = mode === "permanent";

  async function handleDelete() {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch(
        `/api/admin/financial-records/${recordId}${isPermanent ? "?permanent=1" : ""}`,
        {
        method: "DELETE"
        }
      );

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(
          body.error ??
            (isPermanent
              ? "Unable to delete the financial record."
              : "Unable to move the financial record to history.")
        );
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : isPermanent
            ? "Unable to delete the financial record."
            : "Unable to move the financial record to history."
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button
        type="button"
        variant={isPermanent ? "destructive" : "outline"}
        size="sm"
        className="w-full sm:w-auto"
        disabled={isPending || disabled}
        onClick={() => setIsDialogOpen(true)}
      >
        {isPending
          ? isPermanent
            ? "Deleting..."
            : "Moving..."
          : isPermanent
            ? "Delete from history"
            : "Move to history"}
      </Button>
      <ConfirmationDialog
        open={isDialogOpen}
        title={isPermanent ? "Delete this history record?" : "Move this payout to history?"}
        description={
          isPermanent
            ? `Remove the archived financial record for ${destinationTitle} from admin pages permanently? It will not return to the active payout workspace.`
            : `Move the financial record for ${destinationTitle} out of the active financial page and into payout history?`
        }
        confirmLabel={isPermanent ? "Delete from history" : "Move to history"}
        confirmVariant={isPermanent ? "destructive" : "default"}
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
