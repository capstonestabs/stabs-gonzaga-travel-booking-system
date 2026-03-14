import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { isBookingDateInPast } from "@/lib/booking-state";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ensureBookingTicketCode } from "@/lib/tickets";

export async function POST(
  _request: Request,
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

    const user = await getCurrentUserContext();
    if (!user || user.role !== "staff") {
      return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, staff_id, status, ticket_code, service_date")
      .eq("id", id)
      .maybeSingle();

    if (bookingError) {
      throw new Error(bookingError.message);
    }

    if (!booking || booking.staff_id !== user.authUserId) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.status !== "confirmed") {
      return NextResponse.json(
        { error: "Only confirmed bookings can be marked as completed." },
        { status: 400 }
      );
    }

    if (isBookingDateInPast(booking.service_date)) {
      return NextResponse.json(
        { error: "This booking date already passed. The pass is now expired and can no longer be completed." },
        { status: 400 }
      );
    }

    const ticketCode = await ensureBookingTicketCode(booking.id, booking.ticket_code);
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        ticket_code: ticketCode
      })
      .eq("id", booking.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ message: "Booking marked as completed." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to complete booking."
      },
      { status: 400 }
    );
  }
}
