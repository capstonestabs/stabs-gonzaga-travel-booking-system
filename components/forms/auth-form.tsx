"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signInSchema, signUpSchema } from "@/lib/schemas";
import { createClientSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/utils";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"), "/dashboard");
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
      if (mode === "sign-in") {
        const parsed = signInSchema.parse(values);
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: parsed.email,
          password: parsed.password
        });

        if (signInError) {
          throw signInError;
        }

        window.location.assign(redirectTo);
        return;
      }

      const parsed = signUpSchema.parse(values);
      const emailRedirectUrl = new URL("/auth/callback", window.location.origin);
      emailRedirectUrl.searchParams.set("next", redirectTo);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: {
          emailRedirectTo: emailRedirectUrl.toString(),
          data: {
            full_name: parsed.fullName
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        window.location.assign(redirectTo);
        return;
      }

      setMessage(
        redirectTo === "/checkout/continue"
          ? "Account created. Check your email to confirm it, then return to checkout."
          : "Account created. Check your email to confirm your account."
      );
      setIsPending(false);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to continue."
      );
      setIsPending(false);
    }
  }

  const isSignUp = mode === "sign-up";
  const alternateHref = `${
    isSignUp ? "/sign-in" : "/sign-up"
  }?redirectTo=${encodeURIComponent(redirectTo)}`;

  return (
    <Card className="w-full max-w-lg border-border/80 bg-card/95">
      <CardHeader>
        <div className="gradient-chip w-fit">{isSignUp ? "Create account" : "Welcome back"}</div>
        <CardTitle>
          {isSignUp ? "Create your account" : "Sign in to STABS"}
        </CardTitle>
        <CardDescription>
          {isSignUp
            ? "Browse first, then create your account when you are ready to reserve a trip or review your bookings."
            : "Use your email and password to open your bookings or your workspace."}
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
          {isSignUp ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium">Full name</span>
              <Input name="fullName" placeholder="Leah Santos" required />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium">Email address</span>
            <Input name="email" type="email" placeholder="name@example.com" required />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <PasswordInput name="password" placeholder="At least 8 characters" required />
          </label>

          {!isSignUp ? (
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-medium text-primary">
                Forgot password?
              </Link>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending
              ? isSignUp
                ? "Creating account..."
                : "Signing in..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <Link
            href={alternateHref as Route}
            className="font-semibold text-primary"
          >
            {isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>
        {!isSignUp ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Tourist accounts can recover by email. Staff accounts must contact admin for password help.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
