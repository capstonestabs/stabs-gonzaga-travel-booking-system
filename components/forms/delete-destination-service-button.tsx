"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { cn } from "@/lib/utils";

export function DeleteDestinationServiceButton({
  destinationId,
  serviceId,
  label,
  title,
  description,
  deleteAll = false,
  className,
  variant = "destructive"
}: {
  destinationId: string;
  serviceId?: string;
  label: string;
  title: string;
  description: string;
  deleteAll?: boolean;
  className?: string;
  variant?: "destructive" | "outline";
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/destinations/${destinationId}/services`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          serviceId,
          deleteAll
        })
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to delete the service.");
      }

      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to delete the service."
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
          size="sm"
          className={cn("w-full sm:w-auto", className)}
          disabled={isPending}
          onClick={() => setIsDialogOpen(true)}
        >
          {isPending ? "Deleting..." : label}
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
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
    </>
  );
}
