import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { isBookingDateInPast } from "@/lib/booking-state";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { batchStaffBookingActionSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ensureBookingTicketCode } from "@/lib/tickets";

export async function POST(request: Request) {
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
      .select("id, staff_id, status, ticket_code, service_date")
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

    const invalidBookings = ownedBookings.filter(
      (booking) => booking.status !== "confirmed" || isBookingDateInPast(booking.service_date)
    );

    if (invalidBookings.length > 0) {
      return NextResponse.json(
        {
          error:
            invalidBookings.length === 1
              ? "Only confirmed upcoming bookings can be marked as completed."
              : "Some selected bookings are no longer eligible to be marked as completed."
        },
        { status: 400 }
      );
    }

    const completedAt = new Date().toISOString();

    await Promise.all(
      ownedBookings.map(async (booking) => {
        const ticketCode = await ensureBookingTicketCode(booking.id, booking.ticket_code);
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            status: "completed",
            completed_at: completedAt,
            ticket_code: ticketCode
          })
          .eq("id", booking.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      })
    );

    return NextResponse.json({
      message: `${ownedBookings.length} booking${ownedBookings.length === 1 ? "" : "s"} marked as completed.`
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to complete the selected bookings."
      },
      { status: 400 }
    );
  }
}
