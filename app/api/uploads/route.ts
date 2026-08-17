import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { uploadSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { removePublicAsset, uploadPublicAsset } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const payload = uploadSchema.parse({
      destinationId: formData.get("destinationId") || undefined,
      folder: formData.get("folder"),
      altText: formData.get("altText") || undefined,
      sortOrder: formData.get("sortOrder") || undefined
    });

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds the 8MB limit." }, { status: 400 });
    }

    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    if (
      payload.folder !== "avatars" &&
      user.role !== "staff" &&
      user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Only staff or admin can upload listing media." }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    let previousAvatarPath: string | null = null;
    let previousCoverPath: string | null = null;
    let destination:
      | {
          id: string;
          staff_id: string;
          cover_path?: string | null;
        }
      | null = null;

    if (payload.folder !== "avatars") {
      if (!payload.destinationId) {
        return NextResponse.json(
          { error: "Destination ID is required for listing media uploads." },
          { status: 400 }
        );
      }

      const { data: lookedUpDestination, error: destinationLookupError } = await supabase
        .from("destinations")
        .select("id, staff_id, cover_path")
        .eq("id", payload.destinationId)
        .maybeSingle();

      if (destinationLookupError) {
        throw new Error(destinationLookupError.message);
      }

      if (!lookedUpDestination) {
        return NextResponse.json({ error: "Destination not found." }, { status: 404 });
      }

      if (user.role !== "admin" && lookedUpDestination.staff_id !== user.authUserId) {
        return NextResponse.json(
          { error: "You can upload media only for your own destination." },
          { status: 403 }
        );
      }

      destination = lookedUpDestination;
      previousCoverPath = lookedUpDestination.cover_path ?? null;
    } else {
      const { data: profileRow, error: profileError } = await supabase
        .from("users")
        .select("avatar_path")
        .eq("id", user.authUserId)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      previousAvatarPath = profileRow?.avatar_path ?? null;
    }

    const upload = await uploadPublicAsset({
      folder: payload.folder,
      file,
      fileNamePrefix: payload.destinationId ?? user.authUserId
    });

    if (payload.folder === "avatars") {
      const { error } = await supabase
        .from("users")
        .update({
          avatar_url: upload.publicUrl,
          avatar_path: upload.path
        })
        .eq("id", user.authUserId);

      if (error) {
        throw new Error(error.message);
      }

      if (previousAvatarPath && previousAvatarPath !== upload.path) {
        try {
          await removePublicAsset(previousAvatarPath);
        } catch {
          // Keep the new avatar even if the previous file is already missing.
        }
      }
    }

    if (payload.destinationId && destination) {
      if (payload.folder === "covers") {
        const { error } = await supabase
          .from("destinations")
          .update({
            cover_path: upload.path,
            cover_url: upload.publicUrl
          })
          .eq("id", payload.destinationId);

        if (error) {
          throw new Error(error.message);
        }

        if (previousCoverPath && previousCoverPath !== upload.path) {
          try {
            await removePublicAsset(previousCoverPath);
          } catch {
            // Keep the new cover even if the previous file is already missing.
          }
        }
      }

      if (payload.folder === "destinations" || payload.folder === "tours") {
        const { count } = await supabase
          .from("destination_images")
          .select("*", { count: "exact", head: true })
          .eq("destination_id", payload.destinationId);

        const targetSortOrder = payload.sortOrder ?? (count ?? 0);

        if ((count ?? 0) >= 5 && payload.sortOrder == null) {
          return NextResponse.json(
            { error: "Gallery image limit reached. You can upload up to 5 images only." },
            { status: 400 }
          );
        }

        const { data: existingImageAtSlot, error: existingImageLookupError } = await supabase
          .from("destination_images")
          .select("id")
          .eq("destination_id", payload.destinationId)
          .eq("sort_order", targetSortOrder)
          .maybeSingle();

        if (existingImageLookupError) {
          throw new Error(existingImageLookupError.message);
        }

        if (existingImageAtSlot) {
          return NextResponse.json(
            { error: "This gallery slot is already in use. Replace or delete the existing image first." },
            { status: 400 }
          );
        }

        const { error } = await supabase.from("destination_images").insert({
          destination_id: payload.destinationId,
          storage_path: upload.path,
          image_url: upload.publicUrl,
          alt_text: payload.altText ?? null,
          sort_order: targetSortOrder
        });

        if (error) {
          throw new Error(error.message);
        }
      }
    }

    return NextResponse.json({
      path: upload.path,
      publicUrl: upload.publicUrl
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to upload file."
      },
      { status: 400 }
    );
  }
}
