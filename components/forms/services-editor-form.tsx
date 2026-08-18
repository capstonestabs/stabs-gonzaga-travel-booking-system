"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Clock3, ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { optimizeImageToWebp } from "@/lib/browser-image";
import { formatServiceWindowLabel } from "@/lib/booking-state";
import {
  formatServiceTypeLabel,
  normalizeServiceTypeLabel,
  SERVICE_TYPE_MAX_LENGTH
} from "@/lib/service-types";
import type { DestinationService, ListingCategory } from "@/lib/types";
import { DEFAULT_OPEN_WEEKDAYS, WEEKDAYS } from "@/lib/service-schedule";

function createServiceRow(
  source?: Partial<DestinationService>,
  destinationCategory?: ListingCategory
) {
  const imagePaths = source?.image_paths?.length
    ? source.image_paths
    : source?.image_path ? [source.image_path] : [];
  const imageUrls = source?.image_urls?.length
    ? source.image_urls
    : source?.image_url ? [source.image_url] : [];

  return {
    id: source?.id ?? "",
    title: source?.title ?? "",
    description: source?.description ?? "",
    priceAmount: (source?.price_amount ?? 0) as number | string,
    serviceType: normalizeServiceTypeLabel(source?.service_type, destinationCategory),
    dailyCapacity: source?.daily_capacity ?? 10,
    imagePath: source?.image_path ?? "",
    imageUrl: source?.image_url ?? "",
    imagePaths,
    imageUrls,
    availabilityStartDate: source?.availability_start_date ?? "",
    availabilityEndDate: source?.availability_end_date ?? "",
    openingTime: source?.opening_time?.slice(0, 5) ?? "08:00",
    closingTime: source?.closing_time?.slice(0, 5) ?? "17:00",
    openWeekdays: source?.open_weekdays?.length ? source.open_weekdays : DEFAULT_OPEN_WEEKDAYS,
    operatingRemarks: source?.operating_remarks ?? "",
    isActive: source?.is_active ?? true,
    unitCount: (source?.unit_count ?? "") as number | string,
    unitLabel: source?.unit_label ?? "",
    features: source?.features?.length ? source.features : ([] as string[]),
    _uiId: crypto.randomUUID()
  };
}

type ServiceRow = ReturnType<typeof createServiceRow>;

export function ServicesEditorForm({
  destinationId,
  destinationCategory,
  services,
  currency = "PHP",
  hideAddRow = false,
  onSuccess
}: {
  destinationId: string;
  destinationCategory: ListingCategory;
  services: DestinationService[];
  currency?: string;
  hideAddRow?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const initialRows = useMemo(
    () =>
      services.length > 0
        ? services.map((service) => createServiceRow(service, destinationCategory))
        : [createServiceRow(undefined, destinationCategory)],
    [destinationCategory, services]
  );
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);
  const [featureDrafts, setFeatureDrafts] = useState<Record<string, string>>({});

  function addFeatureTag(index: number, uiId: string) {
    const draftValue = (featureDrafts[uiId] ?? "").trim();
    if (!draftValue) return;
    const newTags = draftValue.split(",").map((tag) => tag.trim()).filter(Boolean);
    setRows((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index
          ? { ...entry, features: Array.from(new Set([...entry.features, ...newTags])) }
          : entry
      )
    );
    setFeatureDrafts((current) => ({ ...current, [uiId]: "" }));
  }

  function removeFeatureTag(index: number, tag: string) {
    setRows((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index
          ? { ...entry, features: entry.features.filter((existing) => existing !== tag) }
          : entry
      )
    );
  }

  const hasChanges =
    JSON.stringify(rows.map(({ _uiId, ...row }) => row)) !==
    JSON.stringify(initialRows.map(({ _uiId, ...row }) => row));

  function updateRow(index: number, next: Partial<ServiceRow>) {
    setRows((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, ...next } : entry
      )
    );
  }

  async function handleImageUpload(index: number, files: File[]) {
    if (!files.length) {
      return;
    }

    setError(null);
    setMessage(null);
    setUploadingRowId(rows[index]?._uiId ?? null);

    try {
      const row = rows[index];
      const remainingSlots = 5 - row.imageUrls.length;
      if (remainingSlots <= 0 || files.length > remainingSlots) {
        throw new Error(`You can upload up to 5 photos per service (${remainingSlots} slot${remainingSlots === 1 ? "" : "s"} remaining).`);
      }

      const nextPaths = [...row.imagePaths];
      const nextUrls = [...row.imageUrls];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files can be uploaded for service photos.");
        }

        if (file.size > 8 * 1024 * 1024) {
          throw new Error("Each service photo must be under 8MB before optimization.");
        }

        const optimizedFile = await optimizeImageToWebp(file);
        const payload = new FormData();
        payload.append("file", optimizedFile);
        payload.append("folder", "services");
        payload.append("destinationId", destinationId);

        const response = await fetch("/api/uploads", { method: "POST", body: payload });
        const body = (await response.json()) as { error?: string; publicUrl?: string; path?: string };

        if (!response.ok || !body.path || !body.publicUrl) {
          throw new Error(body.error ?? "Unable to upload a service photo.");
        }
        nextPaths.push(body.path);
        nextUrls.push(body.publicUrl);
      }

      updateRow(index, {
        imagePath: nextPaths[0] ?? "",
        imageUrl: nextUrls[0] ?? "",
        imagePaths: nextPaths,
        imageUrls: nextUrls
      });
      setMessage(`${files.length} service photo${files.length === 1 ? "" : "s"} uploaded. Save the service to keep them.`);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Unable to upload the service photo."
      );
    } finally {
      setUploadingRowId(null);
    }
  }

  async function handleSave() {
    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      for (const row of rows) {
        if (!row.title.trim()) {
          throw new Error("All active services must have a valid title.");
        }

        if (!row.serviceType.trim().replace(/^\/+/, "")) {
          throw new Error("All services must have a service type label.");
        }

        if (
          row.availabilityStartDate &&
          row.availabilityEndDate &&
          row.availabilityEndDate < row.availabilityStartDate
        ) {
          throw new Error(`The end date for "${row.title || "this service"}" must be on or after the start date.`);
        }

        if (row.openingTime && row.closingTime && row.openingTime >= row.closingTime) {
          throw new Error(`The closing time for "${row.title || "this service"}" must be after its opening time.`);
        }

        if (row.openWeekdays.length === 0) {
          throw new Error(`Select at least one open day for "${row.title || "this service"}."`);
        }
      }

      const response = await fetch(`/api/destinations/${destinationId}/services`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: rows.map((row) => ({
            id: row.id || undefined,
            title: row.title.trim(),
            description: row.description.trim(),
            priceAmount: Number(row.priceAmount || 0),
            dailyCapacity: Number(row.dailyCapacity || 10),
            serviceType: normalizeServiceTypeLabel(row.serviceType, destinationCategory),
            imagePath: row.imagePath || null,
            imageUrl: row.imageUrl || null,
            imagePaths: row.imagePaths,
            imageUrls: row.imageUrls,
            availabilityStartDate: row.availabilityStartDate || null,
            availabilityEndDate: row.availabilityEndDate || null,
            openingTime: row.openingTime || null,
            closingTime: row.closingTime || null,
            unitCount: row.unitCount === "" ? null : Number(row.unitCount),
            unitLabel: row.unitLabel.trim() || null,
            features: row.features,
            openWeekdays: row.openWeekdays,
            operatingRemarks: row.operatingRemarks.trim(),
            isActive: row.isActive
          }))
        })
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to save services.");
      }

      setMessage(body.message ?? "Services saved globally.");
      onSuccess?.();
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to save services."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <CardTitle>Services &amp; Packages</CardTitle>
        <p className="text-sm text-muted-foreground">
          Define the services tourists can choose, add up to five photos, and set the booking window and operating schedule for each offer.
          The configured slot count stays as your total daily capacity. Existing bookings only reduce live availability, not this saved value.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-foreground">
            {hideAddRow ? "Service details" : "New service details"}
          </p>
          {!hideAddRow ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setRows((current) => [...current, createServiceRow(undefined, destinationCategory)])
              }
            >
              Add service row
            </Button>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-[1rem] border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            No service packages mapped. Your destination cannot be booked unless an active service exists.
          </div>
        ) : null}

        <div className="grid gap-4">
          {rows.map((row, index) => (
            <div
              key={row._uiId}
              className={`grid gap-4 rounded-[1rem] border border-border/70 p-4 transition-colors ${row.isActive ? "bg-muted/15" : "bg-muted/40 opacity-75"}`}
            >
              <div className="grid gap-4 lg:grid-cols-[180px,minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {row.imageUrls.map((url, photoIndex) => (
                      <div key={`${url}-${photoIndex}`} className="group/photo relative aspect-[4/3] overflow-hidden rounded-[0.8rem] border border-border/70 bg-muted/40">
                        <img src={url} alt={`${row.title || "Service"} photo ${photoIndex + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          aria-label={`Remove photo ${photoIndex + 1}`}
                          className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white"
                          onClick={() => {
                            const imagePaths = row.imagePaths.filter((_, current) => current !== photoIndex);
                            const imageUrls = row.imageUrls.filter((_, current) => current !== photoIndex);
                            updateRow(index, { imagePaths, imageUrls, imagePath: imagePaths[0] ?? "", imageUrl: imageUrls[0] ?? "" });
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {row.imageUrls.length === 0 ? (
                      <div className="col-span-2 flex aspect-[4/3] items-center justify-center rounded-[1rem] border border-dashed border-border/70 bg-muted/40 px-4 text-center text-xs text-muted-foreground">
                        Optional service photos
                      </div>
                    ) : null}
                  </div>

                  <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-medium"><ImagePlus className="h-4 w-4" /> Service photos ({row.imageUrls.length}/5)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={row.imageUrls.length >= 5 || uploadingRowId === row._uiId}
                      className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
                      onChange={(event) => {
                        void handleImageUpload(index, Array.from(event.target.files ?? []));
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {uploadingRowId === row._uiId ? (
                      <span className="self-center text-xs text-muted-foreground">
                        Uploading...
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-[1.5fr,1fr,1fr,1fr]">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Service name</span>
                      <Input
                        placeholder="e.g. Standard Entrance, Group Package"
                        value={row.title}
                        onChange={(event) => updateRow(index, { title: event.target.value })}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium">Service type</span>
                      <Input
                        maxLength={SERVICE_TYPE_MAX_LENGTH}
                        placeholder="person"
                        value={row.serviceType}
                        onChange={(event) => updateRow(index, { serviceType: event.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Displayed beside the price as{" "}
                        {formatServiceTypeLabel(row.serviceType, {
                          category: destinationCategory,
                          includeSlash: true
                        })}
                        .
                      </p>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium">Price ({currency})</span>
                      <Input
                        type="number"
                        min={0}
                        value={row.priceAmount}
                        onChange={(event) =>
                          updateRow(index, {
                            priceAmount: event.target.value === "" ? "" : Number(event.target.value)
                          })
                        }
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium">Configured daily slots</span>
                      <Input
                        type="number"
                        min={1}
                        value={row.dailyCapacity}
                        onChange={(event) =>
                          updateRow(index, { dailyCapacity: Number(event.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        This is the total number of guests this package can accept per available day.
                        Occupied bookings reduce live availability separately.
                      </p>
                    </label>
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">Description</span>
                    <Textarea
                      placeholder="Additional details about what this service includes..."
                      className="h-20 resize-none"
                      value={row.description}
                      onChange={(event) => updateRow(index, { description: event.target.value })}
                    />
                  </label>

                                    <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Unit / room count (optional)</span>
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 8"
                        value={row.unitCount}
                        onChange={(event) =>
                          updateRow(index, {
                            unitCount: event.target.value === "" ? "" : Number(event.target.value)
                          })
                        }
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium">Unit label (optional)</span>
                      <Input
                        placeholder="e.g. Rooms, Boats, Slots"
                        value={row.unitLabel}
                        onChange={(event) => updateRow(index, { unitLabel: event.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Shown as &quot;{row.unitCount || "8"} {row.unitLabel || "Rooms"}&quot;. Leave both
                        blank for scenery-only packages with nothing to count.
                      </p>
                    </label>
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">Features (optional)</span>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. WiFi, Aircon, Pool access"
                        value={featureDrafts[row._uiId] ?? ""}
                        onChange={(event) =>
                          setFeatureDrafts((current) => ({ ...current, [row._uiId]: event.target.value }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addFeatureTag(index, row._uiId);
                          }
                        }}
                      />
                      <Button type="button" variant="secondary" onClick={() => addFeatureTag(index, row._uiId)}>
                        Add
                      </Button>
                    </div>
                    {row.features.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {row.features.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium"
                          >
                            {tag}
                            <button
                              type="button"
                              aria-label={`Remove ${tag}`}
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => removeFeatureTag(index, tag)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Type a feature and press Enter or Add. Separate multiple with commas.
                      </p>
                    )}
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Booking start date</span>
                      <Input
                        type="date"
                        value={row.availabilityStartDate}
                        onChange={(event) =>
                          updateRow(index, { availabilityStartDate: event.target.value })
                        }
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium">Booking end date</span>
                      <Input
                        type="date"
                        min={row.availabilityStartDate || undefined}
                        value={row.availabilityEndDate}
                        onChange={(event) =>
                          updateRow(index, { availabilityEndDate: event.target.value })
                        }
                      />
                    </label>
                  </div>

                  <div className="rounded-[0.95rem] border border-border/70 bg-card px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Booking window
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatServiceWindowLabel({
                        availabilityStartDate: row.availabilityStartDate || null,
                        availabilityEndDate: row.availabilityEndDate || null
                      })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Outside this window, the service calendar will show the dates as unavailable.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-[0.95rem] border border-border/70 bg-card px-4 py-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Clock3 className="h-4 w-4 text-primary" /> Operating hours
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Set the time and recurring days when this service is available.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium">Opening time</span>
                        <Input type="time" value={row.openingTime} onChange={(event) => updateRow(index, { openingTime: event.target.value })} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium">Closing time</span>
                        <Input type="time" value={row.closingTime} onChange={(event) => updateRow(index, { closingTime: event.target.value })} />
                      </label>
                    </div>

                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">Open days</legend>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                        {WEEKDAYS.map((day) => {
                          const selected = row.openWeekdays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              aria-pressed={selected}
                              className={`rounded-[0.7rem] border px-2 py-2 text-xs font-semibold transition-colors ${selected ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-muted/30 text-muted-foreground"}`}
                              onClick={() => updateRow(index, {
                                openWeekdays: selected
                                  ? row.openWeekdays.filter((value) => value !== day.value)
                                  : [...row.openWeekdays, day.value].sort((left, right) => left - right)
                              })}
                            >
                              {day.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    <label className="space-y-2">
                      <span className="text-sm font-medium">Remarks (optional)</span>
                      <Textarea
                        maxLength={300}
                        placeholder="e.g. Please arrive before closing time."
                        className="h-20 resize-none"
                        value={row.operatingRemarks}
                        onChange={(event) => updateRow(index, { operatingRemarks: event.target.value })}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    onChange={(event) => updateRow(index, { isActive: event.target.checked })}
                  />
                  Active (show to tourists)
                </label>
                {!hideAddRow ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRows((current) => current.filter((entry) => entry._uiId !== row._uiId))
                    }
                  >
                    Remove service
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <Button
          type="button"
          disabled={isPending || uploadingRowId !== null || !hasChanges}
          onClick={handleSave}
          className="w-full sm:w-auto"
        >
          {isPending ? "Saving..." : hideAddRow ? "Update service" : "Create service package"}
        </Button>
      </CardContent>
    </Card>
  );
}
