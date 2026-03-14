"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound, MailWarning } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RecoveryMode = "tourist" | "staff" | "admin" | null;

export function ForgotPasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<RecoveryMode>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setMode(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: String(formData.get("email") ?? "")
        })
      });

      const body = (await response.json()) as {
        error?: string;
        message?: string;
        mode?: RecoveryMode;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to start password recovery.");
      }

      setMessage(body.message ?? "Check your email for the next step.");
      setMode(body.mode ?? null);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to start password recovery."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-lg border-border/80 bg-card/95">
      <CardHeader>
        <div className="gradient-chip inline-flex w-fit items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Password recovery
        </div>
        <CardTitle>Reset a tourist password</CardTitle>
        <CardDescription>
          Tourist accounts can recover by email. Staff accounts stay protected and must contact admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="space-y-4"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email address</span>
            <Input name="email" type="email" placeholder="name@example.com" required />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? (
            <p
              className={`text-sm ${
                mode === "staff" || mode === "admin" ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {message}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Checking account..." : "Send recovery link"}
          </Button>
        </form>

        <div className="rounded-[1rem] border border-border/70 bg-muted/35 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <MailWarning className="h-4 w-4 text-primary" />
            Staff password rule
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            If the email belongs to a staff account, the page will not send a reset email. It will
            tell the staff member to contact admin instead.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link href="/sign-in" className="font-semibold text-primary">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
