import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { markFinancialRecordBookingDeleted } from "@/lib/financial-records";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: NextRequest,
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

    const currentUser = await getCurrentUserContext();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();

    const { data: touristUser, error: touristLookupError } = await supabase
      .from("users")
      .select("id, role, archived_at")
      .eq("id", id)
      .maybeSingle();

    if (touristLookupError) {
      throw new Error(touristLookupError.message);
    }

    if (!touristUser || touristUser.role !== "user") {
      return NextResponse.json({ error: "Tourist account not found." }, { status: 404 });
    }

    if (!touristUser.archived_at) {
      return NextResponse.json(
        { error: "Archive this tourist account first before permanently deleting it." },
        { status: 400 }
      );
    }

    // Preserve financial/revenue history: mark every financial record tied to
    // this tourist's bookings as "booking deleted" before the cascade removes
    // the underlying booking rows. financial_records has no FK to bookings or
    // users, so these rows survive the delete below and keep revenue totals intact.
    const { data: touristBookings, error: bookingsLookupError } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_id", id);

    if (bookingsLookupError) {
      throw new Error(bookingsLookupError.message);
    }

    for (const booking of touristBookings ?? []) {
      await markFinancialRecordBookingDeleted(booking.id as string);
    }

    // Deleting the auth user cascades: public.users -> bookings -> payments,
    // onsite_receipts, booking_guest_visits, booking_slot_locks. This also
    // frees the email address for a fresh sign-up.
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);

    if (authDeleteError) {
      throw new Error(authDeleteError.message);
    }

    return NextResponse.json({ message: "Tourist account permanently deleted." });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to permanently delete tourist account."
      },
      { status: 400 }
    );
  }
}