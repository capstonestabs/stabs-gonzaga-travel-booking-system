"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TouristProfileFormProps {
  defaultValues?: {
    fullName?: string | null;
    phone?: string | null;
  };
}

export function TouristProfileForm({ defaultValues }: TouristProfileFormProps) {
  const router = useRouter();
  const initialValues = useMemo(
    () => ({
      fullName: defaultValues?.fullName ?? "",
      phone: defaultValues?.phone ?? ""
    }),
    [defaultValues?.fullName, defaultValues?.phone]
  );
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [phone, setPhone] = useState(initialValues.phone);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const hasChanges = fullName !== initialValues.fullName || phone !== initialValues.phone;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsPending(true);

    const payload = {
      fullName,
      phone
    };

    try {
      const response = await fetch("/api/tourist-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to update profile");

      setMessage("Personal details updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Full Name</span>
            <Input
              name="fullName"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                setError(null);
                setMessage(null);
              }}
              placeholder="Your full name"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Phone Number</span>
            <Input
              name="phone"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setError(null);
                setMessage(null);
              }}
              placeholder="09XX XXX XXXX"
            />
          </label>
          
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}

          <Button type="submit" disabled={isPending || !hasChanges} className="w-fit">
            {isPending ? "Saving..." : "Save details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
