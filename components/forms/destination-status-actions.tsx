"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DestinationStatusActions({
  destinationId,
  currentStatus
}: {
  destinationId: string;
  currentStatus: "draft" | "published" | "archived";
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: "draft" | "published" | "archived") {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/destinations/${destinationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to update listing status.");
      }

      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to update listing status."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={currentStatus === "draft" ? "secondary" : "outline"}
          size="sm"
          disabled={isPending}
          onClick={() => updateStatus("draft")}
        >
          Draft
        </Button>
        <Button
          type="button"
          variant={currentStatus === "published" ? "secondary" : "outline"}
          size="sm"
          disabled={isPending}
          onClick={() => updateStatus("published")}
        >
          Publish
        </Button>
        <Button
          type="button"
          variant={currentStatus === "archived" ? "secondary" : "outline"}
          size="sm"
          disabled={isPending}
          onClick={() => updateStatus("archived")}
        >
          Archive
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
