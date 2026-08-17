"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [sessionState, setSessionState] = useState<"checking" | "ready" | "missing">("checking");

  useEffect(() => {
    const supabase = createClientSupabaseBrowserClient();

    if (!supabase) {
      setSessionState("missing");
      setError("Supabase environment variables are missing.");
      return;
    }
    const browserSupabase = supabase;

    let isMounted = true;

    async function establishSessionFromUrl() {
      try {
        const currentUrl = new URL(window.location.href);
        const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
        const searchParams = currentUrl.searchParams;
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const accessToken = hashParams.get("access_token") ?? searchParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") ?? searchParams.get("refresh_token");

        let establishedFromUrl = false;

        if (code) {
          const { error: exchangeError } = await browserSupabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
          establishedFromUrl = true;
        } else if (tokenHash && type) {
          const { error: verifyError } = await browserSupabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType
          });
          if (verifyError) {
            throw verifyError;
          }
          establishedFromUrl = true;
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await browserSupabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (sessionError) {
            throw sessionError;
          }
          establishedFromUrl = true;
        }

        const { data } = await browserSupabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (establishedFromUrl) {
          window.history.replaceState({}, "", currentUrl.pathname);
        }

        setSessionState(data.session ? "ready" : "missing");
      } catch (sessionError) {
        if (!isMounted) {
          return;
        }

        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "This password reset link is invalid or expired. Request a new one."
        );
        setSessionState("missing");
      }
    }

    void establishSessionFromUrl();

    const {
      data: { subscription }
    } = browserSupabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setSessionState(session ? "ready" : "missing");
      if (session) {
        setError(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      if (sessionState !== "ready") {
        setSessionState("missing");
        throw new Error(
          "Open the password reset link from your email, or sign in before changing your password."
        );
      }

      const parsed = setPasswordSchema.parse(values);
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.password
      });

      if (updateError) {
        if (updateError.message.toLowerCase().includes("auth session missing")) {
          setSessionState("missing");
          throw new Error(
            "Open the password reset link from your email, or sign in before changing your password."
          );
        }
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
        {sessionState === "missing" ? (
          <div className="space-y-4">
            <div className="rounded-[1rem] border border-border/70 bg-muted/35 p-4">
              <p className="text-sm font-medium text-foreground">Secure session required</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Open the password reset link from your tourist email, or sign in first if you are
                changing your password from your account.
              </p>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/forgot-password" className="block">
                <Button type="button" variant="outline" className="w-full">
                  Recover by email
                </Button>
              </Link>
              <Link href={"/sign-in" as Route} className="block">
                <Button type="button" className="w-full">
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className={`space-y-4 ${sessionState === "missing" ? "mt-6 border-t border-border/70 pt-6" : ""}`}
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

          <Button className="w-full" type="submit" disabled={isPending || sessionState !== "ready"}>
            {sessionState === "checking"
              ? "Checking secure session..."
              : isPending
                ? "Saving password..."
                : "Save password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
