import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { isBookingTicketExpired } from "@/lib/booking-state";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { markFinancialRecordBookingDeleted } from "@/lib/financial-records";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE() {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const user = await getCurrentUserContext();
    if (!user || user.role !== "user") {
      return NextResponse.json({ error: "Tourist access required." }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, status, service_date, completed_at, payment:payments(status)")
      .eq("user_id", user.authUserId);

    if (bookingsError) {
      throw new Error(bookingsError.message);
    }

    const deletableBookings = (bookings ?? []).filter((booking) => {
      const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment;
      const isExpiredPass = isBookingTicketExpired({
        status: booking.status,
        service_date: booking.service_date,
        completed_at: booking.completed_at
      });

      return (
        booking.status === "cancelled" ||
        booking.status === "completed" ||
        payment?.status === "expired" ||
        isExpiredPass
      );
    });

    if (!deletableBookings.length) {
      return NextResponse.json(
        { error: "There is no completed, cancelled, or expired history to clear." },
        { status: 400 }
      );
    }

    const deletableIds = deletableBookings.map((booking) => booking.id as string);
    const { error: deleteError } = await supabase.from("bookings").delete().in("id", deletableIds);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await Promise.all(
      deletableBookings
        .filter((booking) => booking.status === "completed")
        .map((booking) => markFinancialRecordBookingDeleted(booking.id as string))
    );

    return NextResponse.json({
      message: `${deletableIds.length} history record${deletableIds.length === 1 ? "" : "s"} cleared.`
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to clear booking history."
      },
      { status: 400 }
    );
  }
}
