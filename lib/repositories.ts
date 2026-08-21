import { hasPayMongoEnv, hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ActivityItem,
  Booking,
  BookingStatusBreakdown,
  DashboardMetric,
  DashboardMetricTrend,
  Destination,
  FinancialRecordSummary,
  MonthlyRevenuePoint,
  PaymentStatus,
  ProfileBundle
} from "@/lib/types";
import { releaseExpiredSlotLocks } from "@/lib/availability";
import { backfillFinancialRecords } from "@/lib/financial-records";
import { retrieveCheckoutSession, resolveCheckoutSessionPayment } from "@/lib/paymongo";
import { applyPaymentStateUpdate } from "@/lib/payment-sync";
import { ensureBookingTicketCode } from "@/lib/tickets";
import type {
  AdminFinancialDestinationOption,
  AdminFinancialTouristOption,
  AdminDashboardData,
  DestinationRevenueSummary,
  FeedbackEntry, StaffTaskReminder,
  FinancialRecord,
  StaffDashboardData,
  UserWithStaffProfile
} from "@/lib/types";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import type { BookingActivityPoint } from "@/lib/types";
import type { Route } from "next";
import { formatDateKey } from "@/lib/utils";

function isMissingFinancialArchiveColumn(
  error: { code?: string; message?: string } | null | undefined
) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "42703" ||
    (message.includes("archived_at") &&
      (message.includes("financial_records") ||
        message.includes("schema cache") ||
        message.includes("column"))) ||
    false
  );
}

function isMissingFinancialPurgedColumn(
  error: { code?: string; message?: string } | null | undefined
) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "42703" ||
    (message.includes("purged_at") &&
      (message.includes("financial_records") ||
        message.includes("schema cache") ||
        message.includes("column"))) ||
    false
  );
}

async function getVisibleFinancialRecords() {
  const supabase = createAdminSupabaseClient();
  let response = await supabase
    .from("financial_records")
    .select("*")
    .is("archived_at", null)
    .is("purged_at", null)
    .order("paid_at", { ascending: false });

  if (isMissingFinancialPurgedColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .select("*")
      .is("archived_at", null)
      .order("paid_at", { ascending: false });
  }

  if (isMissingFinancialArchiveColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .select("*")
      .order("paid_at", { ascending: false });
  }

  return response;
}

async function getAllFinancialRecords() {
  const supabase = createAdminSupabaseClient();
  let response = await supabase
    .from("financial_records")
    .select("*")
    .is("purged_at", null)
    .order("paid_at", { ascending: false });

  if (isMissingFinancialPurgedColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .select("*")
      .order("paid_at", { ascending: false });
  }

  return response;
}

async function getVisibleFinancialRecordById(id: string) {
  const supabase = createAdminSupabaseClient();
  let response = await supabase
    .from("financial_records")
    .select("*")
    .eq("id", id)
    .is("archived_at", null)
    .is("purged_at", null)
    .maybeSingle();

  if (isMissingFinancialPurgedColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .select("*")
      .eq("id", id)
      .is("archived_at", null)
      .maybeSingle();
  }

  if (isMissingFinancialArchiveColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  }

  return response;
}

async function getArchivedFinancialRecords() {
  const supabase = createAdminSupabaseClient();
  let response = await supabase
    .from("financial_records")
    .select("*")
    .not("archived_at", "is", null)
    .is("purged_at", null)
    .order("archived_at", { ascending: false });

  if (isMissingFinancialPurgedColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .select("*")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });
  }

  if (isMissingFinancialArchiveColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .select("*")
      .eq("settlement_status", "settled")
      .order("settled_at", { ascending: false });
  }

  return response;
}

async function getFinancialRecordById(id: string) {
  const supabase = createAdminSupabaseClient();
  let response = await supabase
    .from("financial_records")
    .select("*")
    .eq("id", id)
    .is("purged_at", null)
    .maybeSingle();

  if (isMissingFinancialPurgedColumn(response.error)) {
    response = await supabase.from("financial_records").select("*").eq("id", id).maybeSingle();
  }

  return response;
}

async function getArchivedFinancialRecordCount() {
  const supabase = createAdminSupabaseClient();
  let response = await supabase
    .from("financial_records")
    .select("id", { count: "exact", head: true })
    .not("archived_at", "is", null)
    .is("purged_at", null);

  if (isMissingFinancialPurgedColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .select("id", { count: "exact", head: true })
      .not("archived_at", "is", null);
  }

  if (isMissingFinancialArchiveColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .select("id", { count: "exact", head: true })
      .eq("settlement_status", "settled");
  }

  if (response.error) {
    return {
      count: 0,
      error: null
    };
  }

  return response;
}

async function archiveSettledFinancialRecords() {
  const supabase = createAdminSupabaseClient();
  let response = await supabase
    .from("financial_records")
    .update({
      archived_at: new Date().toISOString()
    })
    .eq("settlement_status", "settled")
    .is("archived_at", null)
    .is("purged_at", null);

  if (isMissingFinancialPurgedColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .update({
        archived_at: new Date().toISOString()
      })
      .eq("settlement_status", "settled")
      .is("archived_at", null);
  }

  if (isMissingFinancialArchiveColumn(response.error)) {
    return;
  }

  if (response.error) {
    throw new Error(response.error.message);
  }
}

async function hydrateBookingTickets(bookings: Booking[]) {
  return Promise.all(
    bookings.map(async (booking) => {
      if (
        (booking.status === "confirmed" || booking.status === "completed") &&
        !booking.ticket_code
      ) {
        return {
          ...booking,
          ticket_code: await ensureBookingTicketCode(booking.id, booking.ticket_code)
        };
      }

      return booking;
    })
  );
}

async function attachBookingFinancialRecords(bookings: Booking[]) {
  if (!bookings.length || !hasSupabaseServiceEnv()) {
    return bookings;
  }

  const supabase = createAdminSupabaseClient();
  const bookingIds = bookings.map((booking) => booking.id);
  const { data, error } = await supabase
    .from("financial_records")
    .select("id, booking_id, settlement_status, receipt_reference, deleted_booking_at")
    .in("booking_id", bookingIds);

  if (error) {
    throw new Error(error.message);
  }

  const summaryByBookingId = new Map(
    (data ?? [])
      .filter((record) => record.booking_id)
      .map((record) => [
        record.booking_id as string,
        {
          id: record.id as string,
          booking_id: record.booking_id as string,
          settlement_status: record.settlement_status,
          receipt_reference: record.receipt_reference,
          deleted_booking_at: record.deleted_booking_at
        }
      ])
  );

  return bookings.map((booking) => ({
    ...booking,
    financial_record: summaryByBookingId.get(booking.id) ?? null
  }));
}

function normalizeBookingPayment(booking: Booking) {
  const rawPayment = booking.payment as unknown;

  if (Array.isArray(rawPayment)) {
    return (rawPayment[0] as Booking["payment"]) ?? null;
  }

  return (rawPayment as Booking["payment"]) ?? null;
}

async function syncBookingPaymentStates(bookings: Booking[]) {
  if (!bookings.length || !hasSupabaseServiceEnv() || !hasPayMongoEnv()) {
    return false;
  }

  let didUpdate = false;
  const syncCandidates = bookings
    .filter((booking) => {
      const payment = normalizeBookingPayment(booking);
      return Boolean(payment?.paymongo_checkout_session_id) && payment?.status !== "paid";
    })
    .slice(0, 3);

  for (const booking of syncCandidates) {
    const payment = normalizeBookingPayment(booking);

    if (!payment?.paymongo_checkout_session_id || payment.status === "paid") {
      continue;
    }

    try {
      const session = await retrieveCheckoutSession(payment.paymongo_checkout_session_id);
      const resolvedSession = resolveCheckoutSessionPayment(session);
      const sessionPayment = resolvedSession.payment;
      const paymentStatus: PaymentStatus = resolvedSession.paymentStatus;

      const statusChanged = paymentStatus !== payment.status;
      const newlyConfirmedPaid =
        (booking.status === "cancelled" || booking.status === "pending_payment") &&
        paymentStatus === "paid";
      const staleCancelledTicket = booking.status === "cancelled" && Boolean(booking.ticket_code);
      const shouldRefreshRecord =
        newlyConfirmedPaid ||
        staleCancelledTicket ||
        (statusChanged &&
          !(booking.status === "cancelled" && paymentStatus !== "paid"));

      if (!shouldRefreshRecord) {
        continue;
      }

      await applyPaymentStateUpdate({
        bookingId: booking.id,
        paymentId: payment.id,
        paymentStatus,
        checkoutSessionId: payment.paymongo_checkout_session_id,
        paymongoPaymentId: sessionPayment?.id ?? payment.paymongo_payment_id,
        paymentMethodType: sessionPayment?.attributes.source?.type ?? payment.payment_method_type,
        paidAt: sessionPayment?.attributes.paid_at
          ? new Date(sessionPayment.attributes.paid_at * 1000).toISOString()
          : payment.paid_at
      });

      didUpdate = true;
    } catch {
      // Keep the current DB state if PayMongo cannot be reached for this record.
    }
  }

  return didUpdate;
}

async function attachFinancialBookingSnapshots(records: FinancialRecord[]) {
  if (!records.length || !hasSupabaseServiceEnv()) {
    return records;
  }

  const bookingIds = records
    .map((record) => record.booking_id)
    .filter((value): value is string => Boolean(value));

  if (!bookingIds.length) {
    return records;
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, service_snapshot")
    .in("id", bookingIds);

  if (error) {
    throw new Error(error.message);
  }

  const snapshotByBookingId = new Map(
    (data ?? []).map((booking) => [
      booking.id as string,
      (booking.service_snapshot as FinancialRecord["service_snapshot"]) ?? null
    ])
  );

  return records.map((record) => ({
    ...record,
    service_snapshot: record.booking_id ? snapshotByBookingId.get(record.booking_id) ?? null : null
  }));
}

async function hydrateBookings(bookings: Booking[]) {
  const withTickets = await hydrateBookingTickets(bookings);
  return attachBookingFinancialRecords(withTickets);
}

async function hydrateUserBookings(bookings: Booking[]) {
  return hydrateBookingTickets(bookings);
}

function buildDestinationRevenueSummaries(
  records: FinancialRecord[],
  coverUrls: Map<string, string | null> = new Map()
): DestinationRevenueSummary[] {
  const summaryMap = new Map<string, DestinationRevenueSummary>();

  for (const record of records) {
    const existing = summaryMap.get(record.destination_id);

    if (existing) {
      existing.booking_count += 1;
      existing.total_paid_amount += record.amount;
      if (record.settlement_status === "settled") {
        existing.settled_amount += record.amount;
      } else {
        existing.unsettled_amount += record.amount;
      }
      continue;
    }

    summaryMap.set(record.destination_id, {
      destination_id: record.destination_id,
      destination_title: record.destination_title,
      destination_location_text: record.destination_location_text,
      staff_name: record.staff_name,
      booking_count: 1,
      total_paid_amount: record.amount,
      settled_amount: record.settlement_status === "settled" ? record.amount : 0,
      unsettled_amount: record.settlement_status === "settled" ? 0 : record.amount,
      cover_url: coverUrls.get(record.destination_id) ?? null
    });
  }

  return Array.from(summaryMap.values()).sort(
    (left, right) => right.total_paid_amount - left.total_paid_amount
  );
}
function buildBookingActivitySeries(
  bookings: { status: string; created_at: string | null }[],
  days = 30
): BookingActivityPoint[] {
  const today = new Date();
  const buckets = new Map<string, BookingActivityPoint>();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = formatDateKey(date);
    buckets.set(key, {
      date: key,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      confirmed: 0,
      pending: 0,
      cancelled: 0
    });
  }

  for (const booking of bookings) {
    if (!booking.created_at) continue;
    const key = formatDateKey(new Date(booking.created_at));
    const bucket = buckets.get(key);
    if (!bucket) continue; // outside the last `days` window

    if (booking.status === "confirmed" || booking.status === "completed") {
      bucket.confirmed += 1;
    } else if (booking.status === "pending_payment") {
      bucket.pending += 1;
    } else if (booking.status === "cancelled") {
      bucket.cancelled += 1;
    }
  }

  return Array.from(buckets.values());
}

export function buildBookingStatusBreakdown(
  bookings: Array<{ status: string }>
): BookingStatusBreakdown {
  let confirmed = 0;
  let pending = 0;
  let cancelled = 0;

  for (const booking of bookings) {
    if (booking.status === "confirmed" || booking.status === "completed") {
      confirmed += 1;
    } else if (booking.status === "pending_payment") {
      pending += 1;
    } else if (booking.status === "cancelled") {
      cancelled += 1;
    }
  }

  return { confirmed, pending, cancelled, total: confirmed + pending + cancelled };
}

export async function getMonthlyRevenueSeries(months = 6): Promise<MonthlyRevenuePoint[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

  let response = await supabase
    .from("financial_records")
    .select("amount, paid_at")
    .gte("paid_at", start.toISOString())
    .is("purged_at", null);

  if (isMissingFinancialPurgedColumn(response.error)) {
    response = await supabase
      .from("financial_records")
      .select("amount, paid_at")
      .gte("paid_at", start.toISOString());
  }

  if (response.error) {
    throw new Error(response.error.message ?? "Unable to load monthly revenue.");
  }

  const buckets = new Map<string, MonthlyRevenuePoint>();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, {
      key,
      label: date.toLocaleDateString("en-US", { month: "short" }),
      revenue: 0
    });
  }

  for (const row of response.data ?? []) {
    if (!row.paid_at) continue;
    const date = new Date(row.paid_at as string);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenue += Number(row.amount ?? 0);
    }
  }

  return Array.from(buckets.values());
}

async function getDestinationTitlesForActivity(
  ids: string[]
): Promise<Record<string, string | null>> {
  if (!ids.length) return {};
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("destinations").select("id, title").in("id", ids);
  if (error) throw new Error(error.message ?? "Unable to load destination titles.");
  return Object.fromEntries(
    (data ?? []).map((row) => [row.id as string, (row.title as string | null) ?? null])
  );
}

async function getUserFullNamesForActivity(
  ids: string[]
): Promise<Record<string, string | null>> {
  if (!ids.length) return {};
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("users").select("id, full_name").in("id", ids);
  if (error) throw new Error(error.message ?? "Unable to load user names.");
  return Object.fromEntries(
    (data ?? []).map((row) => [row.id as string, (row.full_name as string | null) ?? null])
  );
}

export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createAdminSupabaseClient();

  const [
    { data: recentBookings, error: bookingsError },
    { data: recentTourists, error: touristsError },
    { data: recentServices, error: servicesError }
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, status, created_at, destination_id, user_id")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("users")
      .select("id, full_name, created_at")
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("destination_services")
      .select("id, title, destination_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
  ]);

  if (bookingsError || touristsError || servicesError) {
    throw new Error(
      bookingsError?.message ??
        touristsError?.message ??
        servicesError?.message ??
        "Unable to load recent activity."
    );
  }

  const bookings = recentBookings ?? [];
  const services = recentServices ?? [];

  const destinationIds = Array.from(
    new Set([
      ...bookings.map((b) => b.destination_id),
      ...services.map((s) => s.destination_id)
    ].filter(Boolean))
  ) as string[];
  const userIds = Array.from(
    new Set(bookings.map((b) => b.user_id).filter(Boolean))
  ) as string[];

  const [destinationTitles, userNames] = await Promise.all([
    getDestinationTitlesForActivity(destinationIds),
    getUserFullNamesForActivity(userIds)
  ]);

  const bookingItems: ActivityItem[] = bookings.map((booking) => ({
    id: `booking-${booking.id}`,
    type: "booking",
    title:
      booking.status === "cancelled"
        ? "Booking cancelled"
        : booking.status === "completed"
        ? "Trip completed"
        : booking.status === "confirmed"
        ? "New booking confirmed"
        : "New booking created",
    subtitle: [
      destinationTitles[booking.destination_id ?? ""],
      userNames[booking.user_id ?? ""]
    ]
      .filter(Boolean)
      .join(" – "),
    timestamp: booking.created_at as string
  }));

  const touristItems: ActivityItem[] = (recentTourists ?? []).map((tourist) => ({
    id: `tourist-${tourist.id}`,
    type: "tourist",
    title: "New tourist registered",
    subtitle: tourist.full_name ?? "Unnamed tourist",
    timestamp: tourist.created_at as string
  }));

  const serviceItems: ActivityItem[] = services.map((service) => ({
    id: `service-${service.id}`,
    type: "service",
    title: "New service added",
    subtitle: [service.title, destinationTitles[service.destination_id ?? ""]]
      .filter(Boolean)
      .join(" – "),
    timestamp: service.created_at as string
  }));

  return [...bookingItems, ...touristItems, ...serviceItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
export async function getPublishedDestinations() {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*, destination_images(*), destination_services(*)")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Destination[];
}

export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  const supabase = hasSupabaseServiceEnv()
    ? createAdminSupabaseClient()
    : await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Missing Supabase configuration.");
  }

  const { data, error } = await supabase
    .from("destinations")
    .select(
      "*, destination_images(*), destination_services(*)"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("contact_email, contact_phone")
    .eq("user_id", data.staff_id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    ...data,
    staff_profile: profile || null
  } as Destination;
}

export async function getDestinationById(id: string) {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*, destination_images(*), destination_services(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Destination | null) ?? null;
}

export async function getDestinationForStaff(staffId: string) {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*, destination_images(*), destination_services(*)")
    .eq("staff_id", staffId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Destination | null) ?? null;
}

export async function getRecentFeedbackEntries(limit = 6) {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("feedback_entries")
    .select("*, destination:destinations(id, slug, title, location_text)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FeedbackEntry[];
}

export async function getFeedbackEntriesForStaff(staffId: string, limit = 24) {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const destination = await getDestinationForStaff(staffId);
  if (!destination) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("feedback_entries")
    .select("*, destination:destinations(id, slug, title, location_text)")
    .eq("destination_id", destination.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FeedbackEntry[];
}

export async function getBookingsForStaff(staffId: string, limit = 50) {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  await releaseExpiredSlotLocks();
  await backfillFinancialRecords();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, destination:destinations(*), payment:payments(*), visits:booking_guest_visits(*)")
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const bookings = (data ?? []) as Booking[];
  const didSync = await syncBookingPaymentStates(bookings);

  if (didSync) {
    const { data: refreshedData, error: refreshedError } = await supabase
      .from("bookings")
      .select("*, destination:destinations(*), payment:payments(*), visits:booking_guest_visits(*)")
      .eq("staff_id", staffId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (refreshedError) {
      throw new Error(refreshedError.message);
    }

    return hydrateBookings((refreshedData ?? []) as Booking[]);
  }

  return hydrateBookings(bookings);
}

export interface StaffDashboardDateRange {
  from?: string;
  to?: string;
}



export interface StaffDashboardDateRange {
  from?: string;
  to?: string;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export async function getStaffDashboardData(
  staffId: string,
  range?: StaffDashboardDateRange
): Promise<StaffDashboardData> {
  if (!hasSupabaseServiceEnv()) {
    return {
      metrics: [
        { label: "Confirmed bookings", value: "0", helper: "Supabase service role not configured" },
        { label: "Payout waiting", value: formatCurrency(0), helper: "Supabase service role not configured" }
      ],
      listings: [],
      recentBookings: [],
      feedbackEntries: [],
      overview: {
        collectedAmount: 0,
        pendingPayoutAmount: 0,
        pendingPayoutCount: 0,
        touristsCount: 0,
        bookingsTotal: 0,
        bookingsPending: 0,
        bookingsConfirmed: 0,
        bookingsCancelled: 0,
        servicesTotal: 0
      },
      todaySummary: { newBookings: 0, confirmed: 0, pending: 0, declined: 0 },
      tasks: []
    };
  }

  await releaseExpiredSlotLocks();
  await backfillFinancialRecords();

  const supabase = createAdminSupabaseClient();

  // --- Today's summary (always "today", independent of the date-range picker) ---
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: todayBookings, error: todayBookingsError } = await supabase
    .from("bookings")
    .select("status, created_at, confirmed_at, cancelled_at")
    .eq("staff_id", staffId)
    .or(
      [
        `and(created_at.gte.${todayStart.toISOString()},created_at.lte.${todayEnd.toISOString()})`,
        `and(confirmed_at.gte.${todayStart.toISOString()},confirmed_at.lte.${todayEnd.toISOString()})`,
        `and(cancelled_at.gte.${todayStart.toISOString()},cancelled_at.lte.${todayEnd.toISOString()})`
      ].join(",")
    );

  if (todayBookingsError) {
    throw new Error(todayBookingsError.message);
  }

  const isToday = (value: string | null) =>
    !!value && new Date(value) >= todayStart && new Date(value) <= todayEnd;

  const newBookingsToday = (todayBookings ?? []).filter((b) => isToday(b.created_at)).length;
  const confirmedToday = (todayBookings ?? []).filter((b) => isToday(b.confirmed_at)).length;
  const declinedToday = (todayBookings ?? []).filter((b) => isToday(b.cancelled_at)).length;

  const { count: pendingOngoing, error: pendingOngoingError } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("staff_id", staffId)
    .eq("status", "pending_payment");

  if (pendingOngoingError) {
    throw new Error(pendingOngoingError.message);
  }

  const rangeFrom = range?.from ? new Date(range.from) : null;
  const rangeTo = range?.to ? endOfDay(new Date(range.to)) : null;

  // --- Bookings within the selected range (by created_at) ---
  let rangeBookingsQuery = supabase
    .from("bookings")
    .select("id, user_id, status, created_at")
    .eq("staff_id", staffId);

  if (rangeFrom) rangeBookingsQuery = rangeBookingsQuery.gte("created_at", rangeFrom.toISOString());
  if (rangeTo) rangeBookingsQuery = rangeBookingsQuery.lte("created_at", rangeTo.toISOString());

  const { data: rangeBookings, error: rangeBookingsError } = await rangeBookingsQuery;

  if (rangeBookingsError) {
    throw new Error(rangeBookingsError.message);
  }

  const bookingsInRange = rangeBookings ?? [];
  const bookingsTotal = bookingsInRange.length;
  const bookingsPending = bookingsInRange.filter((b) => b.status === "pending_payment").length;
    const bookingsConfirmed = bookingsInRange.filter((b) => b.status === "confirmed").length;
  const bookingsCancelled = bookingsInRange.filter((b) => b.status === "cancelled").length;
  const touristsCount = new Set(bookingsInRange.map((b) => b.user_id)).size;

  // --- Financials within the selected range (by paid_at) ---
  let rangeFinancialsQuery = supabase
    .from("financial_records")
    .select("amount, paid_at")
    .eq("staff_id", staffId)
    .is("archived_at", null)
    .is("purged_at", null);

  if (rangeFrom) rangeFinancialsQuery = rangeFinancialsQuery.gte("paid_at", rangeFrom.toISOString());
  if (rangeTo) rangeFinancialsQuery = rangeFinancialsQuery.lte("paid_at", rangeTo.toISOString());

  const { data: rangeFinancials } = await rangeFinancialsQuery;

  const collectedAmount = (rangeFinancials ?? []).reduce(
    (sum, record) => sum + Number(record.amount ?? 0),
    0
  );

  // --- Everything below is unfiltered / existing logic ---
  type StaffUnsettledFinancialRow = { amount: number | string | null; settlement_status: string | null };

  let unsettledFinancialsData: StaffUnsettledFinancialRow[] | null = null;
  let unsettledFinancialsError: { message?: string } | null = null;

  const unsettledFinancialsResponse = await supabase
    .from("financial_records")
    .select("amount, archived_at, settlement_status")
    .eq("staff_id", staffId)
    .neq("settlement_status", "settled")
    .is("archived_at", null)
    .is("purged_at", null);

  unsettledFinancialsData =
    unsettledFinancialsResponse.data?.map((record) => ({
      amount: record.amount,
      settlement_status: record.settlement_status
    })) ?? null;
  unsettledFinancialsError = unsettledFinancialsResponse.error;

  if (isMissingFinancialPurgedColumn(unsettledFinancialsError)) {
    const fallbackUnsettledFinancialsResponse = await supabase
      .from("financial_records")
      .select("amount, archived_at, settlement_status")
      .eq("staff_id", staffId)
      .neq("settlement_status", "settled")
      .is("archived_at", null);

    unsettledFinancialsData =
      fallbackUnsettledFinancialsResponse.data?.map((record) => ({
        amount: record.amount,
        settlement_status: record.settlement_status
      })) ?? null;
    unsettledFinancialsError = fallbackUnsettledFinancialsResponse.error;
  }

  if (isMissingFinancialArchiveColumn(unsettledFinancialsError)) {
    const fallbackUnsettledFinancialsResponse = await supabase
      .from("financial_records")
      .select("amount, settlement_status")
      .eq("staff_id", staffId)
      .neq("settlement_status", "settled");

    unsettledFinancialsData =
      fallbackUnsettledFinancialsResponse.data?.map((record) => ({
        amount: record.amount,
        settlement_status: record.settlement_status
      })) ?? null;
    unsettledFinancialsError = fallbackUnsettledFinancialsResponse.error;
  }

  const [
    { data: listings, error: listingsError },
    { data: recentBookings, error: recentBookingsError },
    { data: bookingStatuses, error: bookingStatusesError },
    { data: unsettledFinancials, error: unresolvedUnsettledFinancialsError }
  ] = await Promise.all([
    supabase
      .from("destinations")
      .select("*, destination_images(*), destination_services(*)")
      .eq("staff_id", staffId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("*, destination:destinations(*), payment:payments(*), visits:booking_guest_visits(*)")
      .eq("staff_id", staffId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("bookings").select("status").eq("staff_id", staffId),
    Promise.resolve({ data: unsettledFinancialsData, error: unsettledFinancialsError })
  ]);

  if (listingsError || recentBookingsError || bookingStatusesError || unsettledFinancialsError) {
    throw new Error(
      listingsError?.message ??
        recentBookingsError?.message ??
        bookingStatusesError?.message ??
        unsettledFinancialsError?.message ??
        unresolvedUnsettledFinancialsError?.message ??
        "Unable to load the staff dashboard."
    );
  }

  const confirmedBookings = bookingStatuses?.filter((b) => b.status === "confirmed").length ?? 0;
  const pendingPayoutAmount = unsettledFinancials?.reduce((sum, r) => sum + Number(r.amount ?? 0), 0) ?? 0;
  const pendingPayoutCount = unsettledFinancials?.length ?? 0;
  const servicesTotal = (listings ?? []).reduce(
    (acc, listing) => acc + (listing.destination_services?.length ?? 0),
    0
  );

   const feedbackEntries = await getFeedbackEntriesForStaff(staffId, 6);

  // --- New inquiries in the last 7 days (for Tasks & Reminders) ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: newFeedbackCount, error: newFeedbackError } = await supabase
    .from("feedback")
    .select("id, destinations!inner(staff_id)", { count: "exact", head: true })
    .eq("destinations.staff_id", staffId)
    .gte("created_at", sevenDaysAgo.toISOString());

  if (newFeedbackError) {
    throw new Error(newFeedbackError.message);
  }

  const tasks: StaffTaskReminder[] = [
    {
      id: "pending_bookings",
      title: "Pending bookings that need follow-up",
      description:
        pendingOngoing && pendingOngoing > 0
          ? `${pendingOngoing} booking${pendingOngoing === 1 ? "" : "s"} waiting for confirmation from guests.`
          : "No bookings waiting for confirmation.",
      href: "/staff/bookings?status=pending_payment" as Route,
      icon: "calendar"
    },
    {
      id: "new_feedback",
      title:
        newFeedbackCount && newFeedbackCount > 0
          ? `${newFeedbackCount} new inquir${newFeedbackCount === 1 ? "y" : "ies"} received`
          : "No new inquiries",
      description: "Respond to guest inquiries to convert.",
      href: "/staff/feedback" as Route,
      icon: "inquiry"
    },
    {
      id: "unsettled_payouts",
      title: "Payouts pending settlement",
      description:
        pendingPayoutCount > 0
          ? `${pendingPayoutCount} payment${pendingPayoutCount === 1 ? "" : "s"} awaiting admin payout.`
          : "All payouts are settled.",
      href: "/staff/financials" as Route,
      icon: "bell"
    }
  ];

  return {
    metrics: [
      {
        label: "Confirmed bookings",
        value: String(confirmedBookings),
        helper: `${bookingStatuses?.length ?? 0} total booking record${(bookingStatuses?.length ?? 0) === 1 ? "" : "s"}`
      },
      {
        label: "Payout waiting",
        value: formatCurrency(pendingPayoutAmount),
        helper:
          pendingPayoutCount > 0
            ? `${pendingPayoutCount} paid booking${pendingPayoutCount === 1 ? "" : "s"} waiting for admin payout`
            : "No unsettled payouts waiting right now"
      }
    ],
    listings: (listings ?? []) as Destination[],
    recentBookings: await hydrateBookings((recentBookings ?? []) as Booking[]),
    feedbackEntries: (feedbackEntries ?? []) as FeedbackEntry[],
    overview: {
      collectedAmount,
      pendingPayoutAmount,
      pendingPayoutCount,
      touristsCount,
      bookingsTotal,
      bookingsPending,
      bookingsConfirmed,
      bookingsCancelled,
      servicesTotal
    },
      todaySummary: {
      newBookings: newBookingsToday,
      confirmed: confirmedToday,
      pending: pendingOngoing ?? 0,
      declined: declinedToday
    },
    tasks
  };
}

export interface RecentBookingSummaryRow {
  id: string;
  displayCode: string;
  destinationTitle: string;
  serviceTitle: string | null;
  guestName: string;
  serviceDate: string;
  status: "pending_payment" | "confirmed" | "completed" | "cancelled";
}

export interface UpcomingBookingSummaryRow {
  id: string;
  destinationTitle: string;
  guestName: string;
  serviceDate: string;
  status: "pending_payment" | "confirmed";
  imageUrl: string | null;
}

export interface StaffBookingsSummary {
  recent: RecentBookingSummaryRow[];
  recentTotal: number;
  upcoming: UpcomingBookingSummaryRow[];
}

function deriveBookingDisplayCode(id: string, createdAt: string) {
  const year = new Date(createdAt).getFullYear();
  const shortId = id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `RES-${year}-${shortId}`;
}

export async function getStaffBookingsSummary(staffId: string): Promise<StaffBookingsSummary> {
  if (!hasSupabaseServiceEnv()) {
    return { recent: [], recentTotal: 0, upcoming: [] };
  }

  const supabase = createAdminSupabaseClient();
  const nowIso = new Date().toISOString();

  const [
    { data: recentRows, error: recentError, count: recentCount },
    { data: upcomingRows, error: upcomingError }
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, created_at, service_date, contact_name, status, destination_snapshot, service_snapshot", {
        count: "exact"
      })
      .eq("staff_id", staffId)
      .order("created_at", { ascending: false })
      .range(0, 4),
    supabase
      .from("bookings")
      .select(
        "id, service_date, contact_name, status, destination_snapshot, destination:destinations(cover_url, destination_images(image_url, sort_order))"
      )
      .eq("staff_id", staffId)
      .in("status", ["pending_payment", "confirmed"])
      .gt("service_date", nowIso)
      .order("service_date", { ascending: true })
      .limit(4)
  ]);

  if (recentError) throw new Error(recentError.message);
  if (upcomingError) throw new Error(upcomingError.message);

  const recent: RecentBookingSummaryRow[] = (recentRows ?? []).map((row) => ({
    id: row.id,
    displayCode: deriveBookingDisplayCode(row.id, row.created_at),
    destinationTitle: (row.destination_snapshot as { title?: string } | null)?.title ?? "Destination",
    serviceTitle: (row.service_snapshot as { title?: string } | null)?.title ?? null,
    guestName: row.contact_name,
    serviceDate: row.service_date,
    status: row.status
  }));

  const upcoming: UpcomingBookingSummaryRow[] = (upcomingRows ?? []).map((row) => {
    const destination = Array.isArray(row.destination) ? row.destination[0] : row.destination;
    const images = destination?.destination_images ?? [];
    const sortedImages = [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const imageUrl = destination?.cover_url ?? sortedImages[0]?.image_url ?? null;

    return {
      id: row.id,
      destinationTitle: (row.destination_snapshot as { title?: string } | null)?.title ?? "Destination",
      guestName: row.contact_name,
      serviceDate: row.service_date,
      status: row.status as "pending_payment" | "confirmed",
      imageUrl
    };
  });

  return {
    recent,
    recentTotal: recentCount ?? recent.length,
    upcoming
  };
}
export async function getFinancialRecordsForStaff(staffId: string): Promise<FinancialRecord[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createAdminSupabaseClient();

  const response = await supabase
    .from("financial_records")
    .select("*")
    .eq("staff_id", staffId)
    .is("archived_at", null)
    .is("purged_at", null)
    .order("paid_at", { ascending: false });

  if (isMissingFinancialPurgedColumn(response.error)) {
    const fallback = await supabase
      .from("financial_records")
      .select("*")
      .eq("staff_id", staffId)
      .is("archived_at", null)
      .order("paid_at", { ascending: false });

    if (fallback.error) {
      throw new Error(fallback.error.message ?? "Unable to load financial records.");
    }

    return (fallback.data ?? []) as FinancialRecord[];
  }

  if (isMissingFinancialArchiveColumn(response.error)) {
    const fallback = await supabase
      .from("financial_records")
      .select("*")
      .eq("staff_id", staffId)
      .order("paid_at", { ascending: false });

    if (fallback.error) {
      throw new Error(fallback.error.message ?? "Unable to load financial records.");
    }

    return (fallback.data ?? []) as FinancialRecord[];
  }

  if (response.error) {
    throw new Error(response.error.message ?? "Unable to load financial records.");
  }

  return (response.data ?? []) as FinancialRecord[];
}
export async function getServiceCoverPhotos(
  serviceIds: string[]
): Promise<Record<string, string | null>> {
  if (!hasSupabaseServiceEnv() || serviceIds.length === 0) {
    return {};
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("destination_services")
    .select("id, image_url")
    .in("id", serviceIds);

  if (error) {
    throw new Error(error.message ?? "Unable to load service photos.");
  }

  return Object.fromEntries(
    (data ?? []).map((row) => [row.id as string, (row.image_url as string | null) ?? null])
  );
}

export async function getDestinationCoverPhotos(
  destinationIds: string[]
): Promise<Record<string, string | null>> {
  if (!hasSupabaseServiceEnv() || destinationIds.length === 0) {
    return {};
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("id, cover_url")
    .in("id", destinationIds);

  if (error) {
    throw new Error(error.message ?? "Unable to load destination cover photos.");
  }

  return Object.fromEntries(
    (data ?? []).map((row) => [row.id as string, (row.cover_url as string | null) ?? null])
  );
}
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  if (!hasSupabaseServiceEnv()) {
    return {
      metrics: [
        {
          label: "Staff accounts",
          value: "0",
          helper: "Supabase service role not configured"
        },
        {
          label: "Tourist accounts",
          value: "0",
          helper: "Supabase service role not configured"
        }
      ],
      financialMetrics: [
        {
          label: "Gross revenue",
          value: formatCurrency(0),
          helper: "Supabase service role not configured"
        },
        {
          label: "Settled revenue",
          value: formatCurrency(0),
          helper: "Supabase service role not configured"
        },
        {
          label: "Unsettled revenue",
          value: formatCurrency(0),
          helper: "Supabase service role not configured"
        },
        {
          label: "Average booking value",
          value: formatCurrency(0),
          helper: "Supabase service role not configured"
        }
      ],
      bookingMetrics: [
        {
          label: "Confirmed bookings",
          value: "0",
          helper: "Supabase service role not configured"
        },
        {
          label: "Completed trips",
          value: "0",
          helper: "Supabase service role not configured"
        },
        {
          label: "Pending payments",
          value: "0",
          helper: "Supabase service role not configured"
        },
        {
          label: "Cancelled bookings",
          value: "0",
          helper: "Supabase service role not configured"
        }
        ],
      listings: [],
      staff: [],
      tourists: [],
      bookingActivity: [],
      destinationRevenue: [],
      financialRecords: [],
      archivedFinancialRecordCount: 0,
      bookingActivitySeries: []
    };
  }

  await releaseExpiredSlotLocks();
  await backfillFinancialRecords();

  const supabase = createAdminSupabaseClient();

    const [
      { data: listings, error: listingsError },
      { data: staff, error: staffError },
      { data: tourists, error: touristsError },
      { data: bookings, error: bookingsError },
      { data: payments, error: paymentsError },
      { data: financialRecords, error: financialRecordsError },
    { data: allFinancialRecords, error: allFinancialRecordsError },
    { count: archivedFinancialRecordCount, error: archivedFinancialRecordCountError }
  ] =
    await Promise.all([
      supabase.from("destinations").select("*, destination_services(*)").order("created_at", { ascending: false }),
        supabase
          .from("users")
          .select("*, staff_profile:staff_profiles(*)")
          .eq("role", "staff")
          .is("archived_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("users")
          .select("*")
          .eq("role", "user")
          .is("archived_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("user_id, status, created_at")
          .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("status, amount, paid_at")
        .order("created_at", { ascending: false }),
      getVisibleFinancialRecords(),
      getAllFinancialRecords(),
      getArchivedFinancialRecordCount()
    ]);

  if (
      listingsError ||
      staffError ||
      touristsError ||
      bookingsError ||
      paymentsError ||
      financialRecordsError ||
    allFinancialRecordsError
  ) {
    throw new Error(
        listingsError?.message ??
          staffError?.message ??
          touristsError?.message ??
          bookingsError?.message ??
          paymentsError?.message ??
          financialRecordsError?.message ??
        allFinancialRecordsError?.message ??
        "Failed to load admin data."
    );
  }

  const assignedDestinations = listings?.length ?? 0;
  const publishedDestinations =
    listings?.filter((listing) => listing.status === "published").length ?? 0;
  const paidPayments = payments?.filter((payment) => payment.status === "paid") ?? [];
  const visibleRecords = await attachFinancialBookingSnapshots(
    (financialRecords ?? []) as FinancialRecord[]
  );
  const allRecords = await attachFinancialBookingSnapshots(
    (allFinancialRecords ?? []) as FinancialRecord[]
  );
  const paidRevenue = allRecords.reduce((sum, record) => {
    return sum + record.amount;
  }, 0);
  const settledRevenue = allRecords.reduce((sum, record) => {
    return sum + (record.settlement_status === "settled" ? record.amount : 0);
  }, 0);
  const averageBookingValue =
    allRecords.length > 0 ? Math.round(paidRevenue / allRecords.length) : 0;
  const pendingPayments =
    bookings?.filter((booking) => booking.status === "pending_payment").length ?? 0;
  const confirmedBookings =
    bookings?.filter((booking) => booking.status === "confirmed").length ?? 0;
  const completedTrips =
    bookings?.filter((booking) => booking.status === "completed").length ?? 0;
  const cancelledBookings =
    bookings?.filter((booking) => booking.status === "cancelled").length ?? 0;
  const coverUrls = new Map(
    (listings ?? []).map((listing) => [listing.id, listing.cover_url])
  );
  const destinationRevenue = buildDestinationRevenueSummaries(allRecords, coverUrls);

  return {
    metrics: [
      {
        label: "Staff accounts",
        value: formatCompactNumber(staff?.length ?? 0),
        helper: "Accounts managed by the tourism office"
      },
      {
        label: "Tourist accounts",
        value: formatCompactNumber(tourists?.length ?? 0),
        helper: "Registered tourist profiles"
      }
    ],
    financialMetrics: [
      {
        label: "Gross revenue",
        value: formatCurrency(paidRevenue),
        helper: `${formatCompactNumber(allRecords.length)} paid records on file`
      },
      {
        label: "Settled revenue",
        value: formatCurrency(settledRevenue),
        helper: "Payments already receipted or released"
      },
      {
        label: "Unsettled revenue",
        value: formatCurrency(paidRevenue - settledRevenue),
        helper: "Paid bookings still waiting for settlement"
      },
      {
          label: "Average booking value",
          value: formatCurrency(averageBookingValue),
          helper: `${formatCompactNumber(paidPayments.length)} paid payments checked`
        }
    ],
    bookingMetrics: [
      {
        label: "Confirmed bookings",
        value: formatCompactNumber(confirmedBookings),
        helper: "Paid and awaiting trip completion"
      },
      {
        label: "Completed trips",
        value: formatCompactNumber(completedTrips),
        helper: "Finished bookings marked by staff"
      },
      {
        label: "Pending payments",
        value: formatCompactNumber(pendingPayments),
        helper: "Created bookings still awaiting payment"
      },
      {
        label: "Cancelled bookings",
        value: formatCompactNumber(cancelledBookings),
        helper: "Failed, expired, or manually cancelled records"
      }
      ],
      listings: (listings ?? []) as Destination[],
      staff: staff as AdminDashboardData["staff"],
      tourists: (tourists ?? []) as AdminDashboardData["tourists"],
      bookingActivity: (bookings ?? []) as AdminDashboardData["bookingActivity"],
      destinationRevenue,
      financialRecords: visibleRecords,
      archivedFinancialRecordCount:
      archivedFinancialRecordCountError ? 0 : archivedFinancialRecordCount ?? 0,
      bookingActivitySeries: buildBookingActivitySeries(bookings ?? []),
  };
}
function computeTrend(current: number, previous: number): DashboardMetricTrend {
  if (previous === 0 && current === 0) {
    return { direction: "neutral", label: "0%" };
  }
  if (previous === 0) {
    return { direction: "up", label: "new" };
  }
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.05) {
    return { direction: "neutral", label: "0%" };
  }
  return {
    direction: change > 0 ? "up" : "down",
    label: `${Math.abs(change).toFixed(1)}%`
  };
}

function trendHelperText(trend: DashboardMetricTrend) {
  return trend.direction === "neutral" ? "No change vs previous period" : "vs previous period";
}

export async function getAdminOverviewMetrics(range: {
  from?: string;
  to?: string;
}): Promise<DashboardMetric[]> {
  const fallback = (): DashboardMetric[] => [
    { label: "Total Bookings", value: "0", helper: "Supabase service role not configured" },
    { label: "Total Tourists", value: "0", helper: "Supabase service role not configured" },
    { label: "Destinations", value: "0", helper: "Supabase service role not configured" },
    { label: "Staff Accounts", value: "0", helper: "Supabase service role not configured" },
    { label: "Total Revenue", value: formatCurrency(0), helper: "Supabase service role not configured" }
  ];

  if (!hasSupabaseServiceEnv()) {
    return fallback();
  }

  const supabase = createAdminSupabaseClient();
  const hasRange = Boolean(range.from && range.to);

  let bookingsCurrent = 0;
  let bookingsPrevious = 0;
  let touristsCurrent = 0;
  let touristsPrevious = 0;
  let destinationsCurrent = 0;
  let destinationsPrevious = 0;
  let staffCurrent = 0;
  let staffPrevious = 0;
  let revenueCurrent = 0;
  let revenuePrevious = 0;

  if (hasRange) {
    const fromDate = new Date(`${range.from}T00:00:00`);
    const toDate = new Date(`${range.to}T23:59:59.999`);
    const periodMs = Math.max(toDate.getTime() - fromDate.getTime(), 0);
    const previousTo = new Date(fromDate.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - periodMs);

    const fromISO = fromDate.toISOString();
    const toISO = toDate.toISOString();
    const previousFromISO = previousFrom.toISOString();
    const previousToISO = previousTo.toISOString();

    const [
      bookingsCurrentRes,
      bookingsPreviousRes,
      touristsCurrentRes,
      touristsPreviousRes,
      destinationsCurrentRes,
      destinationsPreviousRes,
      staffCurrentRes,
      staffPreviousRes,
      revenueCurrentRes,
      revenuePreviousRes
    ] = await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
      supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", previousFromISO).lte("created_at", previousToISO),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "user").lte("created_at", toISO),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "user").lte("created_at", fromISO),
      supabase.from("destinations").select("id", { count: "exact", head: true }).lte("created_at", toISO),
      supabase.from("destinations").select("id", { count: "exact", head: true }).lte("created_at", fromISO),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "staff").is("archived_at", null).lte("created_at", toISO),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "staff").is("archived_at", null).lte("created_at", fromISO),
      supabase.from("financial_records").select("amount").gte("paid_at", fromISO).lte("paid_at", toISO),
      supabase.from("financial_records").select("amount").gte("paid_at", previousFromISO).lte("paid_at", previousToISO)
    ]);

    const allResponses = [
      bookingsCurrentRes,
      bookingsPreviousRes,
      touristsCurrentRes,
      touristsPreviousRes,
      destinationsCurrentRes,
      destinationsPreviousRes,
      staffCurrentRes,
      staffPreviousRes,
      revenueCurrentRes,
      revenuePreviousRes
    ];
    const firstError = allResponses.find((res) => res.error)?.error;
    if (firstError) {
      throw new Error(firstError.message ?? "Unable to load admin overview metrics.");
    }

    bookingsCurrent = bookingsCurrentRes.count ?? 0;
    bookingsPrevious = bookingsPreviousRes.count ?? 0;
    touristsCurrent = touristsCurrentRes.count ?? 0;
    touristsPrevious = touristsPreviousRes.count ?? 0;
    destinationsCurrent = destinationsCurrentRes.count ?? 0;
    destinationsPrevious = destinationsPreviousRes.count ?? 0;
    staffCurrent = staffCurrentRes.count ?? 0;
    staffPrevious = staffPreviousRes.count ?? 0;
    revenueCurrent = (revenueCurrentRes.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    revenuePrevious = (revenuePreviousRes.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  } else {
    const [
      bookingsRes,
      touristsRes,
      destinationsRes,
      staffRes,
      revenueRes
    ] = await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "user"),
      supabase.from("destinations").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "staff").is("archived_at", null),
      supabase.from("financial_records").select("amount").is("purged_at", null)
    ]);

    const allResponses = [bookingsRes, touristsRes, destinationsRes, staffRes, revenueRes];
    const firstError = allResponses.find((res) => res.error)?.error;
    if (firstError) {
      throw new Error(firstError.message ?? "Unable to load admin overview metrics.");
    }

    bookingsCurrent = bookingsRes.count ?? 0;
    touristsCurrent = touristsRes.count ?? 0;
    destinationsCurrent = destinationsRes.count ?? 0;
    staffCurrent = staffRes.count ?? 0;
    revenueCurrent = (revenueRes.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  }

  const bookingsTrend = hasRange ? computeTrend(bookingsCurrent, bookingsPrevious) : { direction: "neutral" as const, value: 0, label: "neutral" };
  const touristsTrend = hasRange ? computeTrend(touristsCurrent, touristsPrevious) : { direction: "neutral" as const, value: 0, label: "neutral" };
  const destinationsTrend = hasRange ? computeTrend(destinationsCurrent, destinationsPrevious) : { direction: "neutral" as const, value: 0, label: "neutral" };
  const staffTrend = hasRange ? computeTrend(staffCurrent, staffPrevious) : { direction: "neutral" as const, value: 0, label: "neutral" };
  const revenueTrend = hasRange ? computeTrend(revenueCurrent, revenuePrevious) : { direction: "neutral" as const, value: 0, label: "neutral" };

  return [
    {
      label: "Total Bookings",
      value: formatCompactNumber(bookingsCurrent),
      helper: hasRange ? trendHelperText(bookingsTrend) : "All time",
      trend: bookingsTrend
    },
    {
      label: "Total Tourists",
      value: formatCompactNumber(touristsCurrent),
      helper: hasRange ? trendHelperText(touristsTrend) : "All time",
      trend: touristsTrend
    },
    {
      label: "Destinations",
      value: formatCompactNumber(destinationsCurrent),
      helper: hasRange ? trendHelperText(destinationsTrend) : "All time",
      trend: destinationsTrend
    },
    {
      label: "Staff Accounts",
      value: formatCompactNumber(staffCurrent),
      helper: hasRange ? trendHelperText(staffTrend) : "All time",
      trend: staffTrend
    },
    {
      label: "Total Revenue",
      value: formatCurrency(revenueCurrent),
      helper: hasRange ? trendHelperText(revenueTrend) : "All time",
      trend: revenueTrend
    }
  ];
}
export async function getAdminFinancialRecordById(id: string) {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const { data, error } = await getFinancialRecordById(id);

  if (error) {
    throw new Error(error.message);
  }

  const record = (data as FinancialRecord | null) ?? null;

  if (!record) {
    return null;
  }

  const [hydrated] = await attachFinancialBookingSnapshots([record]);
  return hydrated ?? null;
}

export async function getArchivedAdminFinancialRecords() {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  await archiveSettledFinancialRecords();

  const { data, error } = await getArchivedFinancialRecords();

  if (error) {
    throw new Error(error.message);
  }

  return attachFinancialBookingSnapshots((data ?? []) as FinancialRecord[]);
}

export async function getAdminFinancialFormOptions(): Promise<{
  destinations: AdminFinancialDestinationOption[];
  tourists: AdminFinancialTouristOption[];
}> {
  if (!hasSupabaseServiceEnv()) {
    return {
      destinations: [],
      tourists: []
    };
  }

  const supabase = createAdminSupabaseClient();
  const [{ data: destinations, error: destinationsError }, { data: tourists, error: touristsError }] =
    await Promise.all([
      supabase
        .from("destinations")
        .select("id, title, location_text, category, staff_id")
        .neq("status", "archived")
        .order("title", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "user")
        .order("email", { ascending: true })
    ]);

  if (destinationsError || touristsError) {
    throw new Error(
      destinationsError?.message ??
        touristsError?.message ??
        "Unable to load financial form options."
    );
  }

  return {
    destinations: (destinations ?? []) as AdminFinancialDestinationOption[],
    tourists: (tourists ?? []) as AdminFinancialTouristOption[]
  };
}

export async function getBookingsForUser(userId: string) {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  await releaseExpiredSlotLocks();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, destination:destinations(*), payment:payments(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const bookings = (data ?? []) as Booking[];
  const didSync = await syncBookingPaymentStates(bookings);

  if (didSync) {
    const { data: refreshedData, error: refreshedError } = await supabase
      .from("bookings")
      .select("*, destination:destinations(*), payment:payments(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (refreshedError) {
      throw new Error(refreshedError.message);
    }

    return hydrateUserBookings((refreshedData ?? []) as Booking[]);
  }

  return hydrateUserBookings(bookings);
}

export async function getBookingForUserById(userId: string, bookingId: string) {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  await releaseExpiredSlotLocks();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, destination:destinations(*), payment:payments(*)")
    .eq("user_id", userId)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const singleBooking = data as Booking;
  const didSync = await syncBookingPaymentStates([singleBooking]);

  if (didSync) {
    const { data: refreshedData, error: refreshedError } = await supabase
      .from("bookings")
      .select("*, destination:destinations(*), payment:payments(*)")
      .eq("user_id", userId)
      .eq("id", bookingId)
      .maybeSingle();

    if (refreshedError) {
      throw new Error(refreshedError.message);
    }

    if (!refreshedData) {
      return null;
    }

    const [booking] = await hydrateUserBookings([refreshedData as Booking]);
    return booking ?? null;
  }

  const [booking] = await hydrateUserBookings([singleBooking]);
  return booking ?? null;
}

export async function getProfileBundle(userId: string): Promise<ProfileBundle | null> {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*, staff_profile:staff_profiles(*)")
    .eq("id", userId)
    .maybeSingle<UserWithStaffProfile>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    user: {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      phone: data.phone,
      avatar_url: data.avatar_url,
      avatar_path: data.avatar_path,
      archived_at: data.archived_at,
      created_at: data.created_at,
      updated_at: data.updated_at
    },
    staffProfile: data.staff_profile ?? null
  } as ProfileBundle;
}

export async function getStaffMemberProfile(userId: string) {
  const bundle = await getProfileBundle(userId);

  if (!bundle || bundle.user.role !== "staff") {
    return null;
  }

  return bundle;
}

export async function getStaffAvatar(staffId: string): Promise<string | null> {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", staffId)
    .maybeSingle<{ avatar_url: string | null }>();

  if (error) {
    throw new Error(error.message ?? "Unable to load staff avatar.");
  }

  return data?.avatar_url ?? null;
}

export async function getUserAvatars(
  userIds: string[]
): Promise<Record<string, string | null>> {
  if (!hasSupabaseServiceEnv() || userIds.length === 0) {
    return {};
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, avatar_url")
    .in("id", Array.from(new Set(userIds)));

  if (error) {
    throw new Error(error.message ?? "Unable to load user avatars.");
  }

  return Object.fromEntries(
    (data ?? []).map((row) => [row.id as string, (row.avatar_url as string | null) ?? null])
  );
}