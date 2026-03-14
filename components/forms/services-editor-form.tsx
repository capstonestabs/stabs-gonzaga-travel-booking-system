"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { optimizeImageToWebp } from "@/lib/browser-image";
import { formatServiceWindowLabel } from "@/lib/booking-state";
import type { DestinationService, ServiceType } from "@/lib/types";

function createServiceRow(source?: Partial<DestinationService>) {
  return {
    id: source?.id ?? "",
    title: source?.title ?? "",
    description: source?.description ?? "",
    priceAmount: (source?.price_amount ?? 0) as number | string,
    serviceType: source?.service_type ?? "standard",
    dailyCapacity: source?.daily_capacity ?? 10,
    imagePath: source?.image_path ?? "",
    imageUrl: source?.image_url ?? "",
    availabilityStartDate: source?.availability_start_date ?? "",
    availabilityEndDate: source?.availability_end_date ?? "",
    isActive: source?.is_active ?? true,
    _uiId: crypto.randomUUID()
  };
}

type ServiceRow = ReturnType<typeof createServiceRow>;

export function ServicesEditorForm({
  destinationId,
  services,
  currency = "PHP",
  hideAddRow = false,
  onSuccess
}: {
  destinationId: string;
  services: DestinationService[];
  currency?: string;
  hideAddRow?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(
    services.length > 0 ? services.map((service) => createServiceRow(service)) : [createServiceRow()]
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);

  function updateRow(index: number, next: Partial<ServiceRow>) {
    setRows((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, ...next } : entry
      )
    );
  }

  async function handleImageUpload(index: number, file: File | null) {
    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);
    setUploadingRowId(rows[index]?._uiId ?? null);

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files can be uploaded for a service photo.");
      }

      if (file.size > 8 * 1024 * 1024) {
        throw new Error("Service photos must be under 8MB before optimization.");
      }

      const optimizedFile = await optimizeImageToWebp(file);
      const payload = new FormData();
      payload.append("file", optimizedFile);
      payload.append("folder", "services");
      payload.append("destinationId", destinationId);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: payload
      });

      const body = (await response.json()) as {
        error?: string;
        publicUrl?: string;
        path?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to upload the service photo.");
      }

      updateRow(index, {
        imagePath: body.path ?? "",
        imageUrl: body.publicUrl ?? ""
      });
      setMessage("Service photo uploaded. Save the service to keep it.");
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

        if (
          row.availabilityStartDate &&
          row.availabilityEndDate &&
          row.availabilityEndDate < row.availabilityStartDate
        ) {
          throw new Error(`The end date for "${row.title || "this service"}" must be on or after the start date.`);
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
            serviceType: row.serviceType,
            imagePath: row.imagePath || null,
            imageUrl: row.imageUrl || null,
            availabilityStartDate: row.availabilityStartDate || null,
            availabilityEndDate: row.availabilityEndDate || null,
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
          Define the services tourists can choose, add an optional service photo, and set the booking date window for each offer.
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
              onClick={() => setRows((current) => [...current, createServiceRow()])}
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
                  <div className="overflow-hidden rounded-[1rem] border border-border/70 bg-card">
                    <div className="aspect-[4/3] overflow-hidden bg-muted/40">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt={`${row.title || "Service"} preview`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                          Optional service photo
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Service photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
                      onChange={(event) => {
                        void handleImageUpload(index, event.target.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!row.imageUrl}
                      onClick={() => updateRow(index, { imagePath: "", imageUrl: "" })}
                    >
                      Remove photo
                    </Button>
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
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                        value={row.serviceType}
                        onChange={(event) =>
                          updateRow(index, { serviceType: event.target.value as ServiceType })
                        }
                      >
                        <option value="standard">Standard</option>
                        <option value="package">Bulk Package</option>
                        <option value="discounted">Discounted</option>
                      </select>
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

        <Button type="button" disabled={isPending || uploadingRowId !== null} onClick={handleSave} className="w-full sm:w-auto">
          {isPending ? "Saving..." : hideAddRow ? "Update service" : "Create service package"}
        </Button>
      </CardContent>
    </Card>
  );
}
