import { NextResponse } from "next/server";

import { canDeclineBooking } from "@/lib/booking-state";
import { releaseBookingSlotLock } from "@/lib/availability";
import { sendBookingDeclinedEmail } from "@/lib/booking-receipt-email";
import { requireRole } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { staffBookingActionSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!hasSupabaseServiceEnv()) {
    return NextResponse.json({ error: "Supabase service role credentials are missing." }, { status: 503 });
  }

  try {
    const staffContext = await requireRole(["staff"]);
    const body = staffBookingActionSchema.parse({
      ...(await request.json().catch(() => ({}))),
      bookingId: id,
      action: "decline"
    });
    const supabase = createAdminSupabaseClient();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, staff_id, status")
      .eq("id", id)
      .maybeSingle();

    if (bookingError) throw new Error(bookingError.message);
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.staff_id !== staffContext.authUserId) {
      return NextResponse.json({ error: "You do not have access to this booking." }, { status: 403 });
    }
    if (!canDeclineBooking(booking.status)) {
      return NextResponse.json({ error: "Only awaiting bookings can be declined." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "declined",
        decline_reason: body.declineReason || null,
        declined_at: new Date().toISOString(),
        declined_by: staffContext.authUserId,
        ticket_code: null,
        confirmed_at: null,
        completed_at: null,
        cancelled_at: null
      })
      .eq("id", id)
      .in("status", ["awaiting_confirmation", "pending_payment"]);

    if (updateError) throw new Error(updateError.message);
    await supabase.from("payments").update({ status: "cancelled", paid_at: null }).eq("booking_id", id);
    await releaseBookingSlotLock(id);

    let emailError: unknown = null;
    try {
      await sendBookingDeclinedEmail(id);
    } catch (emailError) {
      console.error("Unable to send booking decline email", emailError);
    }

    return NextResponse.json({
      message: "Reservation declined.",
      status: "declined",
      email: { sent: false, reason: emailError instanceof Error ? emailError.message : "Unknown email error" }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to decline the reservation." },
      { status: 400 }
    );
  }
}
