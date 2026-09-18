"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";

export function AdminStaffPasswordForm({ staffId, className }: { staffId: string; className?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/admin/staff/${staffId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: String(formData.get("password") ?? "")
        })
      });

      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to reset staff password.");
      }

      setMessage(body.message ?? "Staff password reset.");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to reset staff password."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className={cn("h-fit dashboard-glass-panel overflow-hidden", className)}>
      <CardHeader className="border-b border-white/30 bg-transparent">
        <CardTitle>Reset password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Set a new temporary password for this staff account and share it manually.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="space-y-3"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">New temporary password</span>
            <PasswordInput name="password" required />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <div className="border-t border-white/30 pt-4">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Resetting..." : "Reset password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
