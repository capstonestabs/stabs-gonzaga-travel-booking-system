"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { setPasswordSchema } from "@/lib/schemas";
import { createClientSupabaseBrowserClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    const supabase = createClientSupabaseBrowserClient();

    if (!supabase) {
      setError("Supabase environment variables are missing.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      const parsed = setPasswordSchema.parse(values);
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.password
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("Password updated. Redirecting to your account...");
      router.push("/dashboard" as Route);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to update password."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="gradient-chip w-fit">Password settings</div>
        <CardTitle>Set or change your password</CardTitle>
        <CardDescription>
          Use this after tourist email recovery, or any time you want to update your password from your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="space-y-4"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">New password</span>
            <PasswordInput name="password" required />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Confirm password</span>
            <PasswordInput name="confirmPassword" required />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Saving password..." : "Save password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
