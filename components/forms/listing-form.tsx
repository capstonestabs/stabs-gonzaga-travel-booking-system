"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface ListingFormProps {
  destinationId?: string;
  staffId?: string;
  canEditIdentity?: boolean;
  showContactFields?: boolean;
  contactEmailDefault?: string;
  contactPhoneDefault?: string;
  cardTitle?: string;
  cardDescription?: string;
  submitLabel?: string;
  showFeaturedToggle?: boolean;
  defaultValues?: {
    title?: string;
    summary?: string;
    description?: string;
    locationText?: string;
    category?: "tour" | "stay";
    bookingType?: "online" | "walk-in";
    status?: "draft" | "published" | "archived";
    inclusions?: string;
    policies?: string;
    featured?: boolean;
  };
}

export function ListingForm({
  destinationId,
  staffId,
  canEditIdentity = true,
  showContactFields = false,
  contactEmailDefault,
  contactPhoneDefault,
  cardTitle,
  cardDescription,
  submitLabel,
  showFeaturedToggle = true,
  defaultValues
}: ListingFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setIsPending(true);

    const payload = {
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      description: String(formData.get("description") ?? ""),
      locationText: String(formData.get("locationText") ?? ""),
      staffId,
      contactEmail: showContactFields ? String(formData.get("contactEmail") ?? "") : undefined,
      contactPhone: showContactFields ? String(formData.get("contactPhone") ?? "") : undefined,
      category: String(formData.get("category") ?? "tour"),
      bookingType: String(formData.get("bookingType") ?? "online"),
      status: String(formData.get("status") ?? "draft"),
      inclusions: String(formData.get("inclusions") ?? ""),
      policies: String(formData.get("policies") ?? ""),
      featured: formData.get("featured") === "on"
    };

    try {
      const response = await fetch(destinationId ? `/api/destinations/${destinationId}` : "/api/destinations", {
        method: destinationId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = (await response.json()) as { error?: string; destination?: { title: string } };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to save destination.");
      }

      setMessage(
        destinationId
          ? "Listing updated."
          : `Listing created${body.destination?.title ? `: ${body.destination.title}` : "."}`
      );
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to save destination."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <CardTitle>{cardTitle ?? (destinationId ? "Edit destination" : "Create destination")}</CardTitle>
        {cardDescription ? <p className="text-sm text-muted-foreground">{cardDescription}</p> : null}
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          {canEditIdentity ? (
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Title</span>
              <Input name="title" defaultValue={defaultValues?.title} required />
            </label>
          ) : (
            <input name="title" defaultValue={defaultValues?.title ?? ""} type="hidden" />
          )}

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Summary</span>
            <Textarea
              name="summary"
              defaultValue={defaultValues?.summary}
              className="min-h-24"
              minLength={10}
              placeholder="Short public summary for the destination"
              required
            />
            <p className="text-xs text-muted-foreground">
              At least 10 characters. This appears on destination cards and previews.
            </p>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Description</span>
            <Textarea
              name="description"
              defaultValue={defaultValues?.description}
              minLength={20}
              placeholder="Full destination details, inclusions, and visitor expectations"
              required
            />
            <p className="text-xs text-muted-foreground">
              At least 20 characters. Use this for the full public listing details.
            </p>
          </label>

          {canEditIdentity ? (
            <label className="space-y-2">
              <span className="text-sm font-medium">Location</span>
              <Input
                name="locationText"
                defaultValue={defaultValues?.locationText}
                placeholder="Barangay, beach, resort, or landmark in Gonzaga"
                required
              />
            </label>
          ) : (
            <input
              name="locationText"
              defaultValue={defaultValues?.locationText ?? ""}
              type="hidden"
            />
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium">Category</span>
            <select
              name="category"
              defaultValue={defaultValues?.category ?? "tour"}
              className="flex h-12 w-full rounded-2xl border border-input/90 bg-card px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
            >
              <option value="tour">Tour</option>
              <option value="stay">Stay</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select
              name="status"
              defaultValue={defaultValues?.status ?? "draft"}
              className="flex h-12 w-full rounded-2xl border border-input/90 bg-card px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          {showContactFields ? (
            <>
              <label className="space-y-2">
                <span className="text-sm font-medium">Destination contact email</span>
                <Input
                  name="contactEmail"
                  type="email"
                  defaultValue={contactEmailDefault}
                  placeholder="email@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  This email is shown on the destination page for tourist inquiries. Changing it
                  here does not change the staff login email.
                </p>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Destination contact number</span>
                <Input
                  name="contactPhone"
                  defaultValue={contactPhoneDefault}
                  placeholder="09XX XXX XXXX"
                />
                <p className="text-xs text-muted-foreground">
                  This number appears on the destination page for visitor inquiries and walk-ins.
                </p>
              </label>
            </>
          ) : null}

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Inclusions, one per line</span>
            <Textarea
              name="inclusions"
              defaultValue={defaultValues?.inclusions}
              className="min-h-28"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Policies, one per line</span>
            <Textarea
              name="policies"
              defaultValue={defaultValues?.policies}
              className="min-h-28"
            />
          </label>

          {showFeaturedToggle ? (
            <label className="flex items-center gap-3 text-sm font-medium md:col-span-2">
              <input name="featured" type="checkbox" defaultChecked={defaultValues?.featured} />
              Feature on destinations
            </label>
          ) : null}

          {error ? (
            <p className="text-sm whitespace-pre-line text-destructive md:col-span-2">{error}</p>
          ) : null}
          {message ? <p className="text-sm text-emerald-700 md:col-span-2">{message}</p> : null}

          <div className="border-t border-border/60 pt-4 md:col-span-2">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Saving..." : submitLabel ?? (destinationId ? "Save destination" : "Create destination")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
