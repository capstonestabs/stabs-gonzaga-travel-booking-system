import { NextRequest, NextResponse } from "next/server";

import { hasSupabaseServiceEnv, hasPayMongoEnv } from "@/lib/env";
import { applyPaymentStateUpdate } from "@/lib/payment-sync";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapPayMongoStatus, resolveCheckoutSessionPayment, verifyWebhookSignature } from "@/lib/paymongo";

type EventPayload = {
  data?: {
    id?: string;
    attributes?: {
      type?: string;
      livemode?: boolean;
      data?: {
        id?: string;
        type?: string;
        attributes?: Record<string, any>;
      };
    };
  };
};

export async function POST(request: NextRequest) {
  const rawPayload = await request.text();
  const payload = JSON.parse(rawPayload) as EventPayload;
  const event = payload.data;
  const eventAttributes = event?.attributes;
  const resource = eventAttributes?.data;
  const resourceAttributes = resource?.attributes ?? {};
  const livemode = Boolean(eventAttributes?.livemode);

  if (hasPayMongoEnv()) {
    const isVerified = verifyWebhookSignature({
      header: request.headers.get("Paymongo-Signature"),
      payload: rawPayload,
      livemode
    });

    if (!isVerified) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }
  }

  if (!hasSupabaseServiceEnv()) {
    return NextResponse.json(
      { error: "Supabase service role credentials are missing." },
      { status: 503 }
    );
  }

  try {
    const supabase = createAdminSupabaseClient();
    const eventType = eventAttributes?.type ?? "";
    const checkoutSessionId =
      resource?.type === "checkout_session"
        ? resource.id ?? null
        : resourceAttributes.checkout_session_id ??
          resourceAttributes.checkout_session?.id ??
          null;

    const resolvedCheckout =
      resource?.type === "checkout_session"
        ? resolveCheckoutSessionPayment({
            data: {
              id: resource.id ?? "",
              attributes: {
                status: String(resourceAttributes.status ?? ""),
                payments: resourceAttributes.payments ?? []
              }
            }
          })
        : null;

    const paymentResource =
      resource?.type === "payment"
        ? resource
        : resolvedCheckout?.payment ?? resourceAttributes.payments?.[0] ?? null;
    const paymentAttributes = paymentResource?.attributes ?? resourceAttributes;
    const metadata = resourceAttributes.metadata ?? paymentAttributes.metadata ?? {};

    let bookingId = metadata.booking_id ?? null;

    if (!bookingId && checkoutSessionId) {
      const { data: paymentByCheckout } = await supabase
        .from("payments")
        .select("booking_id")
        .eq("paymongo_checkout_session_id", checkoutSessionId)
        .maybeSingle();

      bookingId = paymentByCheckout?.booking_id ?? null;
    }

    if (!bookingId) {
      return NextResponse.json({ received: true });
    }

    const { data: paymentRow } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (
      paymentRow?.paymongo_event_id === event?.id ||
      (paymentRow?.status === "paid" && eventType === "checkout_session.payment.paid")
    ) {
      return NextResponse.json({ received: true });
    }

    if (eventType === "payment.failed" && checkoutSessionId) {
      return NextResponse.json({ received: true });
    }

    const paymentStatus =
      resource?.type === "checkout_session" && resolvedCheckout
        ? resolvedCheckout.paymentStatus
        : mapPayMongoStatus(paymentAttributes.status ?? resourceAttributes.status);

    await applyPaymentStateUpdate({
      bookingId,
      paymentId: paymentRow?.id,
      paymentStatus,
      checkoutSessionId,
      paymongoPaymentId: paymentResource?.id ?? null,
      paymongoEventId: event?.id ?? null,
      paymentMethodType:
        resourceAttributes.payment_method_used ??
        paymentAttributes.source?.type ??
        null,
      rawPayload: payload as Record<string, unknown>,
      livemode,
      paidAt: paymentAttributes.paid_at
        ? new Date(paymentAttributes.paid_at * 1000).toISOString()
        : null
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to process webhook."
      },
      { status: 400 }
    );
  }
}
