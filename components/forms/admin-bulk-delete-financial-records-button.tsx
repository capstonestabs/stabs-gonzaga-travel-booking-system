"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function AdminBulkDeleteFinancialRecordsButton({
  recordIds,
  label,
  title,
  description,
  redirectTo
}: {
  recordIds: string[];
  label: string;
  title: string;
  description: string;
  redirectTo?: Route;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/admin/financial-records/batch-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recordIds
        })
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to delete the selected history records.");
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to delete the selected history records."
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="w-full sm:w-auto"
        disabled={isPending || recordIds.length === 0}
        onClick={() => setIsDialogOpen(true)}
      >
        {isPending ? "Deleting..." : label}
      </Button>
      <ConfirmationDialog
        open={isDialogOpen}
        title={title}
        description={description}
        confirmLabel={label}
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
