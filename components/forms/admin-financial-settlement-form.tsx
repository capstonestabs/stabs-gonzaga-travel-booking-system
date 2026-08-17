"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function AdminFinancialSettlementForm({
  recordId,
  settlementStatus,
  receiptReference,
  settlementNotes,
  compact = false
}: {
  recordId: string;
  settlementStatus: "unsettled" | "settled";
  receiptReference?: string | null;
  settlementNotes?: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [currentReceiptReference, setCurrentReceiptReference] = useState(receiptReference ?? "");
  const [currentSettlementNotes, setCurrentSettlementNotes] = useState(settlementNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  if (settlementStatus === "settled") {
    return (
      <div
        className={cn(
          "space-y-1.5 rounded-[0.95rem] bg-secondary/45 px-3.5 py-3 text-xs text-emerald-700",
          compact && "px-3 py-2.5"
        )}
      >
        <p className="font-medium">Staff payout settled</p>
        {receiptReference ? <p>Reference: {receiptReference}</p> : null}
        {settlementNotes ? <p>{settlementNotes}</p> : null}
      </div>
    );
  }

  async function handleSettle() {
    setError(null);
    setIsPending(true);

    const trimmedReceiptReference = currentReceiptReference.trim();
    const trimmedSettlementNotes = currentSettlementNotes.trim();

    if (!trimmedReceiptReference) {
      setError("Enter the payout receipt or reference.");
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/financial-records/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          receiptReference: trimmedReceiptReference,
          settlementNotes: trimmedSettlementNotes
        })
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to settle this financial record.");
      }

      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to settle this financial record."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2.5")}>
      <p className={cn("text-xs leading-5 text-muted-foreground", compact && "leading-5")}>
        Use this after paying the assigned staff outside the PayMongo checkout, such as by
        GCash transfer, bank transfer, or in-person release. Saving this payout moves the
        record straight to payout history.
      </p>
      <Input
        value={currentReceiptReference}
        onChange={(event) => setCurrentReceiptReference(event.target.value)}
        placeholder="Payout receipt or reference"
        className={cn(compact && "h-10")}
      />
      <Textarea
        value={currentSettlementNotes}
        onChange={(event) => setCurrentSettlementNotes(event.target.value)}
        placeholder="Optional payout notes, such as the release method used"
        className={cn("min-h-20", compact && "min-h-16")}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button
        type="button"
        size="sm"
        onClick={handleSettle}
        disabled={isPending}
        className={cn("w-full sm:w-auto", compact && "sm:min-w-[10rem]")}
      >
        {isPending ? "Saving..." : compact ? "Record payout" : "Record staff payout"}
      </Button>
    </div>
  );
}
