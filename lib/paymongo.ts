import { env, getSiteUrl, hasPayMongoEnv } from "@/lib/env";
import { createBookingReturnToken } from "@/lib/booking-return-token";
import { verifyPaymongoSignature } from "@/lib/paymongo-signature";
import type { PaymentStatus } from "@/lib/types";

const PAYMONGO_API = "https://api.paymongo.com/v1";

function getPayMongoHeaders() {
  const encoded = Buffer.from(`${env.paymongoSecretKey}:`).toString("base64");

  return {
    Accept: "application/json",
    Authorization: `Basic ${encoded}`,
    "Content-Type": "application/json"
  };
}

async function paymongoFetch<T>(path: string, init?: RequestInit) {
  if (!hasPayMongoEnv()) {
    throw new Error("PayMongo is not configured.");
  }

  const response = await fetch(`${PAYMONGO_API}${path}`, {
    ...init,
    headers: {
      ...getPayMongoHeaders(),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const payload = (await response.json()) as T & {
    errors?: Array<{ detail?: string }>;
  };

  if (!response.ok) {
    throw new Error(payload.errors?.[0]?.detail ?? "PayMongo request failed.");
  }

  return payload;
}

export async function createCheckoutSession(input: {
  bookingId: string;
  title: string;
  description: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}) {
  const siteUrl = getSiteUrl();
  const returnToken = createBookingReturnToken(input.bookingId);
  const payload = {
    data: {
      attributes: {
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        description: input.description,
        success_url: `${siteUrl}/bookings/${input.bookingId}/status?access=${returnToken}`,
        payment_method_types: ["gcash"],
        line_items: [
          {
            currency: "PHP",
            amount: input.amount,
            name: input.title,
            quantity: 1,
            description: input.description
          }
        ],
        metadata: {
          booking_id: input.bookingId,
          customer_name: input.customerName,
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone
        }
      }
    }
  };

  return paymongoFetch<{
    data: {
      id: string;
      attributes: {
        checkout_url: string;
        status: string;
      };
    };
  }>("/checkout_sessions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function retrieveCheckoutSession(checkoutSessionId: string) {
  return paymongoFetch<{
    data: {
      id: string;
      attributes: {
        status: string;
        payments?: Array<{
          id: string;
          attributes: {
            status: string;
            paid_at?: number | null;
            source?: {
              type?: string;
            } | null;
          };
        }>;
      };
    };
  }>(`/checkout_sessions/${checkoutSessionId}`);
}

type CheckoutSessionPayload = Awaited<ReturnType<typeof retrieveCheckoutSession>>;

export function resolveCheckoutSessionPayment(session: CheckoutSessionPayload) {
  const payments = session.data.attributes.payments ?? [];
  const successfulPayment =
    payments.find((payment) =>
      ["paid", "succeeded"].includes(String(payment.attributes.status ?? "").toLowerCase())
    ) ?? null;

  if (successfulPayment) {
    return {
      paymentStatus: "paid" as const,
      payment: successfulPayment
    };
  }

  const sessionStatus = mapPayMongoStatus(session.data.attributes.status);

  if (sessionStatus === "expired" || sessionStatus === "cancelled") {
    return {
      paymentStatus: sessionStatus,
      payment: payments[0] ?? null
    };
  }

  const pendingPayment =
    payments.find((payment) =>
      ["pending", "processing", "awaiting_next_action"].includes(
        String(payment.attributes.status ?? "").toLowerCase()
      )
    ) ?? null;

  if (pendingPayment || sessionStatus === "pending") {
    return {
      paymentStatus: "pending" as const,
      payment: pendingPayment ?? payments[0] ?? null
    };
  }

  const failedPayment =
    payments.find((payment) =>
      ["failed"].includes(String(payment.attributes.status ?? "").toLowerCase())
    ) ?? null;

  if (failedPayment) {
    return {
      paymentStatus: "failed" as const,
      payment: failedPayment
    };
  }

  return {
    paymentStatus: sessionStatus,
    payment: payments[0] ?? null
  };
}

export async function issueRefund(input: {
  paymentId: string;
  amount: number;
  reason: "duplicate" | "fraudulent" | "requested_by_customer" | "others";
  notes?: string;
}) {
  const payload = {
    data: {
      attributes: {
        payment_id: input.paymentId,
        amount: input.amount,
        reason: input.reason,
        notes: input.notes
      }
    }
  };

  return paymongoFetch<{
    data: {
      id: string;
      attributes: {
        status: string;
      };
    };
  }>("/refunds", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function mapPayMongoStatus(status?: string | null): PaymentStatus {
  switch (status) {
    case "paid":
    case "succeeded":
      return "paid";
    case "failed":
      return "failed";
    case "expired":
      return "expired";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

export function verifyWebhookSignature(options: {
  header: string | null;
  payload: string;
  livemode: boolean;
}) {
  if (!env.paymongoWebhookSecret) {
    return false;
  }

  return verifyPaymongoSignature({
    header: options.header,
    payload: options.payload,
    secret: env.paymongoWebhookSecret,
    livemode: options.livemode
  });
}
