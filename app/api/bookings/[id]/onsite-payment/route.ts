import { NextResponse } from "next/server";

import { canRecordOnsitePayment } from "@/lib/booking-state";
import { createOnsiteFinancialRecord } from "@/lib/financial-records";
import { requireRole } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { recordOnsitePaymentSchema } from "@/lib/schemas";
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
    const payload = recordOnsitePaymentSchema.parse({
      ...(await request.json()),
      bookingId: id
    });
    const supabase = createAdminSupabaseClient();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, staff_id, status, payment_mode, total_amount")
      .eq("id", id)
      .maybeSingle();

    if (bookingError) throw new Error(bookingError.message);
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.staff_id !== staffContext.authUserId) {
      return NextResponse.json({ error: "You do not have access to this booking." }, { status: 403 });
    }
    if (booking.payment_mode !== "onsite" || !canRecordOnsitePayment(booking.status)) {
      return NextResponse.json({ error: "Only onsite bookings awaiting payment can be settled." }, { status: 400 });
    }
    if (payload.amount !== booking.total_amount) {
      return NextResponse.json({ error: "Amount received must match the booking total." }, { status: 400 });
    }

    const { data: receipt, error: receiptError } = await supabase
      .from("onsite_receipts")
      .select("id, receipt_code, recorded_at")
      .eq("booking_id", id)
      .maybeSingle();
    if (receiptError) throw new Error(receiptError.message);
    if (!receipt) return NextResponse.json({ error: "The onsite receipt could not be found." }, { status: 409 });
    if (receipt.receipt_code !== payload.receiptCode) {
      return NextResponse.json({ error: "Receipt code does not match this booking." }, { status: 400 });
    }
    if (receipt.recorded_at) {
      return NextResponse.json({ error: "This onsite payment has already been recorded." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { data: claimedReceipt, error: claimError } = await supabase
      .from("onsite_receipts")
      .update({
        recorded_by_staff_id: staffContext.authUserId,
        recorded_at: now,
        amount_recorded: payload.amount,
        payment_method: "cash",
        notes: payload.notes || null
      })
      .eq("id", receipt.id)
      .is("recorded_at", null)
      .select("id")
      .maybeSingle();
    if (claimError) throw new Error(claimError.message);
    if (!claimedReceipt) return NextResponse.json({ error: "This payment is already being recorded." }, { status: 409 });

    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({ status: "completed", completed_at: now })
      .eq("id", id)
      .eq("status", "awaiting_onsite_payment")
      .select("id")
      .maybeSingle();
    if (updateError || !updatedBooking) {
      await supabase
        .from("onsite_receipts")
        .update({ recorded_by_staff_id: null, recorded_at: null, amount_recorded: null, notes: null })
        .eq("id", receipt.id)
        .eq("recorded_by_staff_id", staffContext.authUserId);
      if (updateError) throw new Error(updateError.message);
      return NextResponse.json({ error: "Booking status changed; payment was not recorded." }, { status: 409 });
    }

    try {
      await createOnsiteFinancialRecord({
        bookingId: id,
        amount: payload.amount,
        receiptCode: payload.receiptCode,
        notes: payload.notes
      });
    } catch (financialError) {
      await supabase
        .from("bookings")
        .update({ status: "awaiting_onsite_payment", completed_at: null })
        .eq("id", id)
        .eq("status", "completed");
      await supabase
        .from("onsite_receipts")
        .update({ recorded_by_staff_id: null, recorded_at: null, amount_recorded: null, notes: null })
        .eq("id", receipt.id)
        .eq("recorded_by_staff_id", staffContext.authUserId);
      throw financialError;
    }

    return NextResponse.json({ message: "Onsite cash payment recorded.", status: "completed" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record onsite payment." },
      { status: 400 }
    );
  }
}
