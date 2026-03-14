import { NextRequest, NextResponse } from "next/server";

import { releaseExpiredSlotLocks } from "@/lib/availability";
import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { removePublicAsset } from "@/lib/storage";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    await releaseExpiredSlotLocks();

    const currentUser = await getCurrentUserContext();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: staffUser, error: staffLookupError } = await supabase
      .from("users")
      .select("id, role, avatar_path, archived_at")
      .eq("id", id)
      .maybeSingle();

    if (staffLookupError) {
      throw new Error(staffLookupError.message);
    }

    if (!staffUser || staffUser.role !== "staff") {
      return NextResponse.json({ error: "Staff user not found." }, { status: 404 });
    }

    if (staffUser.archived_at) {
      return NextResponse.json({ message: "Staff account already archived." });
    }

    const { data: destination, error: destinationError } = await supabase
      .from("destinations")
      .select("id, cover_path")
      .eq("staff_id", id)
      .maybeSingle();

    if (destinationError) {
      throw new Error(destinationError.message);
    }

    const today = new Date().toISOString().slice(0, 10);
    if (destination?.id) {
      const now = new Date().toISOString();
      const [{ count: activeLocksCount, error: activeLocksError }, { count: upcomingBookingsCount, error: upcomingBookingsError }] =
        await Promise.all([
          supabase
            .from("booking_slot_locks")
            .select("*", { count: "exact", head: true })
            .eq("destination_id", destination.id)
            .gte("service_date", today)
            .gt("expires_at", now),
          supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("destination_id", destination.id)
            .eq("status", "confirmed")
            .gte("service_date", today)
        ]);

      if (activeLocksError || upcomingBookingsError) {
        throw new Error(activeLocksError?.message ?? upcomingBookingsError?.message ?? "Unable to check archive status.");
      }

      if ((activeLocksCount ?? 0) > 0 || (upcomingBookingsCount ?? 0) > 0) {
        return NextResponse.json(
          {
            error: "Archive is blocked while this destination still has active slot holds or future confirmed bookings."
          },
          { status: 400 }
        );
      }
    }

    const pathsToRemove = [staffUser.avatar_path].filter((value): value is string => Boolean(value));

    if (destination?.id) {
      const { data: galleryImages, error: galleryError } = await supabase
        .from("destination_images")
        .select("storage_path")
        .eq("destination_id", destination.id);

      if (galleryError) {
        throw new Error(galleryError.message);
      }

      pathsToRemove.push(
        ...[destination.cover_path, ...(galleryImages ?? []).map((image) => image.storage_path)].filter(
          (value): value is string => Boolean(value)
        )
      );

      const { error: imageDeleteError } = await supabase
        .from("destination_images")
        .delete()
        .eq("destination_id", destination.id);

      if (imageDeleteError) {
        throw new Error(imageDeleteError.message);
      }

      const { error: destinationUpdateError } = await supabase
        .from("destinations")
        .update({
          status: "archived",
          cover_path: null,
          cover_url: null
        })
        .eq("id", destination.id);

      if (destinationUpdateError) {
        throw new Error(destinationUpdateError.message);
      }
    }

    for (const path of pathsToRemove) {
      try {
        await removePublicAsset(path);
      } catch {
        // Continue archiving account records even if a storage object is already missing.
      }
    }

    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        avatar_url: null,
        avatar_path: null,
        archived_at: new Date().toISOString()
      })
      .eq("id", id);

    if (userUpdateError) {
      throw new Error(userUpdateError.message);
    }

    return NextResponse.json({ message: "Staff account archived." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to archive staff account."
      },
      { status: 400 }
    );
  }
}
