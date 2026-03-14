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
    const { data: touristUser, error: touristLookupError } = await supabase
      .from("users")
      .select("id, role, avatar_path, archived_at")
      .eq("id", id)
      .maybeSingle();

    if (touristLookupError) {
      throw new Error(touristLookupError.message);
    }

    if (!touristUser || touristUser.role !== "user") {
      return NextResponse.json({ error: "Tourist account not found." }, { status: 404 });
    }

    if (touristUser.archived_at) {
      return NextResponse.json({ message: "Tourist account already archived." });
    }

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const [
      { count: activeLocksCount, error: activeLocksError },
      { count: pendingBookingsCount, error: pendingBookingsError },
      { count: upcomingConfirmedCount, error: upcomingConfirmedError }
    ] = await Promise.all([
      supabase
        .from("booking_slot_locks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id)
        .gte("service_date", today)
        .gt("expires_at", now),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id)
        .eq("status", "pending_payment"),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id)
        .eq("status", "confirmed")
        .gte("service_date", today)
    ]);

    if (activeLocksError || pendingBookingsError || upcomingConfirmedError) {
      throw new Error(
        activeLocksError?.message ??
          pendingBookingsError?.message ??
          upcomingConfirmedError?.message ??
          "Unable to check tourist account archive status."
      );
    }

    if ((activeLocksCount ?? 0) > 0 || (pendingBookingsCount ?? 0) > 0 || (upcomingConfirmedCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Archive is blocked while this tourist account still has active slot holds, pending payment bookings, or future confirmed bookings."
        },
        { status: 400 }
      );
    }

    if (touristUser.avatar_path) {
      try {
        await removePublicAsset(touristUser.avatar_path);
      } catch {
        // Continue archiving even if the avatar file is already missing.
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

    return NextResponse.json({ message: "Tourist account archived." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to archive tourist account."
      },
      { status: 400 }
    );
  }
}
