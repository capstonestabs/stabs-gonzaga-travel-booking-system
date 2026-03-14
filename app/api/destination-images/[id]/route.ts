import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { removePublicAsset, uploadPublicAsset } from "@/lib/storage";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function getAuthorizedImage(imageId: string) {
  if (!hasSupabaseServiceEnv()) {
    return {
      error: NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      )
    };
  }

  const user = await getCurrentUserContext();
  if (!user) {
    return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  }

  if (user.role !== "staff" && user.role !== "admin") {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 403 }) };
  }

  const supabase = createAdminSupabaseClient();
  const { data: image, error: imageError } = await supabase
    .from("destination_images")
    .select("id, destination_id, storage_path, image_url, alt_text, sort_order")
    .eq("id", imageId)
    .maybeSingle();

  if (imageError) {
    throw new Error(imageError.message);
  }

  if (!image) {
    return { error: NextResponse.json({ error: "Gallery image not found." }, { status: 404 }) };
  }

  const { data: destination, error: destinationError } = await supabase
    .from("destinations")
    .select("id, staff_id")
    .eq("id", image.destination_id)
    .maybeSingle();

  if (destinationError) {
    throw new Error(destinationError.message);
  }

  if (!destination) {
    return { error: NextResponse.json({ error: "Destination not found." }, { status: 404 }) };
  }

  if (user.role !== "admin" && destination.staff_id !== user.authUserId) {
    return {
      error: NextResponse.json(
        { error: "You can manage gallery images only for your own destination." },
        { status: 403 }
      )
    };
  }

  return {
    user,
    supabase,
    image,
    destination
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authorized = await getAuthorizedImage(id);

    if ("error" in authorized) {
      return authorized.error;
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const hasAltText = formData.has("altText");
    const altTextValue = formData.get("altText");
    const altText =
      typeof altTextValue === "string" ? altTextValue.trim().slice(0, 180) : "";
    const sortOrderValue = formData.get("sortOrder");
    const parsedSortOrder =
      typeof sortOrderValue === "string" && sortOrderValue.length > 0
        ? Number(sortOrderValue)
        : null;
    const targetSortOrder =
      parsedSortOrder != null &&
      Number.isInteger(parsedSortOrder) &&
      parsedSortOrder >= 0 &&
      parsedSortOrder <= 4
        ? parsedSortOrder
        : null;

    const updates: {
      storage_path?: string;
      image_url?: string;
      alt_text?: string | null;
      sort_order?: number;
    } = {};

    if (hasAltText) {
      updates.alt_text = altText || null;
    }

    if (parsedSortOrder != null && targetSortOrder == null) {
      return NextResponse.json({ error: "Invalid gallery slot." }, { status: 400 });
    }

    let oldStoragePathToDelete: string | null = null;

    if (targetSortOrder != null && targetSortOrder !== authorized.image.sort_order) {
      const { data: conflictingImage, error: conflictingImageError } = await authorized.supabase
        .from("destination_images")
        .select("id, sort_order")
        .eq("destination_id", authorized.destination.id)
        .eq("sort_order", targetSortOrder)
        .neq("id", authorized.image.id)
        .maybeSingle();

      if (conflictingImageError) {
        throw new Error(conflictingImageError.message);
      }

      if (conflictingImage) {
        const { error: swapError } = await authorized.supabase
          .from("destination_images")
          .update({ sort_order: authorized.image.sort_order })
          .eq("id", conflictingImage.id);

        if (swapError) {
          throw new Error(swapError.message);
        }
      }

      updates.sort_order = targetSortOrder;
    }

    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
      }

      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json({ error: "File exceeds the 8MB limit." }, { status: 400 });
      }

      const folder =
        authorized.image.storage_path.startsWith("tours/") ? "tours" : "destinations";
      const upload = await uploadPublicAsset({
        folder,
        file,
        fileNamePrefix: authorized.destination.id
      });

      updates.storage_path = upload.path;
      updates.image_url = upload.publicUrl;
      oldStoragePathToDelete = authorized.image.storage_path;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ image: authorized.image });
    }

    const { data: updatedImage, error: updateError } = await authorized.supabase
      .from("destination_images")
      .update(updates)
      .eq("id", authorized.image.id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (oldStoragePathToDelete) {
      try {
        await removePublicAsset(oldStoragePathToDelete);
      } catch {
        // Keep the database update even if the old asset could not be removed.
      }
    }

    return NextResponse.json({ image: updatedImage });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update gallery image."
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authorized = await getAuthorizedImage(id);

    if ("error" in authorized) {
      return authorized.error;
    }

    const { error: deleteError } = await authorized.supabase
      .from("destination_images")
      .delete()
      .eq("id", authorized.image.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    try {
      await removePublicAsset(authorized.image.storage_path);
    } catch {
      // Keep the database delete even if the old asset could not be removed.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete gallery image."
      },
      { status: 400 }
    );
  }
}
