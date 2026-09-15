"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { cn } from "@/lib/utils";

export function AdminPermanentlyDeleteTouristForm({
  touristId,
  touristName,
  variant = "card",
  className
}: {
  touristId: string;
  touristName: string;
  variant?: "card" | "inline";
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/admin/tourists/${touristId}/permanent-delete`, {
        method: "DELETE"
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to permanently delete tourist account.");
      }

      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to permanently delete tourist account."
      );
      setIsPending(false);
    }
  }

  if (variant === "inline") {
    return (
      <div className={cn("space-y-2", className)}>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => setIsDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isPending ? "Deleting..." : "Permanently delete"}
        </Button>
        <ConfirmationDialog
          open={isDialogOpen}
          title={`Permanently delete ${touristName}?`}
          description="This cannot be undone. The account, its login, and all associated bookings/payments will be permanently removed. Past revenue already on file in Financials will remain, but will no longer be linked to a live booking."
          confirmLabel="Permanently delete"
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

  return (
    <Card className={cn("h-fit border-destructive/20", className)}>
      <CardHeader>
        <CardTitle className="text-destructive">Permanently delete tourist account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This permanently removes the account, its login, and all associated bookings and payments.
          This cannot be undone. Past revenue already on file in Financials will remain, but will no
          longer be linked to a live booking.
        </p>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => setIsDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isPending ? "Deleting..." : "Permanently delete tourist account"}
        </Button>
        <ConfirmationDialog
          open={isDialogOpen}
          title={`Permanently delete ${touristName}?`}
          description="This cannot be undone. The account, its login, and all associated bookings/payments will be permanently removed. Past revenue already on file in Financials will remain, but will no longer be linked to a live booking."
          confirmLabel="Permanently delete"
          confirmVariant="destructive"
          isPending={isPending}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={async () => {
            setIsDialogOpen(false);
            await handleDelete();
          }}
        />
      </CardContent>
    </Card>
  );
}