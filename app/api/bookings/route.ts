import { NextRequest, NextResponse } from "next/server";

import { attachCheckoutSessionToSlotLock, createBookingSlotLock, getServiceAvailabilitySnapshot } from "@/lib/availability";
import { getCurrentUserContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { bookingSchema } from "@/lib/schemas";
import { getDestinationById } from "@/lib/repositories";
import { createCheckoutSession } from "@/lib/paymongo";
import { createBookingReturnToken } from "@/lib/booking-return-token";
import { getSiteUrl, hasPayMongoEnv, hasSupabaseServiceEnv } from "@/lib/env";
import { pesoAmountToCentavos } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const payload = bookingSchema.parse(await request.json());

    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const destination = await getDestinationById(payload.destinationId);

    if (!destination || destination.status !== "published") {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }

    if (user.role !== "user") {
      return NextResponse.json(
        { error: "Only tourist accounts can create bookings." },
        { status: 403 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const serviceDate = new Date(`${payload.serviceDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(serviceDate.getTime())) {
      return NextResponse.json({ error: "Choose a valid service date." }, { status: 400 });
    }

    if (serviceDate < today) {
      return NextResponse.json(
        { error: "Service date cannot be in the past." },
        { status: 400 }
      );
    }

    const service = destination.destination_services?.find(
      (s) => s.id === payload.serviceId
    );

    if (!service || !service.is_active) {
      return NextResponse.json(
        { error: "The selected service package is no longer available." },
        { status: 400 }
      );
    }

    if (service.availability_start_date && payload.serviceDate < service.availability_start_date) {
      return NextResponse.json(
        { error: `This service opens for booking on ${service.availability_start_date}.` },
        { status: 400 }
      );
    }

    if (service.availability_end_date && payload.serviceDate > service.availability_end_date) {
      return NextResponse.json(
        { error: `This service is only bookable until ${service.availability_end_date}.` },
        { status: 400 }
      );
    }

    if (payload.guestCount > service.daily_capacity) {
      return NextResponse.json(
        { error: `Maximum guests for this service is ${service.daily_capacity}.` },
        { status: 400 }
      );
    }

    // Empty filler chunk since we moved the service definition up

    const unitAmount = pesoAmountToCentavos(service.price_amount);
    const totalAmount =
      destination.category === "stay"
        ? unitAmount
        : unitAmount * payload.guestCount;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.authUserId,
        destination_id: destination.id,
        staff_id: destination.staff_id,
        status: "pending_payment",
        service_date: payload.serviceDate,
        guest_count: payload.guestCount,
        contact_name: payload.contactName,
        contact_email: payload.contactEmail,
        contact_phone: payload.contactPhone,
        notes: payload.notes || null,
        total_amount: totalAmount,
        currency: "PHP",
        service_id: service.id,
        service_snapshot: {
          id: service.id,
          title: service.title,
          description: service.description,
          price_amount: service.price_amount,
          service_type: service.service_type
        },
        destination_snapshot: {
          title: destination.title,
          category: destination.category,
          location_text: destination.location_text,
          summary: destination.summary
        }
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      throw new Error(bookingError?.message ?? "Unable to create booking.");
    }

    try {
      const liveAvailability = await getServiceAvailabilitySnapshot(service.id, payload.serviceDate);

      if (!liveAvailability?.is_open || liveAvailability.remaining_guests < payload.guestCount) {
        await supabase.from("bookings").delete().eq("id", booking.id);

        return NextResponse.json(
          { error: "The selected date no longer has enough slots available." },
          { status: 409 }
        );
      }

      await createBookingSlotLock({
        bookingId: booking.id,
        destinationId: destination.id,
        serviceId: service.id,
        userId: user.authUserId,
        serviceDate: payload.serviceDate,
        guestCount: payload.guestCount,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      });
    } catch (lockError) {
      await supabase.from("bookings").delete().eq("id", booking.id);
      throw lockError;
    }

    const returnToken = createBookingReturnToken(booking.id);
    let checkoutUrl = `${getSiteUrl()}/bookings/${booking.id}/status?access=${returnToken}`;
    let checkoutSessionId: string | null = null;

    try {
      if (hasPayMongoEnv()) {
        const session = await createCheckoutSession({
          bookingId: booking.id,
          title: destination.title,
          description: destination.summary,
          amount: totalAmount,
          customerName: payload.contactName,
          customerEmail: payload.contactEmail,
          customerPhone: payload.contactPhone
        });

        checkoutUrl = session.data.attributes.checkout_url;
        checkoutSessionId = session.data.id;
      }

      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          booking_id: booking.id,
          paymongo_checkout_session_id: checkoutSessionId,
          checkout_url: checkoutUrl,
          status: "pending",
          amount: totalAmount,
          currency: "PHP",
          livemode: false
        })
        .select("id")
        .single();

      if (paymentError || !payment) {
        throw new Error(paymentError?.message ?? "Unable to create payment record.");
      }

      await attachCheckoutSessionToSlotLock(booking.id, checkoutSessionId);

      return NextResponse.json({
        bookingId: booking.id,
        paymentId: payment.id,
        checkoutUrl
      });
    } catch (checkoutError) {
      await supabase.from("bookings").delete().eq("id", booking.id);
      throw checkoutError;
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create booking."
      },
      { status: 400 }
    );
  }
}
