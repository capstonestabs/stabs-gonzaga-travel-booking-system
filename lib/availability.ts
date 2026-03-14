import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceEnv } from "@/lib/env";
import type { AvailabilityCalendarDay, AvailabilitySnapshot } from "@/lib/types";
import { formatDateKey } from "@/lib/utils";

export function findAvailabilityWindowConflict(
  windows: Array<{ startDate: string; endDate: string }>
) {
  const sorted = [...windows].sort((left, right) => left.startDate.localeCompare(right.startDate));

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    if (current.startDate <= previous.endDate) {
      return { previous, current };
    }
  }

  return null;
}

function normalizeAvailabilityRow(row: any): AvailabilitySnapshot {
  return {
    is_open: Boolean(row?.is_open),
    capacity: Number(row?.capacity ?? 0),
    confirmed_guests: Number(row?.confirmed_guests ?? 0),
    locked_guests: Number(row?.locked_guests ?? 0),
    remaining_guests: Number(row?.remaining_guests ?? 0)
  };
}

export function getAvailabilityState(
  snapshot: AvailabilitySnapshot | null,
  requestedGuests: number
) {
  if (!snapshot) {
    return {
      canBook: false,
      tone: "muted" as const,
      message: "Choose a service date to check live availability."
    };
  }

  if (!snapshot.is_open || snapshot.capacity <= 0) {
    return {
      canBook: false,
      tone: "destructive" as const,
      message: "This date is not available for booking."
    };
  }

  if (snapshot.remaining_guests <= 0) {
    return {
      canBook: false,
      tone: "destructive" as const,
      message: "This date is already fully booked."
    };
  }

  if (requestedGuests > snapshot.remaining_guests) {
    return {
      canBook: false,
      tone: "warning" as const,
      message: "This date does not have enough availability for the selected number of guests."
    };
  }

  return {
    canBook: true,
    tone: "success" as const,
    message: "This date is available for your selected guests."
  };
}

export async function releaseExpiredSlotLocks() {
  if (!hasSupabaseServiceEnv()) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.rpc("release_expired_slot_locks");

  if (error) {
    throw new Error(error.message);
  }
}

export async function getServiceAvailabilitySnapshot(
  serviceId: string,
  serviceDate: string
) {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("get_service_capacity", {
    p_service_id: serviceId,
    p_service_date: serviceDate
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row ? normalizeAvailabilityRow(row) : null;
}

function getMonthDateKeys(month: string) {
  const [yearValue, monthValue] = month.split("-").map(Number);
  const year = yearValue;
  const monthIndex = (monthValue ?? 1) - 1;

  const dates: string[] = [];
  const cursor = new Date(year, monthIndex, 1, 12);

  while (cursor.getMonth() === monthIndex) {
    dates.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export async function getServiceAvailabilityMonthStatuses(
  serviceId: string,
  month: string
): Promise<AvailabilityCalendarDay[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const monthDates = getMonthDateKeys(month);

  if (!monthDates.length) {
    return [];
  }

  const startDate = monthDates[0];
  const endDate = monthDates[monthDates.length - 1];

  const [
    { data: service, error: serviceError },
    { data: closures, error: closuresError },
    { data: bookings, error: bookingsError },
    { data: locks, error: locksError }
  ] = await Promise.all([
    supabase
      .from("destination_services")
      .select("daily_capacity, is_active, availability_start_date, availability_end_date")
      .eq("id", serviceId)
      .maybeSingle(),
    supabase
      .from("service_availability_closures")
      .select("closed_date")
      .eq("service_id", serviceId)
      .gte("closed_date", startDate)
      .lte("closed_date", endDate),
    supabase
      .from("bookings")
      .select("service_date, guest_count")
      .eq("service_id", serviceId)
      .gte("service_date", startDate)
      .lte("service_date", endDate)
      .in("status", ["confirmed", "completed"]),
    supabase
      .from("booking_slot_locks")
      .select("service_date, guest_count")
      .eq("service_id", serviceId)
      .gte("service_date", startDate)
      .lte("service_date", endDate)
      .gt("expires_at", new Date().toISOString())
  ]);

  if (serviceError || closuresError || bookingsError || locksError) {
    throw new Error(
      serviceError?.message ??
        closuresError?.message ??
        bookingsError?.message ??
        locksError?.message ??
        "Unable to load month availability."
    );
  }

  const dailyCapacity = Number(service?.daily_capacity ?? 0);
  const isServiceActive = Boolean(service?.is_active);
  const availabilityStartDate = service?.availability_start_date
    ? String(service.availability_start_date)
    : null;
  const availabilityEndDate = service?.availability_end_date
    ? String(service.availability_end_date)
    : null;
  const closedDates = new Set((closures ?? []).map((entry) => String(entry.closed_date)));

  const confirmedGuestsByDate = new Map<string, number>();
  for (const booking of bookings ?? []) {
    const key = String(booking.service_date);
    confirmedGuestsByDate.set(
      key,
      (confirmedGuestsByDate.get(key) ?? 0) + Number(booking.guest_count ?? 0)
    );
  }

  const lockedGuestsByDate = new Map<string, number>();
  for (const lock of locks ?? []) {
    const key = String(lock.service_date);
    lockedGuestsByDate.set(key, (lockedGuestsByDate.get(key) ?? 0) + Number(lock.guest_count ?? 0));
  }

  return monthDates.map((date) => {
    const outsideWindow =
      (availabilityStartDate != null && date < availabilityStartDate) ||
      (availabilityEndDate != null && date > availabilityEndDate);

    if (!isServiceActive || dailyCapacity <= 0 || closedDates.has(date) || outsideWindow) {
      return {
        date,
        status: "closed" as const
      };
    }

    const remainingGuests =
      dailyCapacity - (confirmedGuestsByDate.get(date) ?? 0) - (lockedGuestsByDate.get(date) ?? 0);

    return {
      date,
      status: remainingGuests <= 0 ? ("full" as const) : ("available" as const)
    };
  });
}

export async function createBookingSlotLock(input: {
  bookingId: string;
  destinationId: string;
  serviceId: string;
  userId: string;
  serviceDate: string;
  guestCount: number;
  expiresAt: string;
}) {
  if (!hasSupabaseServiceEnv()) {
    throw new Error("Supabase service role credentials are missing.");
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("create_booking_slot_lock", {
    p_booking_id: input.bookingId,
    p_destination_id: input.destinationId,
    p_service_id: input.serviceId,
    p_user_id: input.userId,
    p_service_date: input.serviceDate,
    p_guest_count: input.guestCount,
    p_expires_at: input.expiresAt
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row ? normalizeAvailabilityRow(row) : null;
}

export async function finalizePaidBookingCapacity(bookingId: string) {
  if (!hasSupabaseServiceEnv()) {
    throw new Error("Supabase service role credentials are missing.");
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.rpc("finalize_paid_booking_capacity", {
    p_booking_id: bookingId
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function releaseBookingSlotLock(bookingId: string) {
  if (!hasSupabaseServiceEnv()) {
    throw new Error("Supabase service role credentials are missing.");
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("booking_slot_locks").delete().eq("booking_id", bookingId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function attachCheckoutSessionToSlotLock(bookingId: string, checkoutSessionId: string | null) {
  if (!hasSupabaseServiceEnv() || !checkoutSessionId) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("booking_slot_locks")
    .update({
      checkout_session_id: checkoutSessionId
    })
    .eq("booking_id", bookingId);

  if (error) {
    throw new Error(error.message);
  }
}
