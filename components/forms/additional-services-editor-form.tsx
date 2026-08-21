"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { optimizeImageToWebp } from "@/lib/browser-image";
import type { DestinationService } from "@/lib/types";

function createAdditionalServiceRow(source?: Partial<DestinationService>) {
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
    imagePath: source?.image_path ?? "",
    imageUrl: source?.image_url ?? "",
    imagePaths,
    imageUrls,
    isActive: source?.is_active ?? true,
    _uiId: crypto.randomUUID()
  };
}

type AdditionalServiceRow = ReturnType<typeof createAdditionalServiceRow>;

export function AdditionalServicesEditorForm({
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
  const initialRows = useMemo(
    () =>
      services.length > 0
        ? services.map((service) => createAdditionalServiceRow(service))
        : [createAdditionalServiceRow(undefined)],
    [services]
  );
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);

  const hasChanges =
    JSON.stringify(rows.map(({ _uiId, ...row }) => row)) !==
    JSON.stringify(initialRows.map(({ _uiId, ...row }) => row));

  function updateRow(index: number, next: Partial<AdditionalServiceRow>) {
    setRows((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, ...next } : entry
      )
    );
  }

  async function handleImageUpload(index: number, files: File[]) {
    if (!files.length) return;

    setError(null);
    setMessage(null);
    setUploadingRowId(rows[index]?._uiId ?? null);

    try {
      const row = rows[index];
      const remainingSlots = 5 - row.imageUrls.length;
      if (remainingSlots <= 0 || files.length > remainingSlots) {
        throw new Error(`You can upload up to 5 photos per item (${remainingSlots} slot${remainingSlots === 1 ? "" : "s"} remaining).`);
      }

      const nextPaths = [...row.imagePaths];
      const nextUrls = [...row.imageUrls];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files can be uploaded.");
        }
        if (file.size > 8 * 1024 * 1024) {
          throw new Error("Each photo must be under 8MB before optimization.");
        }

        const optimizedFile = await optimizeImageToWebp(file);
        const payload = new FormData();
        payload.append("file", optimizedFile);
        payload.append("folder", "services");
        payload.append("destinationId", destinationId);

        const response = await fetch("/api/uploads", { method: "POST", body: payload });
        const body = (await response.json()) as { error?: string; publicUrl?: string; path?: string };

        if (!response.ok || !body.path || !body.publicUrl) {
          throw new Error(body.error ?? "Unable to upload a photo.");
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
      setMessage(`${files.length} photo${files.length === 1 ? "" : "s"} uploaded. Save to keep them.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the photo.");
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
          throw new Error("All active add-ons must have a valid name.");
        }
      }

      const response = await fetch(`/api/destinations/${destinationId}/services`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: rows.map((row) => ({
            id: row.id || undefined,
            serviceCategory: "additional",
            title: row.title.trim(),
            description: row.description.trim(),
            priceAmount: Number(row.priceAmount || 0),
            imagePath: row.imagePath || null,
            imageUrl: row.imageUrl || null,
            imagePaths: row.imagePaths,
            imageUrls: row.imageUrls,
            isActive: row.isActive
          }))
        })
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to save add-ons.");
      }

      setMessage(body.message ?? "Add-ons saved.");
      onSuccess?.();
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save add-ons.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <CardTitle>Additional Services</CardTitle>
        <p className="text-sm text-muted-foreground">
          Light add-ons tourists can tack onto a booking — life vests, spa access, snorkeling gear.
          No schedule or capacity settings; just a photo, name, description, price, and status.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-foreground">
            {hideAddRow ? "Add-on details" : "New add-on details"}
          </p>
          {!hideAddRow ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRows((current) => [...current, createAdditionalServiceRow(undefined)])}
            >
              Add another item
            </Button>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-[1rem] border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            No additional services yet.
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
                        <img src={url} alt={`${row.title || "Add-on"} photo ${photoIndex + 1}`} className="h-full w-full object-cover" />
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
                        Optional photo
                      </div>
                    ) : null}
                  </div>

                  <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-medium"><ImagePlus className="h-4 w-4" /> Photos ({row.imageUrls.length}/5)</span>
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

                  {uploadingRowId === row._uiId ? (
                    <span className="text-xs text-muted-foreground">Uploading...</span>
                  ) : null}
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-[1.5fr,1fr]">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Item name</span>
                      <Input
                        placeholder="e.g. Life Vest, Snorkeling Gear, Spa Access"
                        value={row.title}
                        onChange={(event) => updateRow(index, { title: event.target.value })}
                      />
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
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">Description</span>
                    <Textarea
                      placeholder="Short details about this add-on..."
                      className="h-20 resize-none"
                      value={row.description}
                      onChange={(event) => updateRow(index, { description: event.target.value })}
                    />
                  </label>
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
                    onClick={() => setRows((current) => current.filter((entry) => entry._uiId !== row._uiId))}
                  >
                    Remove item
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
          {isPending ? "Saving..." : hideAddRow ? "Update add-on" : "Create add-on"}
        </Button>
      </CardContent>
    </Card>
  );
}