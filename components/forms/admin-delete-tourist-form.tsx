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
        throw new Error(body.error ?? "Unable to archive tourist account.");
      }

      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to archive tourist account."
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
          {isPending ? "Archiving..." : "Archive"}
        </Button>
        <ConfirmationDialog
          open={isDialogOpen}
          title={`Archive ${touristName}?`}
          description="This blocks future tourist access while keeping historical bookings and financial records already on file."
          confirmLabel="Archive"
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
        <CardTitle>Archive tourist account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Archive this tourist account to block future sign-ins while keeping historical records already on file.
        </p>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => setIsDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          {isPending ? "Archiving..." : "Archive tourist account"}
        </Button>
        <ConfirmationDialog
          open={isDialogOpen}
          title={`Archive ${touristName}?`}
          description="This blocks future tourist access while keeping historical bookings and financial records already on file."
          confirmLabel="Archive tourist account"
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
