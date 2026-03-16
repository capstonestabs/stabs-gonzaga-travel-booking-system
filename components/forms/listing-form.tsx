"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const initialValues = useMemo(
    () => ({
      title: defaultValues?.title ?? "",
      summary: defaultValues?.summary ?? "",
      description: defaultValues?.description ?? "",
      locationText: defaultValues?.locationText ?? "",
      category: defaultValues?.category ?? "tour",
      bookingType: defaultValues?.bookingType ?? "online",
      status: defaultValues?.status ?? "draft",
      inclusions: defaultValues?.inclusions ?? "",
      policies: defaultValues?.policies ?? "",
      featured: defaultValues?.featured ?? false,
      contactEmail: contactEmailDefault ?? "",
      contactPhone: contactPhoneDefault ?? ""
    }),
    [
      contactEmailDefault,
      contactPhoneDefault,
      defaultValues?.bookingType,
      defaultValues?.category,
      defaultValues?.description,
      defaultValues?.featured,
      defaultValues?.inclusions,
      defaultValues?.locationText,
      defaultValues?.policies,
      defaultValues?.status,
      defaultValues?.summary,
      defaultValues?.title
    ]
  );
  const [title, setTitle] = useState(initialValues.title);
  const [summary, setSummary] = useState(initialValues.summary);
  const [description, setDescription] = useState(initialValues.description);
  const [locationText, setLocationText] = useState(initialValues.locationText);
  const [category, setCategory] = useState<"tour" | "stay">(initialValues.category);
  const [bookingType] = useState<"online" | "walk-in">(initialValues.bookingType);
  const [status, setStatus] = useState<"draft" | "published" | "archived">(initialValues.status);
  const [inclusions, setInclusions] = useState(initialValues.inclusions);
  const [policies, setPolicies] = useState(initialValues.policies);
  const [featured, setFeatured] = useState(initialValues.featured);
  const [contactEmail, setContactEmail] = useState(initialValues.contactEmail);
  const [contactPhone, setContactPhone] = useState(initialValues.contactPhone);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const hasChanges =
    title !== initialValues.title ||
    summary !== initialValues.summary ||
    description !== initialValues.description ||
    locationText !== initialValues.locationText ||
    category !== initialValues.category ||
    bookingType !== initialValues.bookingType ||
    status !== initialValues.status ||
    inclusions !== initialValues.inclusions ||
    policies !== initialValues.policies ||
    featured !== initialValues.featured ||
    contactEmail !== initialValues.contactEmail ||
    contactPhone !== initialValues.contactPhone;

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  async function handleSubmit() {
    clearFeedback();
    setIsPending(true);

    const payload = {
      title,
      summary,
      description,
      locationText,
      staffId,
      contactEmail: showContactFields ? contactEmail : undefined,
      contactPhone: showContactFields ? contactPhone : undefined,
      category,
      bookingType,
      status,
      inclusions,
      policies,
      featured
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
            void handleSubmit();
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          {canEditIdentity ? (
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Title</span>
              <Input
                name="title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  clearFeedback();
                }}
                required
              />
            </label>
          ) : (
            <input name="title" value={title} type="hidden" readOnly />
          )}

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Summary</span>
            <Textarea
              name="summary"
              value={summary}
              onChange={(event) => {
                setSummary(event.target.value);
                clearFeedback();
              }}
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
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearFeedback();
              }}
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
                value={locationText}
                onChange={(event) => {
                  setLocationText(event.target.value);
                  clearFeedback();
                }}
                placeholder="Barangay, beach, resort, or landmark in Gonzaga"
                required
              />
            </label>
          ) : (
            <input name="locationText" value={locationText} type="hidden" readOnly />
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium">Category</span>
            <select
              name="category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as "tour" | "stay");
                clearFeedback();
              }}
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
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as "draft" | "published" | "archived");
                clearFeedback();
              }}
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
                  value={contactEmail}
                  onChange={(event) => {
                    setContactEmail(event.target.value);
                    clearFeedback();
                  }}
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
                  value={contactPhone}
                  onChange={(event) => {
                    setContactPhone(event.target.value);
                    clearFeedback();
                  }}
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
              value={inclusions}
              onChange={(event) => {
                setInclusions(event.target.value);
                clearFeedback();
              }}
              className="min-h-28"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Policies, one per line</span>
            <Textarea
              name="policies"
              value={policies}
              onChange={(event) => {
                setPolicies(event.target.value);
                clearFeedback();
              }}
              className="min-h-28"
            />
          </label>

          {showFeaturedToggle ? (
            <label className="flex items-center gap-3 text-sm font-medium md:col-span-2">
              <input
                name="featured"
                type="checkbox"
                checked={featured}
                onChange={(event) => {
                  setFeatured(event.target.checked);
                  clearFeedback();
                }}
              />
              Feature on destinations
            </label>
          ) : null}

          {error ? (
            <p className="text-sm whitespace-pre-line text-destructive md:col-span-2">{error}</p>
          ) : null}
          {message ? <p className="text-sm text-emerald-700 md:col-span-2">{message}</p> : null}

          <div className="border-t border-border/60 pt-4 md:col-span-2">
            <Button
              type="submit"
              disabled={isPending || (Boolean(destinationId) && !hasChanges)}
              className="w-full sm:w-auto"
            >
              {isPending
                ? "Saving..."
                : submitLabel ?? (destinationId ? "Save destination" : "Create destination")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
