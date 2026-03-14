import { hasPayMongoEnv, hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Booking, Destination, FinancialRecordSummary, PaymentStatus, ProfileBundle } from "@/lib/types";
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
  FeedbackEntry,
  FinancialRecord,
  StaffDashboardData,
  UserWithStaffProfile
} from "@/lib/types";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";

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
  records: FinancialRecord[]
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
      unsettled_amount: record.settlement_status === "settled" ? 0 : record.amount
    });
  }

  return Array.from(summaryMap.values()).sort(
    (left, right) => right.total_paid_amount - left.total_paid_amount
  );
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
    .select("*, destination:destinations(*), payment:payments(*)")
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
      .select("*, destination:destinations(*), payment:payments(*)")
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

export async function getStaffDashboardData(staffId: string): Promise<StaffDashboardData> {
  if (!hasSupabaseServiceEnv()) {
    return {
      metrics: [
        {
          label: "Confirmed bookings",
          value: "0",
          helper: "Supabase service role not configured"
        },
        {
          label: "Payout waiting",
          value: formatCurrency(0),
          helper: "Supabase service role not configured"
        }
      ],
      listings: [],
      recentBookings: [],
      feedbackEntries: []
    };
  }

  await releaseExpiredSlotLocks();
  await backfillFinancialRecords();

  const supabase = createAdminSupabaseClient();
  type StaffUnsettledFinancialRow = {
    amount: number | string | null;
    settlement_status: string | null;
  };

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
      .select("*, destination:destinations(*), payment:payments(*)")
      .eq("staff_id", staffId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("bookings")
      .select("status")
      .eq("staff_id", staffId),
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

  const confirmedBookings =
    bookingStatuses?.filter((booking) => booking.status === "confirmed").length ?? 0;
  const pendingPayoutAmount =
    unsettledFinancials?.reduce((sum, record) => sum + Number(record.amount ?? 0), 0) ?? 0;
  const pendingPayoutCount = unsettledFinancials?.length ?? 0;

  const feedbackEntries = await getFeedbackEntriesForStaff(staffId, 6);

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
    feedbackEntries: (feedbackEntries ?? []) as FeedbackEntry[]
  };
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
          label: "Assigned destinations",
          value: "0",
          helper: "Supabase service role not configured"
        },
        {
          label: "Published destinations",
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
        archivedFinancialRecordCount: 0
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
          .select("user_id, status")
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
  const destinationRevenue = buildDestinationRevenueSummaries(allRecords);

  return {
    metrics: [
      {
        label: "Staff accounts",
        value: formatCompactNumber(staff?.length ?? 0),
        helper: "Accounts managed by the tourism office"
      },
      {
        label: "Assigned destinations",
        value: formatCompactNumber(assignedDestinations),
        helper: "Destinations linked to staff accounts"
      },
      {
        label: "Published destinations",
        value: formatCompactNumber(publishedDestinations),
        helper: "Places currently visible to tourists"
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
      archivedFinancialRecordCountError ? 0 : archivedFinancialRecordCount ?? 0
  };
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
        .order("title", { ascending: true }),
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
