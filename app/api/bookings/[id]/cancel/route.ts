import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { releaseBookingSlotLock } from "@/lib/availability";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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
    if (!user) {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }

    if (user.role !== "user") {
      return NextResponse.json(
        { error: "Only tourist accounts can cancel reservations." },
        { status: 403 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, status")
      .eq("id", id)
      .maybeSingle();

    if (bookingError) {
      throw new Error(bookingError.message);
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.user_id !== user.authUserId) {
      return NextResponse.json(
        { error: "You do not have access to this booking." },
        { status: 403 }
      );
    }

    if (booking.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Only reservations that are still awaiting confirmation can be cancelled." },
        { status: 400 }
      );
    }

    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        status: "cancelled",
        paid_at: null
      })
      .eq("booking_id", booking.id);

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    const { error: bookingUpdateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        ticket_code: null,
        confirmed_at: null,
        completed_at: null,
        cancelled_at: new Date().toISOString()
      })
      .eq("id", booking.id);

    if (bookingUpdateError) {
      throw new Error(bookingUpdateError.message);
    }

    await releaseBookingSlotLock(booking.id);

    return NextResponse.json({ message: "Reservation cancelled." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to cancel the reservation."
      },
      { status: 400 }
    );
  }
}
