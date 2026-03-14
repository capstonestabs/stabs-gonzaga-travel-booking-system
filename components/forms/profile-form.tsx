"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AppUser, StaffProfile, UserRole } from "@/lib/types";

type Mode = "self" | "admin-staff";

export function ProfileForm({
  mode,
  role,
  email,
  initialUser,
  initialStaffProfile,
  endpoint
}: {
  mode: Mode;
  role: UserRole;
  email: string;
  initialUser: AppUser;
  initialStaffProfile?: StaffProfile | null;
  endpoint: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const showStaffFields = role === "staff" || mode === "admin-staff";

  async function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setIsPending(true);

    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      avatarUrl: String(formData.get("avatarUrl") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? "")
    };

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to update profile.");
      }

      setMessage(body.message ?? (mode === "admin-staff" ? "Staff account updated." : "Account updated."));
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to update profile."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="h-fit self-start">
      <CardHeader>
        <CardTitle>{mode === "self" ? "Account details" : "Staff account details"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="grid gap-3 md:grid-cols-2"
        >
          <input name="avatarUrl" defaultValue={initialUser.avatar_url ?? ""} type="hidden" />

          <label className="space-y-2">
            <span className="text-sm font-medium">Full name</span>
            <Input name="fullName" defaultValue={initialUser.full_name ?? ""} required />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Email</span>
            <Input value={email} disabled readOnly />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Phone</span>
            <Input name="phone" defaultValue={initialUser.phone ?? ""} />
          </label>

          {showStaffFields ? (
            <>
              <label className="space-y-2">
                <span className="text-sm font-medium">Contact email</span>
                <Input
                  name="contactEmail"
                  type="email"
                  defaultValue={initialStaffProfile?.contact_email ?? email}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Contact phone</span>
                <Input
                  name="contactPhone"
                  defaultValue={initialStaffProfile?.contact_phone ?? ""}
                />
              </label>
            </>
          ) : null}

          {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700 md:col-span-2">{message}</p> : null}

          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : mode === "admin-staff" ? "Save staff account" : "Save account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
