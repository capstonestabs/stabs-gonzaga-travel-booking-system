"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminDestinationAssignmentForm({
  staffId,
  staffName,
  defaultLocationText,
  hasDestination
}: {
  staffId: string;
  staffName: string;
  defaultLocationText?: string;
  hasDestination: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/admin/staff/${staffId}/destination`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          locationText: String(formData.get("locationText") ?? "")
        })
      });

      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to save destination assignment.");
      }

      setMessage(body.message ?? "Destination assignment saved.");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to save destination assignment."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <CardTitle>{hasDestination ? "Destination assignment" : "Assign destination"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The destination name follows the staff name. Admin sets the location here.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Destination</span>
            <Input value={staffName} disabled readOnly />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Location</span>
            <Input
              name="locationText"
              defaultValue={defaultLocationText ?? ""}
              placeholder="Barangay, beach, resort, or landmark in Gonzaga"
              required
            />
          </label>

          {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700 md:col-span-2">{message}</p> : null}

          <div className="border-t border-border/60 pt-4 md:col-span-2">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending
                ? "Saving..."
                : hasDestination
                  ? "Save destination assignment"
                  : "Assign destination"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
