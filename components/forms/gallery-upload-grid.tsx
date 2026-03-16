"use client";

import { useRouter } from "next/navigation";
import { type DragEvent, useEffect, useRef, useState } from "react";
import { GripVertical, ImagePlus, Images, Pencil, RefreshCcw, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { optimizeImageToWebp } from "@/lib/browser-image";
import type { DestinationImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GalleryUploadGrid({
  destinationId,
  images,
  maxItems = 5
}: {
  destinationId: string;
  images: DestinationImage[];
  maxItems?: number;
}) {
  const router = useRouter();
  const emptySlotInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const replaceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [nextUploadAltText, setNextUploadAltText] = useState("");
  const [draftAltTexts, setDraftAltTexts] = useState<Record<string, string>>({});
  const [draggedImage, setDraggedImage] = useState<{ id: string; sortOrder: number } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [imagePendingDelete, setImagePendingDelete] = useState<DestinationImage | null>(null);

  const orderedImages = [...images].sort((left, right) => left.sort_order - right.sort_order);
  const slotMap = new Map(orderedImages.map((image) => [image.sort_order, image]));
  const slots = Array.from({ length: maxItems }, (_, index) => slotMap.get(index) ?? null);
  const hasDescriptionChanges = orderedImages.some(
    (image) => (draftAltTexts[image.id] ?? "") !== (image.alt_text ?? "")
  );

  useEffect(() => {
    setDraftAltTexts(
      Object.fromEntries(orderedImages.map((image) => [image.id, image.alt_text ?? ""]))
    );
  }, [images]);

  async function uploadGalleryImage(slotIndex: number, file: File | null) {
    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);
    setPendingKey(`create-${slotIndex}`);

    try {
      if (file.size > 8 * 1024 * 1024) {
        throw new Error("Images must be under 8MB before optimization.");
      }

      const optimizedFile = await optimizeImageToWebp(file);
      const payload = new FormData();
      payload.append("file", optimizedFile);
      payload.append("folder", "destinations");
      payload.append("destinationId", destinationId);
      payload.append("altText", nextUploadAltText);
      payload.append("sortOrder", String(slotIndex));

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: payload
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Upload failed.");
      }

      setMessage(`Gallery image uploaded to slot ${slotIndex + 1}.`);
      setNextUploadAltText("");
      if (emptySlotInputRefs.current[slotIndex]) {
        emptySlotInputRefs.current[slotIndex]!.value = "";
      }
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Upload failed.");
    } finally {
      setPendingKey(null);
    }
  }

  async function saveAllDescriptions() {
    setError(null);
    setMessage(null);
    setPendingKey("save-all");

    try {
      const updates = orderedImages.filter(
        (image) => (draftAltTexts[image.id] ?? "") !== (image.alt_text ?? "")
      );

      for (const image of updates) {
        const payload = new FormData();
        payload.append("altText", draftAltTexts[image.id] ?? "");

        const response = await fetch(`/api/destination-images/${image.id}`, {
          method: "PATCH",
          body: payload
        });

        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? "Unable to update image description.");
        }
      }

      setMessage(updates.length > 0 ? `${updates.length} description(s) saved.` : "No changes to save.");
      setIsEditing(false);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to save descriptions."
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function replaceImage(image: DestinationImage, file: File | null) {
    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);
    setPendingKey(`replace-${image.id}`);

    try {
      if (file.size > 8 * 1024 * 1024) {
        throw new Error("Images must be under 8MB before optimization.");
      }

      const optimizedFile = await optimizeImageToWebp(file);
      const payload = new FormData();
      payload.append("file", optimizedFile);
      payload.append("altText", draftAltTexts[image.id] ?? "");

      const response = await fetch(`/api/destination-images/${image.id}`, {
        method: "PATCH",
        body: payload
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to replace image.");
      }

      if (replaceInputRefs.current[image.id]) {
        replaceInputRefs.current[image.id]!.value = "";
      }
      setMessage(`Gallery image in slot ${image.sort_order + 1} replaced.`);
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to replace image.");
    } finally {
      setPendingKey(null);
    }
  }

  async function deleteImage(image: DestinationImage) {
    setError(null);
    setMessage(null);
    setPendingKey(`delete-${image.id}`);

    try {
      const response = await fetch(`/api/destination-images/${image.id}`, {
        method: "DELETE"
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to delete image.");
      }

      setMessage(`Gallery image in slot ${image.sort_order + 1} deleted.`);
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to delete image.");
    } finally {
      setPendingKey(null);
    }
  }

  async function reorderImage(image: DestinationImage, targetSortOrder: number) {
    if (image.sort_order === targetSortOrder) {
      return;
    }

    setError(null);
    setMessage(null);
    setPendingKey(`reorder-${image.id}`);

    try {
      const payload = new FormData();
      payload.append("sortOrder", String(targetSortOrder));

      const response = await fetch(`/api/destination-images/${image.id}`, {
        method: "PATCH",
        body: payload
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to reorder image.");
      }

      setMessage(`Gallery image moved to slot ${targetSortOrder + 1}.`);
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to reorder image.");
    } finally {
      setPendingKey(null);
      setDraggedImage(null);
      setDragOverSlot(null);
    }
  }

  function handleDragStart(image: DestinationImage) {
    if (pendingKey !== null) {
      return;
    }

    setDraggedImage({ id: image.id, sortOrder: image.sort_order });
    setError(null);
    setMessage(null);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, slotIndex: number) {
    if (!draggedImage || pendingKey !== null) {
      return;
    }

    event.preventDefault();
    if (dragOverSlot !== slotIndex) {
      setDragOverSlot(slotIndex);
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>, slotIndex: number) {
    if (!draggedImage || pendingKey !== null) {
      return;
    }

    event.preventDefault();

    const image = orderedImages.find((entry) => entry.id === draggedImage.id);
    if (!image) {
      setDraggedImage(null);
      setDragOverSlot(null);
      return;
    }

    void reorderImage(image, slotIndex);
  }

  function resetDragState() {
    setDraggedImage(null);
    setDragOverSlot(null);
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/70">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Gallery images</CardTitle>
          {orderedImages.length > 0 ? (
            <Button
              type="button"
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (isEditing) {
                  void saveAllDescriptions();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={pendingKey !== null || (isEditing && !hasDescriptionChanges)}
            >
              {isEditing ? (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {pendingKey === "save-all" ? "Saving..." : "Save & Close"}
                </>
              ) : (
                <>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit Gallery
                </>
              )}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            {orderedImages.length} of {maxItems} gallery images used.
          </p>
          <p>
            {isEditing
              ? "Edit descriptions, replace or delete images below. Click Save & Close when done."
              : "Drag images to reorder. Click empty slots to upload."}
          </p>
        </div>

        {/* Upload alt text — only shown in edit mode or when no images */}
        {(isEditing || orderedImages.length === 0) ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Description for next upload</span>
            <Input
              value={nextUploadAltText}
              onChange={(event) => setNextUploadAltText(event.target.value)}
              placeholder="Optional short note for the next empty slot you upload"
            />
          </label>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {slots.map((image, index) =>
            image ? (
              <div
                key={image.id}
                className={cn(
                  "overflow-hidden rounded-[1.25rem] border border-border/80 bg-card transition-colors",
                  draggedImage?.id === image.id && "opacity-70",
                  dragOverSlot === index && "border-primary/70 bg-secondary/55"
                )}
                draggable={pendingKey === null}
                onDragStart={() => handleDragStart(image)}
                onDragEnd={resetDragState}
                onDragOver={(event) => handleDragOver(event, index)}
                onDragLeave={() => {
                  if (dragOverSlot === index) {
                    setDragOverSlot(null);
                  }
                }}
                onDrop={(event) => handleDrop(event, index)}
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text ?? `Gallery image ${index + 1}`}
                  className="aspect-square w-full object-cover"
                />
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                      Slot {index + 1}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <GripVertical className="h-3.5 w-3.5" />
                      Drag
                    </span>
                  </div>

                  {/* Edit controls — only visible in edit mode */}
                  {isEditing ? (
                    <>
                      <Input
                        value={draftAltTexts[image.id] ?? ""}
                        onChange={(event) =>
                          setDraftAltTexts((current) => ({
                            ...current,
                            [image.id]: event.target.value
                          }))
                        }
                        placeholder="Short image description"
                      />
                      <input
                        ref={(node) => {
                          replaceInputRefs.current[image.id] = node;
                        }}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          void replaceImage(image, event.target.files?.[0] ?? null);
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pendingKey !== null}
                          onClick={() => replaceInputRefs.current[image.id]?.click()}
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Replace
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={pendingKey !== null}
                          onClick={() => setImagePendingDelete(image)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <div key={`empty-slot-${index}`} className="space-y-3">
                <label
                  className={cn(
                    "group flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-border/80 bg-card p-4 text-center transition-colors hover:border-primary/70 hover:bg-secondary/60",
                    pendingKey === `create-${index}` && "pointer-events-none opacity-70",
                    dragOverSlot === index && "border-primary/70 bg-secondary/55"
                  )}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDragLeave={() => {
                    if (dragOverSlot === index) {
                      setDragOverSlot(null);
                    }
                  }}
                  onDrop={(event) => handleDrop(event, index)}
                >
                  <input
                    ref={(node) => {
                      emptySlotInputRefs.current[index] = node;
                    }}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      void uploadGalleryImage(index, event.target.files?.[0] ?? null);
                    }}
                  />
                  <div className="rounded-full border border-border/80 bg-secondary p-3 text-primary">
                    {pendingKey === `create-${index}` ? (
                      <Images className="h-5 w-5 animate-pulse" />
                    ) : (
                      <ImagePlus className="h-5 w-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {pendingKey === `create-${index}`
                        ? "Uploading image..."
                        : draggedImage
                          ? "Drop image here"
                          : "Add image"}
                    </p>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Empty slot {index + 1}
                    </p>
                  </div>
                </label>
              </div>
            )
          )}
        </div>

        {/* Cancel button when editing */}
        {isEditing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              setDraftAltTexts(
                Object.fromEntries(orderedImages.map((image) => [image.id, image.alt_text ?? ""]))
              );
            }}
            className="w-full sm:w-auto"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Cancel editing
          </Button>
        ) : null}

        <ConfirmationDialog
          open={imagePendingDelete !== null}
          title="Delete this gallery image?"
          description="This removes the selected image from the destination gallery."
          confirmLabel="Delete image"
          confirmVariant="destructive"
          isPending={
            imagePendingDelete ? pendingKey === `delete-${imagePendingDelete.id}` : false
          }
          onClose={() => setImagePendingDelete(null)}
          onConfirm={async () => {
            if (!imagePendingDelete) {
              return;
            }

            const image = imagePendingDelete;
            setImagePendingDelete(null);
            await deleteImage(image);
          }}
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
