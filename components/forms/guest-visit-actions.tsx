"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function GuestVisitActions({
  bookingId,
  guestNumber,
  checkedInAt,
  checkedOutAt
}: {
  bookingId: string;
  guestNumber: number;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"check_in" | "check_out" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function record(action: "check_in" | "check_out") {
    setPending(action);
    setError(null);
    try {
      const response = await fetch(`/api/staff/bookings/${bookingId}/guests/${guestNumber}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to record this guest visit.");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to record this guest visit.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-[1rem] border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-semibold">Staff check-in / check-out</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {!checkedInAt ? "Arrival has not been recorded." : !checkedOutAt ? `Checked in ${new Date(checkedInAt).toLocaleString("en-PH")}.` : `Checked out ${new Date(checkedOutAt).toLocaleString("en-PH")}.`}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!checkedInAt ? (
          <Button size="sm" disabled={pending !== null} onClick={() => void record("check_in")}>
            <LogIn className="h-4 w-4" /> {pending === "check_in" ? "Recording..." : "Check in guest"}
          </Button>
        ) : null}
        {checkedInAt && !checkedOutAt ? (
          <Button size="sm" variant="secondary" disabled={pending !== null} onClick={() => void record("check_out")}>
            <LogOut className="h-4 w-4" /> {pending === "check_out" ? "Recording..." : "Check out guest"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
