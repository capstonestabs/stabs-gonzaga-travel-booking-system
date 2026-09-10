"use client";

import { Banknote, CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { PaymentMode } from "@/lib/types";

export function PaymentModeModal({
  open,
  onClose,
  onSelect,
  isPending = false
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (paymentMode: PaymentMode) => void;
  isPending?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="How would you like to pay?">
      <div className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Choose how you&apos;d like to settle payment for this booking. You can review the details
          again before it&apos;s final.
        </p>
        <div className="grid gap-2.5">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onSelect("online")}
            className="flex items-start gap-3 rounded-[0.9rem] border border-border/70 p-3.5 text-left transition hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                Pay Online (GCash)
                <Badge variant="accent">GCash</Badge>
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Pay securely through GCash once your booking is confirmed by our staff. You&apos;ll get
                an instant digital receipt.
              </span>
            </span>
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onSelect("onsite")}
            className="flex items-start gap-3 rounded-[0.9rem] border border-border/70 p-3.5 text-left transition hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Banknote className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="text-sm font-semibold">Pay Onsite (Cash)</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Reserve now, pay in cash when you arrive. You&apos;ll receive a receipt to present at
                check-in once your booking is confirmed.
              </span>
            </span>
          </button>
        </div>
        <p className="border-t border-border/60 pt-3 text-xs leading-5 text-muted-foreground">
          Your booking will first be reviewed by our staff before payment can proceed.
        </p>
        <Button type="button" variant="outline" className="w-full" onClick={onClose} disabled={isPending}>
          Go back
        </Button>
      </div>
    </Modal>
  );
}
