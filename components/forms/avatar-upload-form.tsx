"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { optimizeImageToWebp } from "@/lib/browser-image";
import { cn } from "@/lib/utils";

export function AvatarUploadForm({
  currentAvatarUrl,
  className
}: {
  currentAvatarUrl: string | null;
  className?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

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
      const optimizedFile = await optimizeImageToWebp(file, {
        maxWidth: 1200,
        quality: 0.82
      });
      const payload = new FormData();
      payload.append("file", optimizedFile);
      payload.append("folder", "avatars");

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: payload
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to upload avatar.");
      }

      setMessage("Avatar updated.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFileName(null);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to upload avatar."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className={cn("h-fit self-start", className)}>
      <CardHeader className="border-b border-border/70">
        <CardTitle>Avatar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload a square or portrait image. It will be compressed and converted to WebP before upload.
        </p>
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Current avatar"
            className="h-28 w-28 rounded-3xl border border-border object-cover"
          />
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="space-y-3"
        >
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
          <div className="space-y-2">
            <p className="text-sm font-medium">Image file</p>
            <div className="flex flex-wrap items-center gap-3 rounded-[1.15rem] border border-input/90 bg-card px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose image
              </Button>
              <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                {selectedFileName ?? "No file selected"}
              </span>
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? "Uploading..." : "Upload avatar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
