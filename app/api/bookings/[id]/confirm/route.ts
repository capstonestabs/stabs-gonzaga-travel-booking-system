import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ensureBookingTicketCode } from "@/lib/tickets";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!hasSupabaseServiceEnv()) {
    return NextResponse.json(
      { error: "Supabase service role credentials are missing." },
      { status: 503 }
    );
  }

  try {
    const staffContext = await requireRole(["staff"]);
    const supabase = createAdminSupabaseClient();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (bookingError) {
      throw new Error(bookingError.message);
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.staff_id !== staffContext.authUserId) {
      return NextResponse.json({ error: "You do not have access to this booking." }, { status: 403 });
    }

    if (booking.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Only pending bookings can be manually confirmed." },
        { status: 400 }
      );
    }

    const ticketCode = await ensureBookingTicketCode(booking.id, booking.ticket_code);

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        ticket_code: ticketCode
      })
      .eq("id", id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ message: "Reservation confirmed." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to confirm the reservation." },
      { status: 400 }
    );
  }
}