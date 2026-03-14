"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { cn } from "@/lib/utils";

export function AdminDeleteTouristForm({
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
      const response = await fetch(`/api/admin/tourists/${touristId}`, {
        method: "DELETE"
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to delete tourist account.");
      }

      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to delete tourist account."
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
          {isPending ? "Deleting..." : "Delete user"}
        </Button>
        <ConfirmationDialog
          open={isDialogOpen}
          title={`Delete ${touristName}?`}
          description="This removes tourist access from active use while keeping historical bookings and financial records already on file."
          confirmLabel="Delete user"
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
    <Card className={cn("h-fit", className)}>
      <CardHeader>
        <CardTitle>Delete tourist account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Delete this tourist account from active access while keeping historical records already on file.
        </p>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => setIsDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          {isPending ? "Deleting..." : "Delete tourist account"}
        </Button>
        <ConfirmationDialog
          open={isDialogOpen}
          title={`Delete ${touristName}?`}
          description="This removes tourist access from active use while keeping historical bookings and financial records already on file."
          confirmLabel="Delete tourist account"
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
