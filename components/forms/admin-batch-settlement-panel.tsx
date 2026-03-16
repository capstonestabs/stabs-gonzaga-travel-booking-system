"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

export function AdminBatchSettlementPanel({
  recordIds,
  serviceLabel,
  destinationTitle,
  bookingCount,
  grossAmount,
  title = "Service payout",
  subtitle,
  toggleLabel = "Show payout",
  submitLabel = "Record all payouts",
  helperText = "Record one payout for every unsettled booking currently listed in this service section. Once saved, those rows move to payout history automatically."
}: {
  recordIds: string[];
  serviceLabel: string;
  destinationTitle: string;
  bookingCount: number;
  grossAmount: number;
  title?: string;
  subtitle?: string;
  toggleLabel?: string;
  submitLabel?: string;
  helperText?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [receiptReference, setReceiptReference] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const summaryLabel = useMemo(() => {
    return `${bookingCount} booking${bookingCount === 1 ? "" : "s"}`;
  }, [bookingCount]);

  async function handleSettleAll() {
    setError(null);
    setIsPending(true);

    const trimmedReceiptReference = receiptReference.trim();
    const trimmedSettlementNotes = settlementNotes.trim();

    if (!trimmedReceiptReference) {
      setError("Enter the payout receipt or reference.");
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/financial-records/batch-settle", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recordIds,
          receiptReference: trimmedReceiptReference,
          settlementNotes: trimmedSettlementNotes
        })
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to record the service payout.");
      }

      setIsOpen(false);
      setReceiptReference("");
      setSettlementNotes("");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to record the service payout."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2.5 rounded-[0.9rem] border border-border/70 bg-card/75 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-1 font-medium text-foreground">{serviceLabel}</p>
          <p className="text-sm text-muted-foreground">
            {subtitle ?? `${summaryLabel} waiting under ${destinationTitle}`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Total payout amount {formatCurrency(grossAmount)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
        >
          {isOpen ? "Hide payout" : toggleLabel}
          <ChevronDown className={isOpen ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-2.5 border-t border-border/70 pt-3">
          <p className="text-xs leading-5 text-muted-foreground">
            {helperText}
          </p>
          <Input
            value={receiptReference}
            onChange={(event) => setReceiptReference(event.target.value)}
            placeholder="Payout receipt or reference"
          />
          <Textarea
            value={settlementNotes}
            onChange={(event) => setSettlementNotes(event.target.value)}
            placeholder="Optional notes for this service payout"
            className="min-h-16"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <Button type="button" size="sm" disabled={isPending} onClick={handleSettleAll}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
