"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function FeedbackForm({
  destinations,
  defaultDestinationId
}: {
  destinations: Array<{ id: string; title: string; locationText: string }>;
  defaultDestinationId?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          destinationId: String(formData.get("destinationId") ?? ""),
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          message: String(formData.get("message") ?? "")
        })
      });

      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to submit feedback.");
      }

      setMessage(body.message ?? "Feedback sent.");
      const form = document.getElementById("feedback-form") as HTMLFormElement | null;
      form?.reset();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to submit feedback."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70 bg-muted/35">
        <div className="gradient-chip w-fit">Public feedback</div>
        <CardTitle>Send feedback about a destination</CardTitle>
        <CardDescription>
          Choose the destination first so the right tourism staff account receives the feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form
          id="feedback-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="space-y-4"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">Destination</span>
            <select
              name="destinationId"
              defaultValue={defaultDestinationId ?? destinations[0]?.id ?? ""}
              className="flex h-11 w-full rounded-[0.95rem] border border-input/90 bg-card px-3.5 py-2.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-[0_0_0_4px_rgba(75,133,97,0.08)]"
              required
            >
              <option value="" disabled>
                Select a destination
              </option>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.title} - {destination.locationText}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Your name</span>
            <Input name="name" placeholder="Maria Santos" required />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Email address</span>
            <Input name="email" type="email" placeholder="maria@example.com" required />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Feedback</span>
            <Textarea
              name="message"
              placeholder="Tell us what should be improved or what worked well."
              required
            />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {destinations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No destinations are available for feedback just yet.
            </p>
          ) : null}

          <Button type="submit" disabled={isPending || destinations.length === 0}>
            {isPending ? "Sending feedback..." : "Submit feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
