import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { hasBookingEmailEnv } from "@/lib/env";
import { sendBookingConfirmedEmail, sendBookingDeclinedEmail } from "@/lib/booking-receipt-email";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!hasBookingEmailEnv()) {
    return NextResponse.json(
      { error: "Booking email is not configured on the server." },
      { status: 503 }
    );
  }

  try {
    const staffContext = await requireRole(["staff"]);
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

    if (booking.status === "declined") {
      await sendBookingDeclinedEmail(id);
      return NextResponse.json({ message: "Decline email resent." });
    }

    if (booking.status === "awaiting_onsite_payment" || booking.status === "pending_payment" || booking.status === "completed") {
      await sendBookingConfirmedEmail(id);
      return NextResponse.json({ message: "Confirmation email resent." });
    }

    return NextResponse.json(
      { error: "Only confirmed, pending, or declined bookings can receive a status email." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resend booking email." },
      { status: 400 }
    );
  }
}
