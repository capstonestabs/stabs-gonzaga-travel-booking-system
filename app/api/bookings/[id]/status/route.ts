import { NextResponse } from "next/server";

import { releaseExpiredSlotLocks } from "@/lib/availability";
import { getCurrentUserContext } from "@/lib/auth";
import { applyPaymentStateUpdate } from "@/lib/payment-sync";
import { resolveCheckoutSessionPayment, retrieveCheckoutSession } from "@/lib/paymongo";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ensureBookingTicketCode } from "@/lib/tickets";
import { hasPayMongoEnv, hasSupabaseServiceEnv } from "@/lib/env";
import { verifyBookingReturnToken } from "@/lib/booking-return-token";

export async function GET(
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
    await releaseExpiredSlotLocks();

    const currentUser = await getCurrentUserContext();
    const accessToken = new URL(request.url).searchParams.get("access");
    const hasReturnAccess = verifyBookingReturnToken(id, accessToken);

    if (!currentUser && !hasReturnAccess) {
      return NextResponse.json({ error: "Please sign in to view booking status." }, { status: 401 });
    }

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

    if (
      !hasReturnAccess &&
      currentUser &&
      ((currentUser.role === "user" && booking.user_id !== currentUser.authUserId) ||
        (currentUser.role === "staff" && booking.staff_id !== currentUser.authUserId))
    ) {
      return NextResponse.json({ error: "You do not have access to this booking." }, { status: 403 });
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", booking.id)
      .maybeSingle();

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    let nextPayment = payment;
    let nextBooking = booking;

    if (
      payment?.status !== "paid" &&
      payment?.paymongo_checkout_session_id &&
      hasPayMongoEnv()
    ) {
      const session = await retrieveCheckoutSession(payment.paymongo_checkout_session_id);
      const resolvedSession = resolveCheckoutSessionPayment(session);
      const sessionPayment = resolvedSession.payment;
      const paymentStatus = resolvedSession.paymentStatus;
      const canPromoteCancelledBooking = booking.status === "cancelled" && paymentStatus === "paid";

      const shouldRefresh =
        canPromoteCancelledBooking ||
        (paymentStatus !== payment.status && booking.status !== "cancelled");

      if (shouldRefresh) {
        await applyPaymentStateUpdate({
          bookingId: booking.id,
          paymentId: payment.id,
          paymentStatus,
          checkoutSessionId: payment.paymongo_checkout_session_id,
          paymongoPaymentId: sessionPayment?.id ?? null,
          paymentMethodType: sessionPayment?.attributes.source?.type ?? null,
          paidAt: sessionPayment?.attributes.paid_at
            ? new Date(sessionPayment.attributes.paid_at * 1000).toISOString()
            : null
        });

        nextPayment = {
          ...payment,
          status:
            booking.status === "cancelled" && paymentStatus !== "paid"
              ? payment.status
              : paymentStatus,
          paymongo_payment_id: sessionPayment?.id ?? payment.paymongo_payment_id,
          payment_method_type:
            sessionPayment?.attributes.source?.type ?? payment.payment_method_type
        };
        nextBooking = {
          ...booking,
          status:
            paymentStatus === "paid"
              ? "confirmed"
              : booking.status === "cancelled"
                ? "cancelled"
                : paymentStatus === "pending"
                  ? "pending_payment"
                  : "cancelled",
          ticket_code:
            paymentStatus === "paid"
              ? await ensureBookingTicketCode(booking.id, booking.ticket_code)
              : booking.ticket_code
        };
      }
    }

    if (
      (nextBooking.status === "confirmed" || nextBooking.status === "completed") &&
      !nextBooking.ticket_code
    ) {
      nextBooking = {
        ...nextBooking,
        ticket_code: await ensureBookingTicketCode(nextBooking.id, nextBooking.ticket_code)
      };
    }

    return NextResponse.json({
      bookingStatus: nextBooking.status,
      paymentStatus: nextPayment?.status ?? "pending",
      checkoutUrl: nextPayment?.checkout_url ?? null,
      amount: nextPayment?.amount ?? booking.total_amount,
      currency: nextPayment?.currency ?? booking.currency,
      destinationTitle: booking.destination_snapshot?.title ?? "Booking",
      serviceTitle: booking.service_snapshot?.title ?? null,
      ticketCode:
        nextBooking.status === "confirmed" || nextBooking.status === "completed"
          ? nextBooking.ticket_code ?? null
          : null
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to read booking status."
      },
      { status: 400 }
    );
  }
}
