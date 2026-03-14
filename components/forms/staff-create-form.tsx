"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export function StaffCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setIsPending(true);

    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to create staff account.");
      }

      setMessage(
        "Staff account and destination created. Share the default password with the staff member so they can sign in and change it later."
      );
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create staff account."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <CardTitle>Create a staff account</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          <label className="space-y-2">
            <span className="text-sm font-medium">Destination</span>
            <Input name="destination" required />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Location</span>
            <Input
              name="locationText"
              placeholder="Barangay, beach, resort, or landmark in Gonzaga"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Email</span>
            <Input name="email" type="email" required />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Default password</span>
            <PasswordInput name="defaultPassword" required />
          </label>

          <p className="text-sm text-muted-foreground md:col-span-2">
            This creates the staff login and draft destination immediately. No invite email is sent.
          </p>

          {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700 md:col-span-2">{message}</p> : null}

          <div className="border-t border-border/60 pt-4 md:col-span-2">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Creating..." : "Create staff account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
