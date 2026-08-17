import { env, hasBookingEmailEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTransactionDate(value?: string | null) {
  if (!value) {
    return "Pending timestamp";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Manila"
  }).format(new Date(value));
}

function formatPaymentMethod(value?: string | null) {
  const labels: Record<string, string> = {
    card: "Credit or debit card",
    gcash: "GCash",
    grab_pay: "GrabPay",
    paymaya: "Maya",
    billease: "BillEase"
  };

  return value ? labels[value] ?? value.replace(/_/g, " ") : "PayMongo checkout";
}

export async function sendBookingReceiptEmail(bookingId: string) {
  if (!hasBookingEmailEnv()) {
    return { sent: false, reason: "Booking email is not configured." } as const;
  }

  const supabase = createAdminSupabaseClient();
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      "id, ticket_code, service_date, guest_count, contact_name, contact_email, contact_phone, total_amount, currency, destination_snapshot, service_snapshot, confirmed_at, payment:payments(status, payment_method_type, paid_at)"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  if (!booking) {
    return { sent: false, reason: "Booking was not found." } as const;
  }

  const destinationSnapshot = (booking.destination_snapshot ?? {}) as {
    title?: string;
    location_text?: string;
  };
  const serviceSnapshot = (booking.service_snapshot ?? {}) as {
    title?: string;
    guest_breakdown?: {
      adult_count?: number;
      child_count?: number;
      guest_types?: string[];
    };
  };
  const paymentValue = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment;
  const guestBreakdown = serviceSnapshot.guest_breakdown;
  const guestInformation = guestBreakdown
    ? `${guestBreakdown.adult_count ?? 0} Adult, ${guestBreakdown.child_count ?? 0} Child (${(guestBreakdown.guest_types ?? []).map((type, index) => `Guest ${index + 1}: ${type === "child" ? "Child" : "Adult"}`).join(", ")})`
    : `${booking.guest_count} guest${booking.guest_count === 1 ? "" : "s"}`;
  const supportEmail = env.bookingSupportEmail || env.bookingReceiptFromEmail;
  const rows = [
    ["Booking reference", booking.ticket_code || booking.id],
    ["Resort", destinationSnapshot.title || "STABS destination"],
    ["Package", serviceSnapshot.title || "Standard service"],
    ["Booking date", booking.service_date],
    ["Guest information", guestInformation],
    ["Total amount paid", formatCurrency(booking.total_amount, booking.currency || "PHP")],
    ["Payment method", formatPaymentMethod(paymentValue?.payment_method_type)],
    ["Payment status", String(paymentValue?.status ?? "paid").toUpperCase()],
    ["Transaction date and time", formatTransactionDate(paymentValue?.paid_at || booking.confirmed_at)]
  ];

  const htmlContent = `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f2f7f3;font-family:Arial,sans-serif;color:#183b2a">
        <div style="max-width:680px;margin:0 auto;padding:32px 16px">
          <div style="background:#173f2d;border-radius:18px 18px 0 0;padding:28px;color:#fff">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#cce5d4">Official booking receipt</p>
            <h1 style="margin:0;font-size:28px">Your Gonzaga trip is confirmed</h1>
            <p style="margin:10px 0 0;color:#e5f2e9">Thank you, ${escapeHtml(booking.contact_name)}. Keep this email for your records.</p>
          </div>
          <div style="background:#fff;border:1px solid #d8e4db;border-top:0;padding:28px;border-radius:0 0 18px 18px">
            <table role="presentation" style="width:100%;border-collapse:collapse">
              ${rows
                .map(
                  ([label, value]) => `
                    <tr>
                      <td style="padding:12px 8px;border-bottom:1px solid #e7eee9;color:#607368;font-size:13px;vertical-align:top">${escapeHtml(label)}</td>
                      <td style="padding:12px 8px;border-bottom:1px solid #e7eee9;font-weight:600;font-size:14px;vertical-align:top">${escapeHtml(value)}</td>
                    </tr>`
                )
                .join("")}
            </table>
            <div style="margin-top:24px;padding:16px;border-radius:12px;background:#f2f7f3;font-size:13px;line-height:1.6">
              <strong>Need assistance?</strong><br />
              Contact STABS support at <a href="mailto:${escapeHtml(supportEmail)}" style="color:#22643f">${escapeHtml(supportEmail)}</a>.
              Your reservation contact is ${escapeHtml(booking.contact_phone)}.
            </div>
            <p style="margin:24px 0 0;color:#607368;font-size:12px;line-height:1.6">This automated email serves as your official booking and payment receipt.</p>
          </div>
        </div>
      </body>
    </html>`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": env.brevoApiKey
    },
    body: JSON.stringify({
      sender: {
        name: "STABS Gonzaga Travel Bookings",
        email: env.bookingReceiptFromEmail
      },
      to: [{ email: booking.contact_email, name: booking.contact_name }],
      replyTo: { email: supportEmail, name: "STABS Support" },
      subject: `Booking confirmed — ${destinationSnapshot.title || "STABS"} (${booking.ticket_code || booking.id})`,
      htmlContent
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Unable to send the booking receipt email.");
  }

  return { sent: true } as const;
}
