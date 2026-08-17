"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  const initialValues = useMemo(
    () => ({
      fullName: initialUser.full_name ?? "",
      phone: initialUser.phone ?? "",
      avatarUrl: initialUser.avatar_url ?? "",
      contactEmail: initialStaffProfile?.contact_email ?? email,
      contactPhone: initialStaffProfile?.contact_phone ?? ""
    }),
    [
      email,
      initialStaffProfile?.contact_email,
      initialStaffProfile?.contact_phone,
      initialUser.avatar_url,
      initialUser.full_name,
      initialUser.phone
    ]
  );
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [phone, setPhone] = useState(initialValues.phone);
  const [contactEmail, setContactEmail] = useState(initialValues.contactEmail);
  const [contactPhone, setContactPhone] = useState(initialValues.contactPhone);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const showStaffFields = role === "staff" || mode === "admin-staff";
  const hasChanges =
    fullName !== initialValues.fullName ||
    phone !== initialValues.phone ||
    (showStaffFields && contactEmail !== initialValues.contactEmail) ||
    (showStaffFields && contactPhone !== initialValues.contactPhone);

  async function handleSubmit() {
    setError(null);
    setMessage(null);
    setIsPending(true);

    const payload = {
      fullName,
      phone,
      avatarUrl: initialValues.avatarUrl,
      contactEmail: showStaffFields ? contactEmail : "",
      contactPhone: showStaffFields ? contactPhone : ""
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
            void handleSubmit();
          }}
          className="grid gap-3 md:grid-cols-2"
        >
          <input name="avatarUrl" value={initialValues.avatarUrl} type="hidden" readOnly />

          <label className="space-y-2">
            <span className="text-sm font-medium">Full name</span>
            <Input
              name="fullName"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                setError(null);
                setMessage(null);
              }}
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Email</span>
            <Input value={email} disabled readOnly />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Phone</span>
            <Input
              name="phone"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setError(null);
                setMessage(null);
              }}
            />
          </label>

          {showStaffFields ? (
            <>
              <label className="space-y-2">
                <span className="text-sm font-medium">Contact email</span>
                <Input
                  name="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => {
                    setContactEmail(event.target.value);
                    setError(null);
                    setMessage(null);
                  }}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Contact phone</span>
                <Input
                  name="contactPhone"
                  value={contactPhone}
                  onChange={(event) => {
                    setContactPhone(event.target.value);
                    setError(null);
                    setMessage(null);
                  }}
                />
              </label>
            </>
          ) : null}

          {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700 md:col-span-2">{message}</p> : null}

          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending || !hasChanges}>
              {isPending ? "Saving..." : mode === "admin-staff" ? "Save staff account" : "Save account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
