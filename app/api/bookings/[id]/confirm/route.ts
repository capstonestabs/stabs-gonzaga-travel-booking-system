import { NextResponse } from "next/server";

import { canConfirmBooking } from "@/lib/booking-state";
import { createBookingCheckoutSession } from "@/lib/booking-checkout";
import { attachCheckoutSessionToSlotLock, releaseBookingSlotLock } from "@/lib/availability";
import { sendBookingConfirmedEmail } from "@/lib/booking-receipt-email";
import { requireRole } from "@/lib/auth";
import { hasPayMongoEnv, hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function createReceiptCode() {
  return `ST-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

export async function POST(
  _request: Request,
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
      .select("*, onsite_receipt:onsite_receipts(*), payment:payments(*)")
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

    if (!canConfirmBooking(booking.status)) {
      return NextResponse.json(
        { error: "Only awaiting bookings can be confirmed." },
        { status: 400 }
      );
    }

    const paymentMode = booking.payment_mode ?? "online";
    const now = new Date().toISOString();

    if (paymentMode === "onsite") {
      let receipt = Array.isArray(booking.onsite_receipt)
        ? booking.onsite_receipt[0]
        : booking.onsite_receipt;

      if (!receipt) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const { data: createdReceipt, error: receiptError } = await supabase
            .from("onsite_receipts")
            .insert({ booking_id: id, receipt_code: createReceiptCode() })
            .select("*")
            .single();
          if (!receiptError) {
            receipt = createdReceipt;
            break;
          }
        }
        if (!receipt) throw new Error("Unable to issue the onsite receipt.");
      }

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "awaiting_onsite_payment", confirmed_at: now })
        .eq("id", id)
        .in("status", ["awaiting_confirmation", "pending_payment"]);
      if (updateError) throw new Error(updateError.message);
      await releaseBookingSlotLock(id);

      let emailError: unknown = null;
      try {
        await sendBookingConfirmedEmail(id);
      } catch (emailError) {
        console.error("Unable to send booking confirmation email", emailError);
      }

      return NextResponse.json({
        message: "Reservation confirmed.",
        status: "awaiting_onsite_payment",
        receiptCode: receipt.receipt_code,
        email: { sent: false, reason: emailError instanceof Error ? emailError.message : "Unknown email error" }
      });
    }

    if (!hasPayMongoEnv()) {
      return NextResponse.json({ error: "Online payment is temporarily unavailable." }, { status: 503 });
    }

    const existingPayment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment;
    let payment = existingPayment;
    if (!payment?.checkout_url) {
      const session = await createBookingCheckoutSession(booking);
      const { data: createdPayment, error: paymentError } = await supabase
        .from("payments")
        .upsert({
          booking_id: id,
          paymongo_checkout_session_id: session.id,
          checkout_url: session.attributes.checkout_url,
          status: "pending",
          amount: booking.total_amount,
          currency: "PHP",
          livemode: false
        }, { onConflict: "booking_id" })
        .select("*")
        .single();
      if (paymentError || !createdPayment) {
        throw new Error(paymentError?.message ?? "Unable to create payment record.");
      }
      payment = createdPayment;
      await attachCheckoutSessionToSlotLock(id, session.id);
    }

    await supabase
      .from("booking_slot_locks")
      .update({ expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
      .eq("booking_id", id);

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "pending_payment",
        confirmed_at: now
      })
      .eq("id", id)
      .in("status", ["awaiting_confirmation", "pending_payment"]);

    if (updateError) {
      throw new Error(updateError.message);
    }

    let emailError: unknown = null;
    try {
      await sendBookingConfirmedEmail(id);
    } catch (emailError) {
      console.error("Unable to send booking confirmation email", emailError);
    }

    return NextResponse.json({
      message: "Reservation confirmed.",
      status: "pending_payment",
      checkoutUrl: payment.checkout_url,
      email: { sent: false, reason: emailError instanceof Error ? emailError.message : "Unknown email error" }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to confirm the reservation." },
      { status: 400 }
    );
  }
}