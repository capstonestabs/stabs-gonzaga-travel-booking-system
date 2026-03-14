import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceEnv } from "@/lib/env";

export async function upsertFinancialRecordForBooking(bookingId: string) {
  if (!hasSupabaseServiceEnv()) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, destination_id, staff_id, user_id, service_date, guest_count, contact_name, contact_email, total_amount, currency, ticket_code, destination_snapshot")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  if (!booking) {
    return;
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, status, payment_method_type, paid_at")
    .eq("booking_id", booking.id)
    .maybeSingle();

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  if (!payment || payment.status !== "paid" || !payment.paid_at) {
    return;
  }

  const [{ data: staffUser, error: staffError }, { data: touristUser, error: touristError }] =
    await Promise.all([
      supabase.from("users").select("full_name").eq("id", booking.staff_id).maybeSingle(),
      supabase.from("users").select("full_name, email").eq("id", booking.user_id).maybeSingle()
    ]);

  if (staffError || touristError) {
    throw new Error(staffError?.message ?? touristError?.message ?? "Unable to load financial identities.");
  }

  const destinationSnapshot = (booking.destination_snapshot ?? {}) as {
    title?: string;
    category?: "tour" | "stay";
    location_text?: string;
  };

  const { error: upsertError } = await supabase.from("financial_records").upsert(
    {
      booking_id: booking.id,
      payment_id: payment.id,
      destination_id: booking.destination_id,
      staff_id: booking.staff_id,
      user_id: booking.user_id,
      destination_title: destinationSnapshot.title ?? "Destination",
      destination_location_text: destinationSnapshot.location_text ?? "Gonzaga",
      destination_category: destinationSnapshot.category ?? "tour",
      staff_name: staffUser?.full_name ?? null,
      tourist_name: touristUser?.full_name ?? booking.contact_name,
      tourist_email: touristUser?.email ?? booking.contact_email,
      service_date: booking.service_date,
      guest_count: booking.guest_count,
      amount: booking.total_amount,
      currency: booking.currency,
      payment_method_type: payment.payment_method_type ?? null,
      ticket_code: booking.ticket_code ?? null,
      paid_at: payment.paid_at
    },
    {
      onConflict: "booking_id"
    }
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}

export async function markFinancialRecordBookingDeleted(bookingId: string) {
  if (!hasSupabaseServiceEnv()) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("financial_records")
    .update({
      deleted_booking_at: new Date().toISOString()
    })
    .eq("booking_id", bookingId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function backfillFinancialRecords() {
  if (!hasSupabaseServiceEnv()) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, status, payment:payments(status)")
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const paidBookingIds = (data ?? [])
    .filter((booking) => {
      const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment;
      return payment?.status === "paid";
    })
    .map((booking) => booking.id as string);

  if (paidBookingIds.length === 0) {
    return;
  }

  const { data: existingRecords, error: existingRecordsError } = await supabase
    .from("financial_records")
    .select("booking_id")
    .in("booking_id", paidBookingIds);

  if (existingRecordsError) {
    throw new Error(existingRecordsError.message);
  }

  const existingBookingIds = new Set(
    (existingRecords ?? []).map((record) => record.booking_id as string)
  );

  for (const bookingId of paidBookingIds.filter((id) => !existingBookingIds.has(id))) {
    await upsertFinancialRecordForBooking(bookingId);
  }
}
