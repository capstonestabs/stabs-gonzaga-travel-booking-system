import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { isBookingTicketExpired } from "@/lib/booking-state";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { markFinancialRecordBookingDeleted } from "@/lib/financial-records";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE(
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

    const supabase = createAdminSupabaseClient();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, staff_id, status, service_date, completed_at")
      .eq("id", id)
      .maybeSingle();

    if (bookingError) {
      throw new Error(bookingError.message);
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const hasAccess =
      user.role === "admin" ||
      (user.role === "user" && booking.user_id === user.authUserId) ||
      (user.role === "staff" && booking.staff_id === user.authUserId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You do not have access to this booking." },
        { status: 403 }
      );
    }

    const isOwnerUser = user.role === "user" && booking.user_id === user.authUserId;
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("status")
      .eq("booking_id", booking.id)
      .maybeSingle();

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    const isExpiredPass = isBookingTicketExpired({
      status: booking.status,
      service_date: booking.service_date,
      completed_at: booking.completed_at
    });

    if (isOwnerUser) {
      const canDeleteUserHistory =
        booking.status === "cancelled" ||
        booking.status === "completed" ||
        payment?.status === "expired" ||
        isExpiredPass;

      if (!canDeleteUserHistory) {
        return NextResponse.json(
          {
            error:
              "You can clear booking history only after the reservation is cancelled, completed, or expired."
          },
          { status: 400 }
        );
      }
    } else if (booking.status !== "completed" && booking.status !== "cancelled") {
      return NextResponse.json(
        { error: "Only completed or cancelled bookings can be deleted." },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase.from("bookings").delete().eq("id", booking.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (booking.status === "completed") {
      await markFinancialRecordBookingDeleted(booking.id);
    }

    return NextResponse.json({ message: "Booking deleted." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete booking."
      },
      { status: 400 }
    );
  }
}
