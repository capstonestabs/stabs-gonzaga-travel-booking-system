"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { optimizeImageToWebp } from "@/lib/browser-image";
import type { DestinationImage } from "@/lib/types";

export function DestinationImageUpload({
  destinationId,
  coverUrl,
  galleryImages
}: {
  destinationId: string;
  coverUrl: string | null;
  galleryImages: DestinationImage[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setSelectedFiles(files);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsUploading(true);

    try {
      if (selectedFiles.length < 1 || selectedFiles.length > 6) {
        throw new Error("Select 1 to 6 images.");
      }

      const optimizedFiles = await Promise.all(
        selectedFiles.map((file) => optimizeImageToWebp(file))
      );

      const coverFormData = new FormData();
      coverFormData.append("file", optimizedFiles[0]);
      coverFormData.append("folder", "covers");
      coverFormData.append("destinationId", destinationId);

      const coverResponse = await fetch("/api/uploads", {
        method: "POST",
        body: coverFormData
      });

      const coverBody = (await coverResponse.json()) as { error?: string };
      if (!coverResponse.ok) {
        throw new Error(coverBody.error ?? "Failed to upload cover.");
      }

      for (const image of galleryImages) {
        await fetch(`/api/destination-images/${image.id}`, {
          method: "DELETE"
        });
      }

      for (let i = 1; i < optimizedFiles.length; i++) {
        const payload = new FormData();
        payload.append("file", optimizedFiles[i]);
        payload.append("folder", "destinations");
        payload.append("destinationId", destinationId);
        payload.append("sortOrder", String(i - 1));

        const response = await fetch("/api/uploads", {
          method: "POST",
          body: payload
        });

        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? `Failed to upload gallery image ${i}.`);
        }
      }

      setMessage(`Uploaded ${optimizedFiles.length} image(s).`);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to upload images."
      );
    } finally {
      setIsUploading(false);
    }
  }

  const hasExistingImages = Boolean(coverUrl) || galleryImages.length > 0;

  return (
    <Card>
      <CardHeader className="border-b border-border/70">
        <CardTitle>Destination images</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          The first image you upload becomes the cover photo. Upload 1 to 6 in total.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-5 sm:p-6">
        {hasExistingImages && (
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Current photos
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {coverUrl && (
                <div className="relative">
                  <img
                    src={coverUrl}
                    alt="Current cover"
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground backdrop-blur">
                    <Star className="h-3 w-3 fill-current" />
                    Cover
                  </span>
                </div>
              )}
              {galleryImages.map((image) => (
                <img
                  key={image.id}
                  src={image.image_url}
                  alt={image.alt_text ?? "Gallery image"}
                  className="aspect-video w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={fileInputRef}
            name="files"
            type="file"
            accept="image/*"
            multiple
            required
            className="sr-only"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-[1rem] border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center transition hover:border-primary/50 hover:bg-muted/45"
          >
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} selected`
                : "Tap to choose images"}
            </span>
            <span className="text-xs text-muted-foreground">
              Select 1 to 6 photos. First one is used as the cover.
            </span>
          </button>

          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Selected ${index + 1}`}
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground backdrop-blur">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <Button
            type="submit"
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full sm:w-auto"
          >
            {isUploading ? "Uploading..." : "Upload images"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}