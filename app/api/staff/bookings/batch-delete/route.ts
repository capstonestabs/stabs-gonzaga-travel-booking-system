import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { markFinancialRecordBookingDeleted } from "@/lib/financial-records";
import { batchStaffBookingActionSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const user = await getCurrentUserContext();
    if (!user || user.role !== "staff") {
      return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    }

    const payload = batchStaffBookingActionSchema.parse(await request.json());
    const supabase = createAdminSupabaseClient();
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, staff_id, status")
      .in("id", payload.bookingIds);

    if (bookingsError) {
      throw new Error(bookingsError.message);
    }

    const ownedBookings = (bookings ?? []).filter((booking) => booking.staff_id === user.authUserId);

    if (ownedBookings.length !== payload.bookingIds.length) {
      return NextResponse.json(
        { error: "One or more selected bookings are unavailable." },
        { status: 404 }
      );
    }

    const invalidBookings = ownedBookings.filter((booking) => {
      if (booking.status === "cancelled") {
        return false;
      }

      return booking.status !== "completed";
    });

    if (invalidBookings.length > 0) {
      return NextResponse.json(
        {
          error:
            invalidBookings.length === 1
              ? "Only cancelled bookings or completed bookings can be deleted."
              : "Some selected bookings cannot be deleted yet. Only cancelled or completed bookings can be removed."
        },
        { status: 400 }
      );
    }

    const deletableIds = ownedBookings.map((booking) => booking.id);
    const { error: deleteError } = await supabase.from("bookings").delete().in("id", deletableIds);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await Promise.all(
      ownedBookings
        .filter((booking) => booking.status === "completed")
        .map((booking) => markFinancialRecordBookingDeleted(booking.id))
    );

    return NextResponse.json({
      message: `${deletableIds.length} booking${deletableIds.length === 1 ? "" : "s"} deleted.`
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete the selected bookings."
      },
      { status: 400 }
    );
  }
}
