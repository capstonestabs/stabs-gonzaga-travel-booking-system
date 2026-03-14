import {
  finalizePaidBookingCapacity,
  getServiceAvailabilitySnapshot,
  releaseBookingSlotLock
} from "@/lib/availability";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { upsertFinancialRecordForBooking } from "@/lib/financial-records";
import { ensureBookingTicketCode } from "@/lib/tickets";
import type { PaymentStatus } from "@/lib/types";

export async function applyPaymentStateUpdate(input: {
  bookingId: string;
  paymentStatus: PaymentStatus;
  paymentId?: string | null;
  checkoutSessionId?: string | null;
  paymongoPaymentId?: string | null;
  paymongoEventId?: string | null;
  paymentMethodType?: string | null;
  rawPayload?: Record<string, unknown> | null;
  livemode?: boolean;
  paidAt?: string | null;
}) {
  if (!hasSupabaseServiceEnv()) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { data: existingBooking, error: existingBookingError } = await supabase
    .from("bookings")
    .select("id, status, ticket_code, confirmed_at, service_id, service_date, guest_count")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (existingBookingError) {
    throw new Error(existingBookingError.message);
  }

  if (!existingBooking) {
    return;
  }

  if (
    (existingBooking.status === "confirmed" || existingBooking.status === "completed") &&
    input.paymentStatus !== "paid"
  ) {
    return;
  }

  if (existingBooking.status === "cancelled" && input.paymentStatus !== "paid") {
    return;
  }

  let finalPaymentStatus = input.paymentStatus;
  let finalBookingStatus: typeof existingBooking.status =
    finalPaymentStatus === "paid"
      ? "confirmed"
      : finalPaymentStatus === "pending"
        ? "pending_payment"
        : "cancelled";

  if (finalPaymentStatus === "paid") {
    try {
      if (existingBooking.status === "cancelled") {
        if (!existingBooking.service_id) {
          throw new Error("Missing service reference for this booking.");
        }

        const snapshot = await getServiceAvailabilitySnapshot(
          existingBooking.service_id,
          existingBooking.service_date
        );

        if (!snapshot?.is_open || snapshot.remaining_guests < existingBooking.guest_count) {
          throw new Error("The slot hold expired and the date is no longer available.");
        }
      } else {
        await finalizePaidBookingCapacity(input.bookingId);
      }
    } catch (capacityError) {
      finalPaymentStatus = "failed";
      finalBookingStatus = "cancelled";
    }
  }

  const ticketCode =
    finalBookingStatus === "confirmed" ? await ensureBookingTicketCode(input.bookingId) : null;

  const paymentUpdate = {
    status: finalPaymentStatus,
    paymongo_checkout_session_id: input.checkoutSessionId ?? undefined,
    paymongo_payment_id: input.paymongoPaymentId ?? undefined,
    paymongo_event_id: input.paymongoEventId ?? undefined,
    payment_method_type: input.paymentMethodType ?? undefined,
    raw_payload: input.rawPayload ?? undefined,
    livemode: input.livemode ?? false,
    paid_at: finalPaymentStatus === "paid" ? input.paidAt ?? new Date().toISOString() : null
  };

  const bookingUpdate =
    finalBookingStatus === "confirmed"
      ? {
          status: finalBookingStatus,
          ticket_code: ticketCode,
          confirmed_at: input.paidAt ?? new Date().toISOString(),
          completed_at: null,
          cancelled_at: null
        }
      : finalBookingStatus === "pending_payment"
        ? { status: finalBookingStatus }
        : {
            status: finalBookingStatus,
            ticket_code: null,
            confirmed_at: null,
            completed_at: null,
            cancelled_at: new Date().toISOString()
          };

  if (input.paymentId) {
    const { error } = await supabase
      .from("payments")
      .update(paymentUpdate)
      .eq("id", input.paymentId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("payments")
      .update(paymentUpdate)
      .eq("booking_id", input.bookingId);

    if (error) {
      throw new Error(error.message);
    }
  }

  const { error: bookingError } = await supabase
    .from("bookings")
    .update(bookingUpdate)
    .eq("id", input.bookingId);

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  if (finalBookingStatus === "confirmed") {
    await upsertFinancialRecordForBooking(input.bookingId);
  } else if (finalBookingStatus !== "pending_payment") {
    await releaseBookingSlotLock(input.bookingId);
  }
}
