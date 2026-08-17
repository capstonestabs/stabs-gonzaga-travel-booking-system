import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserContext } from "@/lib/auth";
import { getBookingGuestTickets } from "@/lib/guest-tickets";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Booking } from "@/lib/types";

const visitActionSchema = z.object({ action: z.enum(["check_in", "check_out"]) });

function getPhilippineDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; guestNumber: string }> }
) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role credentials are missing." }, { status: 503 });
    }

    const user = await getCurrentUserContext();
    if (!user || user.role !== "staff") {
      return NextResponse.json({ error: "Assigned staff access is required." }, { status: 403 });
    }

    const { id, guestNumber: guestNumberText } = await context.params;
    const guestNumber = Number(guestNumberText);
    const { action } = visitActionSchema.parse(await request.json());
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();

    if (error) throw new Error(error.message);
    if (!data || data.staff_id !== user.authUserId) {
      return NextResponse.json({ error: "Booking not found for your destination." }, { status: 404 });
    }

    const booking = data as Booking;
    if (!getBookingGuestTickets(booking).some((guest) => guest.guestNumber === guestNumber)) {
      return NextResponse.json({ error: "Guest pass not found." }, { status: 404 });
    }
    if (!Number.isInteger(guestNumber) || guestNumber < 1 || guestNumber > booking.guest_count) {
      return NextResponse.json({ error: "Invalid guest number." }, { status: 400 });
    }
    if (booking.status !== "confirmed" && booking.status !== "completed") {
      return NextResponse.json({ error: "Only confirmed bookings can be checked in." }, { status: 400 });
    }
    if (booking.service_date !== getPhilippineDate()) {
      return NextResponse.json({ error: "Guest visits can only be recorded on the scheduled date." }, { status: 400 });
    }

    const { data: existing, error: visitError } = await supabase
      .from("booking_guest_visits")
      .select("*")
      .eq("booking_id", booking.id)
      .eq("guest_number", guestNumber)
      .maybeSingle();
    if (visitError) throw new Error(visitError.message);

    const now = new Date().toISOString();
    if (action === "check_in") {
      if (existing?.checked_in_at) {
        return NextResponse.json({ error: "This guest is already checked in." }, { status: 409 });
      }
      const { error: upsertError } = await supabase.from("booking_guest_visits").upsert({
        booking_id: booking.id,
        guest_number: guestNumber,
        checked_in_at: now,
        checked_in_by: user.authUserId
      }, { onConflict: "booking_id,guest_number" });
      if (upsertError) throw new Error(upsertError.message);
    } else {
      if (!existing?.checked_in_at) {
        return NextResponse.json({ error: "Check this guest in before checking them out." }, { status: 409 });
      }
      if (existing.checked_out_at) {
        return NextResponse.json({ error: "This guest is already checked out." }, { status: 409 });
      }
      const { error: updateError } = await supabase.from("booking_guest_visits").update({
        checked_out_at: now,
        checked_out_by: user.authUserId
      }).eq("id", existing.id);
      if (updateError) throw new Error(updateError.message);

      const { count, error: countError } = await supabase
        .from("booking_guest_visits")
        .select("id", { count: "exact", head: true })
        .eq("booking_id", booking.id)
        .not("checked_out_at", "is", null);
      if (countError) throw new Error(countError.message);
      if ((count ?? 0) >= booking.guest_count) {
        const { error: bookingUpdateError } = await supabase.from("bookings").update({
          status: "completed",
          completed_at: now
        }).eq("id", booking.id);
        if (bookingUpdateError) throw new Error(bookingUpdateError.message);
      }
    }

    const { data: visit } = await supabase.from("booking_guest_visits").select("*")
      .eq("booking_id", booking.id).eq("guest_number", guestNumber).single();
    return NextResponse.json({ message: action === "check_in" ? "Guest checked in." : "Guest checked out.", visit });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to record guest visit." }, { status: 400 });
  }
}
