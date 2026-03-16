"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminDestinationAssignmentForm({
  staffId,
  defaultDestinationTitle,
  defaultLocationText,
  hasDestination
}: {
  staffId: string;
  defaultDestinationTitle?: string;
  defaultLocationText?: string;
  hasDestination: boolean;
}) {
  const router = useRouter();
  const initialDestinationTitle = useMemo(
    () => defaultDestinationTitle ?? "",
    [defaultDestinationTitle]
  );
  const initialLocationText = useMemo(() => defaultLocationText ?? "", [defaultLocationText]);
  const [destinationTitle, setDestinationTitle] = useState(initialDestinationTitle);
  const [locationText, setLocationText] = useState(initialLocationText);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const hasChanges =
    destinationTitle !== initialDestinationTitle || locationText !== initialLocationText;
  const canSubmit =
    destinationTitle.trim().length >= 4 &&
    locationText.trim().length >= 3 &&
    (!hasDestination || hasChanges);

  async function handleSubmit() {
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
          destinationTitle: destinationTitle.trim(),
          locationText: locationText.trim()
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
    <Card id="destination-assignment" className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <CardTitle>{hasDestination ? "Destination assignment" : "Assign destination"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Admin can edit the assigned destination name and its location here.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Destination</span>
            <Input
              name="destinationTitle"
              value={destinationTitle}
              onChange={(event) => {
                setDestinationTitle(event.target.value);
                setError(null);
                setMessage(null);
              }}
              placeholder="Assigned destination name"
              required
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Location</span>
            <Input
              name="locationText"
              value={locationText}
              onChange={(event) => {
                setLocationText(event.target.value);
                setError(null);
                setMessage(null);
              }}
              placeholder="Barangay, beach, resort, or landmark in Gonzaga"
              required
            />
          </label>

          {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700 md:col-span-2">{message}</p> : null}

          <div className="border-t border-border/60 pt-4 md:col-span-2">
            <Button type="submit" disabled={isPending || !canSubmit} className="w-full sm:w-auto">
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
