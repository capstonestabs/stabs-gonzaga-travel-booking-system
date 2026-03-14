"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { cn } from "@/lib/utils";

export function AdminDeleteStaffForm({
  staffId,
  staffName,
  variant = "card",
  redirectTo,
  className
}: {
  staffId: string;
  staffName: string;
  variant?: "card" | "inline";
  redirectTo?: Route;
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
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: "DELETE"
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to delete staff account.");
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to delete staff account."
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
          {isPending ? "Deleting..." : "Delete staff"}
        </Button>
        <ConfirmationDialog
          open={isDialogOpen}
          title={`Delete ${staffName}?`}
          description="This removes staff access from active use, hides the destination, and keeps financial history."
          confirmLabel="Delete staff"
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
        <CardTitle>Delete staff account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Delete this staff account from active access, hide the destination from the public site, and remove avatar
          and gallery media from storage. Future active bookings block deletion.
        </p>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => setIsDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          {isPending ? "Deleting..." : "Delete staff account"}
        </Button>
        <ConfirmationDialog
          open={isDialogOpen}
          title={`Delete ${staffName}?`}
          description="This removes staff access from active use, hides the destination, and keeps financial history."
          confirmLabel="Delete staff account"
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
