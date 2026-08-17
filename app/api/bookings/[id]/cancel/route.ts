import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { releaseBookingSlotLock } from "@/lib/availability";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { issueRefund } from "@/lib/paymongo";
import { hasPayMongoEnv } from "@/lib/env";

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
      .select("id, user_id, status, service_date")
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

    if (booking.status !== "pending_payment" && booking.status !== "confirmed") {
      return NextResponse.json(
        { error: "Only pending or confirmed reservations can be cancelled." },
        { status: 400 }
      );
    }

    const isPaidCancellation = booking.status === "confirmed";
    let refundId: string | null = null;
    let refundStatus: string | null = null;

    if (isPaidCancellation) {
      if (!hasPayMongoEnv()) {
        return NextResponse.json({ error: "Online refunds are temporarily unavailable. Please contact the destination." }, { status: 503 });
      }

      const [{ data: payment, error: paymentLoadError }, { data: visitRows, error: visitsError }, { data: financialRecord, error: financialError }] = await Promise.all([
        supabase.from("payments").select("id, status, amount, paymongo_payment_id, paymongo_refund_id").eq("booking_id", booking.id).maybeSingle(),
        supabase.from("booking_guest_visits").select("id").eq("booking_id", booking.id).limit(1),
        supabase.from("financial_records").select("id, settlement_status").eq("booking_id", booking.id).maybeSingle()
      ]);

      if (paymentLoadError || visitsError || financialError) {
        throw new Error(paymentLoadError?.message ?? visitsError?.message ?? financialError?.message ?? "Unable to validate this refund.");
      }
      if (!payment || payment.status !== "paid" || !payment.paymongo_payment_id) {
        return NextResponse.json({ error: "The successful PayMongo payment could not be found." }, { status: 409 });
      }
      if ((visitRows ?? []).length > 0) {
        return NextResponse.json({ error: "A booking cannot be refunded after a guest has checked in." }, { status: 409 });
      }
      if (booking.service_date < getPhilippineDate()) {
        return NextResponse.json({ error: "A booking cannot be refunded after its scheduled date." }, { status: 409 });
      }
      if (financialRecord?.settlement_status === "settled") {
        return NextResponse.json({ error: "This payment was already paid out. Contact the destination to arrange cancellation." }, { status: 409 });
      }

      if (payment.paymongo_refund_id) {
        return NextResponse.json({ error: "A refund has already been requested for this booking." }, { status: 409 });
      }

      const { data: claimedRefund, error: claimError } = await supabase.from("payments")
        .update({ refund_status: "creating" })
        .eq("id", payment.id)
        .is("paymongo_refund_id", null)
        .is("refund_status", null)
        .select("id")
        .maybeSingle();
      if (claimError) throw new Error(claimError.message);
      if (!claimedRefund) {
        return NextResponse.json({ error: "A refund is already being processed for this booking." }, { status: 409 });
      }

      let refund;
      try {
        refund = await issueRefund({
          paymentId: payment.paymongo_payment_id,
          amount: payment.amount,
          reason: "requested_by_customer",
          notes: `Tourist cancellation for STABS booking ${booking.id}`
        });
      } catch (refundError) {
        await supabase.from("payments").update({ refund_status: null }).eq("id", payment.id).eq("refund_status", "creating");
        throw refundError;
      }
      refundId = refund.data.id;
      refundStatus = refund.data.attributes.status;

      const requestedAt = new Date().toISOString();
      const { error: refundUpdateError } = await supabase.from("payments").update({
        paymongo_refund_id: refundId,
        refund_status: refundStatus,
        refund_amount: payment.amount,
        refund_reason: "requested_by_customer",
        refunded_at: requestedAt
      }).eq("id", payment.id);
      if (refundUpdateError) throw new Error(refundUpdateError.message);

      if (financialRecord) {
        const { error: financialUpdateError } = await supabase.from("financial_records").update({
          refunded_at: requestedAt,
          refund_amount: payment.amount,
          refund_reference: refundId,
          archived_at: requestedAt
        }).eq("id", financialRecord.id);
        if (financialUpdateError) throw new Error(financialUpdateError.message);
      }
    }

    const { error: paymentError } = isPaidCancellation
      ? { error: null }
      : await supabase.from("payments").update({ status: "cancelled", paid_at: null }).eq("booking_id", booking.id);

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

    return NextResponse.json({
      message: isPaidCancellation ? "Reservation cancelled and refund requested." : "Reservation cancelled.",
      refund: isPaidCancellation ? { id: refundId, status: refundStatus } : null
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to cancel the reservation."
      },
      { status: 400 }
    );
  }
}
