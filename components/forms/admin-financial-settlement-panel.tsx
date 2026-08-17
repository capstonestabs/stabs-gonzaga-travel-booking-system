"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { AdminFinancialSettlementForm } from "@/components/forms/admin-financial-settlement-form";
import { Button } from "@/components/ui/button";

export function AdminFinancialSettlementPanel({
  recordId,
  settlementStatus,
  receiptReference,
  settlementNotes
}: {
  recordId: string;
  settlementStatus: "unsettled" | "settled";
  receiptReference?: string | null;
  settlementNotes?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (settlementStatus === "settled") {
    return (
      <div className="space-y-2 rounded-[0.9rem] border border-border/70 bg-secondary/25 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Staff payout
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">Settled</p>
          </div>
        </div>
        {receiptReference ? (
          <p className="text-xs text-emerald-700">Reference: {receiptReference}</p>
        ) : null}
        {settlementNotes ? (
          <p className="text-xs leading-5 text-muted-foreground">{settlementNotes}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-[0.9rem] border border-border/70 bg-card/75 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Manual payout
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Show the form only when the staff release is ready to record.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
        >
          {isOpen ? "Hide payout" : "Show payout"}
          <ChevronDown className={isOpen ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
        </Button>
      </div>

      {isOpen ? (
        <AdminFinancialSettlementForm
          recordId={recordId}
          settlementStatus={settlementStatus}
          receiptReference={receiptReference}
          settlementNotes={settlementNotes}
          compact
        />
      ) : null}
    </div>
  );
}
