"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { optimizeImageToWebp } from "@/lib/browser-image";

export function MediaUploadForm({
  destinationId,
  folder,
  currentImageUrl,
  currentCount = 0,
  maxItems
}: {
  destinationId: string;
  folder: "covers" | "destinations" | "tours";
  currentImageUrl?: string | null;
  currentCount?: number;
  maxItems?: number;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const isCover = folder === "covers";

  async function handleSubmit(formData: FormData) {
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Choose an image file before uploading.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      if (typeof maxItems === "number" && currentCount >= maxItems) {
        throw new Error(`You can upload up to ${maxItems} gallery images only.`);
      }

      if (file.size > 8 * 1024 * 1024) {
        throw new Error("Images must be under 8MB before optimization.");
      }

      const optimizedFile = await optimizeImageToWebp(file);
      const payload = new FormData();
      payload.append("file", optimizedFile);
      payload.append("folder", folder);
      payload.append("destinationId", destinationId);
      if (!isCover) {
        payload.append("altText", String(formData.get("altText") ?? ""));
      }

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: payload
      });

      const body = (await response.json()) as { error?: string; publicUrl?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Upload failed.");
      }

      setMessage(`Image uploaded${body.publicUrl ? "." : ""}`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFileName(null);
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Upload failed.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleRemoveCover() {
    if (!isCover) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsRemoving(true);

    try {
      const response = await fetch(`/api/destinations/${destinationId}/cover`, {
        method: "DELETE"
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to remove the cover photo.");
      }

      setMessage("Cover photo removed.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFileName(null);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to remove the cover photo."
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/70">
        <CardTitle>{folder === "covers" ? "Cover photo" : "Gallery image"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="space-y-4"
        >
          {typeof maxItems === "number" ? (
            <p className="text-sm text-muted-foreground">
              {currentCount} of {maxItems} gallery images used.
            </p>
          ) : null}

          {isCover ? (
            <div className="space-y-3">
              <div className="rounded-[1.15rem] border border-border/70 bg-muted/30 p-3">
                <div className="aspect-[16/10] overflow-hidden rounded-[0.9rem] bg-muted/50">
                  {currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt="Current destination cover"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                      No cover photo uploaded yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {currentImageUrl ? "Change cover photo" : "Choose cover photo"}
                </Button>

                {currentImageUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRemoving || isPending}
                    onClick={() => setIsRemoveDialogOpen(true)}
                  >
                    {isRemoving ? "Removing..." : "Remove cover photo"}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium">Image file</span>
            <input
              ref={fileInputRef}
              name="file"
              type="file"
              accept="image/*"
              required
              className="sr-only"
              onChange={(event) => {
                setError(null);
                setMessage(null);
                setSelectedFileName(event.target.files?.[0]?.name ?? null);
              }}
            />
            <div className="flex flex-wrap items-center gap-3 rounded-[1.15rem] border border-input/90 bg-card px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              {!isCover ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose image
                </Button>
              ) : null}
              <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                {selectedFileName ?? "No file selected"}
              </span>
            </div>
          </label>

          {!isCover ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium">Short image description</span>
              <input
                name="altText"
                placeholder="Optional short note for this specific image"
                className="flex h-12 w-full rounded-[1.15rem] border border-input/90 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending
              ? "Optimizing and uploading..."
              : isCover
                ? currentImageUrl
                  ? "Save new cover photo"
                  : "Upload cover photo"
                : "Upload image"}
          </Button>
        </form>
        <ConfirmationDialog
          open={isRemoveDialogOpen}
          title="Remove the current cover photo?"
          description="This removes the current cover photo from the destination page."
          confirmLabel="Remove cover photo"
          confirmVariant="destructive"
          isPending={isRemoving}
          onClose={() => setIsRemoveDialogOpen(false)}
          onConfirm={async () => {
            setIsRemoveDialogOpen(false);
            await handleRemoveCover();
          }}
        />
      </CardContent>
    </Card>
  );
}
