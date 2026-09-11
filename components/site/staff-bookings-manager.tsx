"use client";

import { useEffect, useMemo,useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Check,
  X,
  ImageOff,
  UserRound,
  Mail,
  Phone,
  MapPin,
  CalendarCheck2,
  AlertTriangle,
  ArrowLeft,
  MoreVertical,
  ChevronDown,
  Receipt,
  CreditCard,
  CircleDollarSign,
  Calendar,
  HandCoins
} from "lucide-react";

import { CompleteBookingButton } from "@/components/forms/complete-booking-button";
import { DeleteBookingButton } from "@/components/forms/delete-booking-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { isBookingTicketExpired } from "@/lib/booking-state";
import { getBookingGuestTickets } from "@/lib/guest-tickets";
import type { Booking } from "@/lib/types";
import { cn, formatCurrency, formatPesoCurrency, pesoAmountToCentavos } from "@/lib/utils";

const ITEMS_PER_PAGE = 7;

const todayString = (() => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
})();

type Tab = "all" | "awaiting_confirmation" | "pending_payment" | "confirmed" | "awaiting_onsite_payment" | "completed" | "declined" | "cancelled";

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting_confirmation", label: "Awaiting review" },
  { value: "pending_payment", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "awaiting_onsite_payment", label: "Onsite" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" }
];

function statusStyle(status: string): { label: string; className: string } {
  switch (status) {
    case "confirmed":
      return { label: "Confirmed", className: "border-blue-200 bg-blue-50 text-blue-700" };
    case "completed":
      return { label: "Completed", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    case "pending_payment":
      return { label: "Pending", className: "border-yellow-200 bg-yellow-50 text-yellow-700" };
    case "awaiting_confirmation":
      return { label: "Awaiting review", className: "border-yellow-200 bg-yellow-50 text-yellow-700" };
    case "awaiting_onsite_payment":
      return { label: "Onsite payment", className: "border-amber-200 bg-amber-50 text-amber-700" };
    case "declined":
      return { label: "Declined", className: "border-rose-200 bg-rose-50 text-rose-700" };
    case "cancelled":
      return { label: "Declined", className: "border-rose-200 bg-rose-50 text-rose-700" };
    default:
      return { label: status, className: "border-slate-200 bg-slate-100 text-slate-600" };
  }
}

function StatusPill({ status }: { status: string }) {
  const { label, className } = statusStyle(status);
  return (
    <span className={cn("inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold", className)}>
      {label}
    </span>
  );
}

function formatBookingDateTime(iso: string) {
  const date = new Date(iso);
  return {
    date: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  };
}

export function StaffBookingsManager({
  bookings,
  destinationCoverByDestinationId = {},
  serviceImagesByServiceId = {},
  touristAvatarsByUserId = {}
}: {
  bookings: Booking[];
  destinationCoverByDestinationId?: Record<string, string | null>;
  serviceImagesByServiceId?: Record<string, string | null>;
  touristAvatarsByUserId?: Record<string, string | null>;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [remarksDraft, setRemarksDraft] = useState("");
  const [staffActionPending, setStaffActionPending] = useState<"confirm" | "decline" | null>(null);
  const [staffActionError, setStaffActionError] = useState<string | null>(null);
  const [staffActionSuccess, setStaffActionSuccess] = useState<string | null>(null);
  const [staffActionMessageOpen, setStaffActionMessageOpen] = useState(false);
  const [onsitePaymentOpen, setOnsitePaymentOpen] = useState(false);
  const [onsitePaymentSuccessOpen, setOnsitePaymentSuccessOpen] = useState(false);
  const [onsiteReceiptCode, setOnsiteReceiptCode] = useState("");
  const [onsiteAmount, setOnsiteAmount] = useState("");
  const [onsitePaymentNotes, setOnsitePaymentNotes] = useState("");
  const [onsitePaymentPending, setOnsitePaymentPending] = useState(false);
  const [onsitePaymentError, setOnsitePaymentError] = useState<string | null>(null);
  const [bulkPending, setBulkPending] = useState<"confirm" | "decline" | "delete" | null>(null);
  const [bulkDialogMode, setBulkDialogMode] = useState<"confirm" | "decline" | "delete" | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const bulkMenuRef = useRef<HTMLDivElement | null>(null);
  const [tabDropdownOpen, setTabDropdownOpen] = useState(false);
  const tabDropdownRef = useRef<HTMLDivElement | null>(null);
  const [resendEmailPending, setResendEmailPending] = useState(false);
  const [resendEmailError, setResendEmailError] = useState<string | null>(null);
  const [resendEmailSuccess, setResendEmailSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!bulkMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(event.target as Node)) {
        setBulkMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [bulkMenuOpen]);

  useEffect(() => {
    if (!tabDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (tabDropdownRef.current && !tabDropdownRef.current.contains(event.target as Node)) {
        setTabDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tabDropdownOpen]);

  useEffect(() => {
    if (!staffActionSuccess) return;
    const timer = setTimeout(() => setStaffActionSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [staffActionSuccess]);

  useEffect(() => {
    if (!resendEmailSuccess) return;
    const timer = setTimeout(() => setResendEmailSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [resendEmailSuccess]);
  const duplicateBookingIds = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;
      const key = `${booking.user_id}::${booking.service_id}::${booking.service_date}`;
      groups.set(key, [...(groups.get(key) ?? []), booking.id]);
    }
    const flagged = new Set<string>();
    for (const ids of groups.values()) {
      if (ids.length > 1) ids.forEach((id) => flagged.add(id));
    }
    return flagged;
  }, [bookings]);

  const tabCounts = useMemo(
    () => ({
      all: bookings.length,
      awaiting_confirmation: bookings.filter((b) => b.status === "awaiting_confirmation").length,
      pending_payment: bookings.filter((b) => b.status === "pending_payment").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      awaiting_onsite_payment: bookings.filter((b) => b.payment_mode === "onsite").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      declined: bookings.filter((b) => b.status === "declined").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length
    }),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "awaiting_onsite_payment"
          ? booking.payment_mode === "onsite"
          : booking.status === activeTab);
      if (!matchesTab) return false;
      if (!normalized) return true;

      const guestTickets = getBookingGuestTickets(booking);
      const guestNames = guestTickets.map((t) => t.name.toLowerCase());
      return (
        booking.contact_name.toLowerCase().includes(normalized) ||
        booking.contact_email.toLowerCase().includes(normalized) ||
        booking.contact_phone.toLowerCase().includes(normalized) ||
        booking.ticket_code?.toLowerCase().includes(normalized) ||
        guestNames.some((name) => name.includes(normalized))
      );
    });
  }, [bookings, query, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setCurrentPage(1);
  }

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) ?? null;

  function openBooking(booking: Booking) {
    setSelectedBookingId(booking.id);
    setRemarksDraft("");
    setStaffActionError(null);
    setStaffActionSuccess(null);
    setStaffActionMessageOpen(false);
    setOnsitePaymentOpen(false);
    setOnsiteReceiptCode(booking.onsite_receipt?.receipt_code ?? "");
    setOnsiteAmount((booking.total_amount / 100).toFixed(2));
    setOnsitePaymentNotes("");
    setOnsitePaymentError(null);
  }

  function closeBooking() {
    setSelectedBookingId(null);
  }

  async function handleOnsitePayment() {
    if (!selectedBooking) return;
    setOnsitePaymentPending(true);
    setOnsitePaymentError(null);

    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}/onsite-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: pesoAmountToCentavos(onsiteAmount),
          receiptCode: onsiteReceiptCode,
          notes: onsitePaymentNotes
        })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to record onsite payment.");
      setOnsitePaymentOpen(false);
      setOnsitePaymentSuccessOpen(true);
      router.refresh();
    } catch (error) {
      setOnsitePaymentError(error instanceof Error ? error.message : "Unable to record onsite payment.");
    } finally {
      setOnsitePaymentPending(false);
    }
  }

  // Lock body scroll when the mobile detail overlay is open
  useEffect(() => {
    if (selectedBookingId) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [selectedBookingId]);

  function toggleRowSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  }

  const shownIds = paginatedBookings.map((b) => b.id);
  const allShownSelected = shownIds.length > 0 && shownIds.every((id) => selectedIds.includes(id));

  function toggleSelectAllShown() {
    setSelectedIds((current) =>
      allShownSelected
        ? current.filter((id) => !shownIds.includes(id))
        : Array.from(new Set([...current, ...shownIds]))
    );
  }

  async function handleStaffAction(action: "confirm" | "decline") {
    if (!selectedBooking) return;
    setStaffActionError(null);
    setStaffActionSuccess(null);
    setStaffActionPending(action);

    try {
      const response = await fetch(
        action === "confirm"
          ? `/api/bookings/${selectedBooking.id}/confirm`
          : `/api/bookings/${selectedBooking.id}/decline`,
        {
          method: "POST",
          ...(action === "decline"
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ declineReason: remarksDraft })
              }
            : {})
        }
      );
      const body = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(
          body.error ?? (action === "confirm" ? "Unable to confirm the reservation." : "Unable to decline the reservation.")
        );
      }

      const message = action === "confirm" ? "Reservation confirmed." : "Reservation declined.";
      setStaffActionSuccess(message);
      setStaffActionMessageOpen(true);
    } catch (err) {
      setStaffActionError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStaffActionPending(null);
    }
  }

  async function handleResendEmail() {
    if (!selectedBooking) return;
    setResendEmailPending(true);
    setResendEmailError(null);
    setResendEmailSuccess(null);
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}/resend-email`, {
        method: "POST"
      });
      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to resend booking email.");
      setResendEmailSuccess(body.message ?? "Booking email resent.");
    } catch (err) {
      setResendEmailError(err instanceof Error ? err.message : "Unable to resend booking email.");
    } finally {
      setResendEmailPending(false);
    }
  }

  function closeStaffActionMessage() {
    setStaffActionMessageOpen(false);
    setSelectedBookingId(null);
    router.refresh();
  }

  const bulkConfirmIds = selectedIds.filter(
    (id) => {
      const status = bookings.find((b) => b.id === id)?.status;
      return status === "pending_payment" || status === "awaiting_confirmation";
    }
  );
  const bulkDeclineIds = selectedIds.filter((id) => {
    const status = bookings.find((b) => b.id === id)?.status;
    return status === "pending_payment" || status === "awaiting_confirmation" || status === "confirmed";
  });
  const bulkDeleteIds = selectedIds.filter((id) => {
    const status = bookings.find((b) => b.id === id)?.status;
    return status === "cancelled" || status === "completed";
  });

  async function runBulkAction(mode: "confirm" | "decline" | "delete") {
    setBulkError(null);

    if (mode === "delete") {
      if (bulkDeleteIds.length === 0) {
        setBulkError("Select cancelled or completed bookings to delete.");
        return;
      }
      setBulkPending("delete");
      try {
        const response = await fetch("/api/staff/bookings/batch-delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingIds: bulkDeleteIds })
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to delete the selected bookings.");
        setSelectedIds([]);
        router.refresh();
      } catch (err) {
        setBulkError(err instanceof Error ? err.message : "Unable to delete the selected bookings.");
      } finally {
        setBulkPending(null);
      }
      return;
    }

    const targetIds = mode === "confirm" ? bulkConfirmIds : bulkDeclineIds;
    if (targetIds.length === 0) {
      setBulkError(
        mode === "confirm"
          ? "Select pending reservations to confirm."
          : "Select pending or confirmed reservations to decline."
      );
      return;
    }

    setBulkPending(mode);
    try {
      const results = await Promise.all(
        targetIds.map((id) =>
          fetch(mode === "confirm" ? `/api/bookings/${id}/confirm` : `/api/bookings/${id}/decline`, {
            method: "POST",
            ...(mode === "decline"
              ? {
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ declineReason: "Declined during bulk review." })
                }
              : {})
          })
        )
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        setBulkError(`${failed} of ${targetIds.length} reservations could not be updated.`);
      }
      setSelectedIds([]);
      router.refresh();
    } catch {
      setBulkError("Unable to complete the bulk action.");
    } finally {
      setBulkPending(null);
    }
  }

  const [expandGuests, setExpandGuests] = useState(false);
  const [visitPending, setVisitPending] = useState<Record<string, "check_in" | "check_out" | null>>({});
  const [visitError, setVisitError] = useState<Record<string, string | null>>({});

  async function handleGuestVisitAction(bookingId: string, guestNumber: number, action: "check_in" | "check_out") {
    const key = `${bookingId}-${guestNumber}`;
    setVisitPending((prev) => ({ ...prev, [key]: action }));
    setVisitError((prev) => ({ ...prev, [key]: null }));
    try {
      const response = await fetch(`/api/staff/bookings/${bookingId}/guests/${guestNumber}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Failed to update visit status.");
      router.refresh();
    } catch (err) {
      setVisitError((prev) => ({ ...prev, [key]: err instanceof Error ? err.message : "Failed to update status." }));
    } finally {
      setVisitPending((prev) => ({ ...prev, [key]: null }));
    }
  }

  const detailContent = selectedBooking ? (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Reservation details</h3>
        <StatusPill status={selectedBooking.status} />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-slate-100">
          {(selectedBooking.service_id && serviceImagesByServiceId[selectedBooking.service_id]) ||
          destinationCoverByDestinationId[selectedBooking.destination_id] ? (
            <img
              src={
                (selectedBooking.service_id && serviceImagesByServiceId[selectedBooking.service_id]) ||
                destinationCoverByDestinationId[selectedBooking.destination_id] ||
                undefined
              }
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <ImageOff className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">
            {selectedBooking.ticket_code ?? selectedBooking.id.slice(0, 8)}
          </p>
          <p className="truncate text-sm text-slate-600">
            {selectedBooking.destination_snapshot.title}
            {selectedBooking.service_snapshot?.title ? ` (${selectedBooking.service_snapshot.title})` : ""}
          </p>
          <p className="text-xs text-slate-400">
            {formatBookingDateTime(selectedBooking.service_date).date} &bull;{" "}
            {formatBookingDateTime(selectedBooking.service_date).time}
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Guest information</p>
        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <dd className="min-w-0 break-words text-slate-700">{selectedBooking.contact_name}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <dd className="min-w-0 break-all text-slate-700">{selectedBooking.contact_email}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <dd className="min-w-0 break-words text-slate-700">{selectedBooking.contact_phone}</dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <dd className="text-slate-400">Not provided</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Booking information</p>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-slate-500">No. of Pax</dt>
            <dd className="text-right text-slate-800">{selectedBooking.guest_count} guests</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-slate-500">Add-ons</dt>
            <dd className="text-right text-slate-800">
              {selectedBooking.service_snapshot?.additional_services?.length
                ? selectedBooking.service_snapshot.additional_services.map((addon) => addon.title).join(", ")
                : "None"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-slate-500">Special request</dt>
            <dd className="text-right text-slate-800">{selectedBooking.notes || "None specified"}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment information</p>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Payment method</dt>
            <dd className="text-slate-800">{selectedBooking.payment?.payment_method_type ?? "Not set"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Payment status</dt>
            <dd className="text-slate-800 capitalize">{selectedBooking.payment?.status ?? "pending"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Amount</dt>
            <dd className="font-semibold text-slate-800">{formatCurrency(selectedBooking.total_amount)}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={handleResendEmail}
          disabled={resendEmailPending}
          className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <Mail className="h-3.5 w-3.5" />
          {resendEmailPending ? "Sending..." : "Resend email"}
        </button>
        {resendEmailError ? <p className="mt-1 text-xs text-destructive">{resendEmailError}</p> : null}
        {resendEmailSuccess ? <p className="mt-1 text-xs text-emerald-700">{resendEmailSuccess}</p> : null}
      </div>

      {selectedBooking.ticket_code ? (
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setExpandGuests((v) => !v)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {expandGuests ? "Hide guest passes" : "Show guest passes"}
          </button>
          {expandGuests ? (
            <div className="mt-3 space-y-2">
              {getBookingGuestTickets(selectedBooking).map((guest) => {
                const visit = selectedBooking.visits?.find((v) => v.guest_number === guest.guestNumber) ?? null;
                const key = `${selectedBooking.id}-${guest.guestNumber}`;
                const pending = visitPending[key] ?? null;
                const err = visitError[key] ?? null;
                const isToday = selectedBooking.service_date === todayString;
                return (
                  <div key={guest.guestNumber} className="rounded-sm border border-slate-200 p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate font-medium text-slate-800">{guest.name}</p>
                      <Badge variant={guest.type === "child" ? "muted" : "default"} className="shrink-0 text-[10px]">
                        {guest.type}
                      </Badge>
                    </div>
                    {err ? <p className="mt-1 text-destructive">{err}</p> : null}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-slate-500">
                        {!visit?.checked_in_at
                          ? "Not checked in"
                          : !visit?.checked_out_at
                            ? "Checked in"
                            : "Checked out"}
                      </span>
                      {!visit?.checked_in_at ? (
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 rounded-sm px-2 text-xs"
                          disabled={pending !== null || !isToday}
                          onClick={() => handleGuestVisitAction(selectedBooking.id, guest.guestNumber, "check_in")}
                        >
                          <LogIn className="h-3 w-3" /> Check in
                        </Button>
                      ) : !visit?.checked_out_at ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 rounded-sm px-2 text-xs"
                          disabled={pending !== null || !isToday}
                          onClick={() => handleGuestVisitAction(selectedBooking.id, guest.guestNumber, "check_out")}
                        >
                          <LogOut className="h-3 w-3" /> Check out
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Staff action</p>

        {selectedBooking.status === "pending_payment" || selectedBooking.status === "awaiting_confirmation" ? (
          <>
            <p className="text-xs text-slate-500">Please review the reservation and take action.</p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                className="w-full rounded-sm"
                disabled={staffActionPending !== null}
                onClick={() => handleStaffAction("confirm")}
              >
                <Check className="h-4 w-4" />
                {staffActionPending === "confirm" ? "Confirming..." : "Confirm Reservation"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full rounded-sm"
                disabled={staffActionPending !== null}
                onClick={() => handleStaffAction("decline")}
              >
                <X className="h-4 w-4" />
                {staffActionPending === "decline" ? "Declining..." : "Decline Reservation"}
              </Button>
            </div>
            {staffActionError ? <p className="text-xs text-destructive">{staffActionError}</p> : null}
            {staffActionSuccess ? <p className="text-xs text-emerald-700">{staffActionSuccess}</p> : null}

            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Remarks (optional)</span>
              <Textarea
                value={remarksDraft}
                onChange={(event) => setRemarksDraft(event.target.value)}
                placeholder="Write your remarks here..."
                className="h-16 resize-none rounded-sm text-sm"
              />
              <span className="text-[11px] text-slate-400">
                This note is for your own reference while reviewing — it won&apos;t be saved once you leave this page.
              </span>
            </label>
          </>
        ) : selectedBooking.status === "confirmed" || selectedBooking.status === "awaiting_onsite_payment" ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              {selectedBooking.status === "awaiting_onsite_payment"
                ? "Confirm the tourist&apos;s receipt before recording the cash payment."
                : "This reservation is confirmed."}
            </p>
            {selectedBooking.status === "awaiting_onsite_payment" ? (
              <Button
                type="button"
                className="w-full rounded-sm"
                onClick={() => setOnsitePaymentOpen(true)}
                disabled={staffActionPending !== null}
              >
                Record cash payment
              </Button>
            ) : !isBookingTicketExpired(selectedBooking) ? (
              <div className="[&>div]:w-full [&_button]:w-full [&_button]:rounded-sm">
                <CompleteBookingButton bookingId={selectedBooking.id} />
              </div>
            ) : (
              <p className="text-xs text-slate-500">The visit date has passed; this pass is now expired.</p>
            )}
          </div>
        ) : selectedBooking.status === "cancelled" || selectedBooking.status === "declined" || selectedBooking.status === "completed" ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              This reservation is {statusStyle(selectedBooking.status).label.toLowerCase()}.
            </p>
            <DeleteBookingButton
              bookingId={selectedBooking.id}
              className="w-full justify-center rounded-sm"
              confirmMessage="Delete this booking record? This cannot be undone."
            />
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),380px]">
      {/* LEFT: list */}
      <div className="rounded-sm border border-slate-200 bg-white">
        <div className="space-y-4 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            Reservations
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Manage reservations</h2>
            <p className="mt-1 text-sm text-slate-500">Review, confirm, or decline incoming reservations.</p>
          </div>

          <div ref={tabDropdownRef} className="relative inline-block">
            <button
              type="button"
              onClick={() => setTabDropdownOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-sm border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                "border-emerald-700 bg-emerald-50 text-emerald-700"
              )}
            >
              {TABS.find((tab) => tab.value === activeTab)?.label} {tabCounts[activeTab === "all" ? "all" : activeTab]}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {tabDropdownOpen ? (
              <div className="absolute left-0 top-[calc(100%+0.35rem)] z-20 w-48 overflow-hidden rounded-sm border border-slate-200 bg-white shadow-lg">
                {TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      switchTab(tab.value);
                      setTabDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium transition-colors",
                      activeTab === tab.value
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn("rounded-sm px-1.5 py-0.5 text-[10px]", activeTab === tab.value ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                      {tabCounts[tab.value === "all" ? "all" : tab.value]}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <label className="relative block w-full">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              aria-label="Search bookings"
              className="h-9 w-full rounded-sm pl-8 text-sm"
            />
          </label>

          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-xs text-slate-500">{selectedIds.length} selected</p>

              <div ref={bulkMenuRef} className="relative ml-auto">
                <button
                  type="button"
                  onClick={() => setBulkMenuOpen((v) => !v)}
                  disabled={bulkPending !== null}
                  className="flex h-8 items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Actions
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>

                {bulkMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.35rem)] z-20 w-44 overflow-hidden rounded-sm border border-slate-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setBulkMenuOpen(false);
                        setBulkDialogMode("confirm");
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Confirm selected
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkMenuOpen(false);
                        setBulkDialogMode("decline");
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Decline selected
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkMenuOpen(false);
                        setBulkDialogMode("delete");
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-destructive hover:bg-destructive/8"
                    >
                      Delete selected
                    </button>
                    <div className="border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setBulkMenuOpen(false);
                        setSelectedIds([]);
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-500 hover:bg-slate-50"
                    >
                      Clear selection
                    </button>
                  </div>
                ) : null}
              </div>

              {bulkError ? <p className="w-full text-xs text-destructive">{bulkError}</p> : null}
            </div>
          ) : null}
        </div>

        {bookings.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No bookings have been received yet.</p>
        ) : filteredBookings.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No reservations match this filter.</p>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="w-7 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allShownSelected}
                        onChange={toggleSelectAllShown}
                        className="h-3.5 w-3.5 rounded-sm border-slate-300"
                        aria-label="Select all shown"
                      />
                    </th>
                    <th className="px-2 py-3 font-medium">Reservation ID</th>
                    <th className="px-2 py-3 font-medium">Guest</th>
                    <th className="px-2 py-3 font-medium">Service / Package</th>
                    <th className="px-2 py-3 font-medium">Date</th>
                    <th className="px-2 py-3 font-medium">Pax</th>
                    <th className="px-2 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map((booking) => {
                    const { date } = formatBookingDateTime(booking.service_date);
                    const isSelected = booking.id === selectedBookingId;
                    return (
                      <tr
                        key={booking.id}
                        onClick={() => openBooking(booking)}
                        className={cn(
                          "cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50",
                          isSelected && "bg-emerald-50/60"
                        )}
                      >
                        <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(booking.id)}
                            onChange={() => toggleRowSelection(booking.id)}
                            className="h-3.5 w-3.5 rounded-sm border-slate-300"
                            aria-label={`Select ${booking.id}`}
                          />
                        </td>
                        <td className="px-2 py-3 font-semibold text-emerald-700">
                          {booking.ticket_code ?? booking.id.slice(0, 8)}
                          {duplicateBookingIds.has(booking.id) ? (
                            <AlertTriangle className="ml-1 inline h-3 w-3 text-amber-600" />
                          ) : null}
                        </td>
                        <td className="px-2 py-3 text-slate-700">{booking.contact_name}</td>
                        <td className="px-2 py-3 text-slate-700">
                          {booking.destination_snapshot.title}
                          <p className="text-slate-400">
                            {booking.service_snapshot?.title ?? "Standard service"}
                          </p>
                        </td>
                        <td className="px-2 py-3 text-slate-700">
                          {date}
                          <p className="text-xs capitalize text-slate-400">{booking.payment_mode}</p>
                        </td>
                        <td className="px-2 py-3 text-slate-700">{booking.guest_count}</td>
                        <td className="px-2 py-3">
                          <StatusPill status={booking.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedBookings.map((booking) => {
                const { date } = formatBookingDateTime(booking.service_date);
                const isSelected = booking.id === selectedBookingId;
                return (
                  <div
                    key={booking.id}
                    onClick={() => openBooking(booking)}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 p-4 active:bg-slate-50",
                      isSelected && "bg-emerald-50/60"
                    )}
                  >
                    <div className="pt-0.5" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(booking.id)}
                        onChange={() => toggleRowSelection(booking.id)}
                        className="h-4 w-4 rounded-sm border-slate-300"
                        aria-label={`Select ${booking.id}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-emerald-700">
                          {booking.ticket_code ?? booking.id.slice(0, 8)}
                          {duplicateBookingIds.has(booking.id) ? (
                            <AlertTriangle className="ml-1 inline h-3 w-3 text-amber-600" />
                          ) : null}
                        </p>
                        <StatusPill status={booking.status} />
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-slate-800">{booking.contact_name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {booking.destination_snapshot.title}
                        {booking.service_snapshot?.title ? ` · ${booking.service_snapshot.title}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {date} &bull; {booking.guest_count} pax
                      </p>
                      <p className="text-[11px] capitalize text-slate-400">{booking.payment_mode}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-slate-400">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of {filteredBookings.length} entries
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-xs font-semibold",
                      page === currentPage
                        ? "bg-emerald-700 text-white"
                        : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT: detail panel — desktop/tablet inline, mobile full-screen overlay */}
      <div className="hidden h-fit rounded-sm border border-slate-200 bg-white p-5 xl:block">
        {!selectedBooking ? (
          <p className="text-sm text-muted-foreground">Select a reservation to view its details.</p>
        ) : (
          detailContent
        )}
      </div>

      {selectedBooking ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white xl:hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 p-4">
            <button
              type="button"
              onClick={closeBooking}
              aria-label="Back to reservations"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-slate-900">Reservation details</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{detailContent}</div>
        </div>
      ) : null}

      <Modal
        open={onsitePaymentOpen}
        onClose={() => {
          if (!onsitePaymentPending) setOnsitePaymentOpen(false);
        }}
        title="Onsite Payment"
        description="Record the online receipt provided by the guest. This will be added to the onsite payments and viewable under Financials."
        icon={<HandCoins className="h-4.5 w-4.5" />}
        className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl md:max-h-[92vh]"
      >
        {selectedBooking ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-4">
          {/* LEFT COLUMN — wider */}
          <div className="space-y-4 md:col-span-3 md:space-y-3">
            {/* 1. Search Guest */}
            <div className="rounded-md border border-emerald-100 bg-emerald-50/40 p-4 md:p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-900 md:mb-1.5">1. Search Guest</h3>
              <div className="relative mb-2 md:mb-1.5">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={selectedBooking.contact_name}
                  readOnly
                  aria-label="Guest"
                  className="h-9 rounded-sm border-slate-200 bg-white pl-8 pr-8 text-sm text-slate-600 md:h-8"
                />
                <X className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
              </div>
              <div className="rounded-sm border border-emerald-200 bg-emerald-100/50 p-3 md:p-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 md:h-9 md:w-9">
                      <UserRound className="h-5 w-5 md:h-4 md:w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{selectedBooking.contact_name}</p>
                      <p className="truncate text-xs text-slate-500">{selectedBooking.contact_email}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-sm bg-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    Booking #{selectedBooking.ticket_code ?? selectedBooking.id.slice(0, 8)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOnsitePaymentOpen(false)}
                  className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 md:mt-1"
                >
                  View booking details <span className="text-base leading-none">→</span>
                </button>
              </div>
            </div>

            {/* 2. Online Receipt Details */}
            <div className="rounded-md border border-slate-200 bg-white p-4 md:p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-900 md:mb-1.5">2. Online Receipt Details</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-2.5">
                <label className="block space-y-1 md:space-y-0.5">
                  <span className="text-[11px] font-medium text-slate-500">Receipt Number *</span>
                  <div className="relative">
                    <Receipt className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={onsiteReceiptCode}
                      onChange={(event) => setOnsiteReceiptCode(event.target.value)}
                      required
                      className="h-8 rounded-sm pl-8 text-xs"
                    />
                  </div>
                </label>
                <label className="block space-y-1 md:space-y-0.5">
                  <span className="text-[11px] font-medium text-slate-500">Payment Method *</span>
                  <div className="relative">
                    <CreditCard className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input value="Cash" readOnly className="h-8 rounded-sm bg-slate-50 pl-8 text-xs" />
                  </div>
                </label>
                <label className="block space-y-1 md:space-y-0.5">
                  <span className="text-[11px] font-medium text-slate-500">Amount Paid *</span>
                  <div className="relative">
                    <CircleDollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={onsiteAmount}
                      onChange={(event) => setOnsiteAmount(event.target.value)}
                      required
                      className="h-8 rounded-sm pl-8 text-xs"
                    />
                  </div>
                </label>
                <label className="block space-y-1 md:space-y-0.5">
                  <span className="text-[11px] font-medium text-slate-500">Payment Date & Time *</span>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={new Date().toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                      })}
                      readOnly
                      className="h-8 rounded-sm bg-slate-50 pl-8 text-xs"
                    />
                  </div>
                </label>
              </div>

              {/* Notes */}
              <label className="mt-3 block space-y-1 md:mt-2.5 md:space-y-0.5">
                <span className="text-xs font-medium text-slate-600">Notes <span className="font-normal text-muted-foreground">(optional)</span></span>
                <Textarea
                  value={onsitePaymentNotes}
                  onChange={(event) => setOnsitePaymentNotes(event.target.value)}
                  className="min-h-20 resize-y rounded-sm text-sm md:min-h-14"
                />
                <span className="text-[11px] text-slate-400">{onsitePaymentNotes.length}/500</span>
              </label>
            </div>
          </div>

          {/* RIGHT COLUMN — narrower */}
          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/70 p-4 md:col-span-2 md:space-y-2.5 md:p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Booking Summary</h3>
              <span className="rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Confirmed
              </span>
            </div>
            <div className="space-y-1.5 rounded-sm border border-slate-200 bg-white p-3 md:space-y-1 md:p-2.5">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 text-slate-500">Guest Name</span>
                <span className="flex-1 text-center font-medium text-slate-800">{selectedBooking.contact_name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 text-slate-500">Email</span>
                <span className="flex-1 break-all text-center text-slate-800">{selectedBooking.contact_email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 text-slate-500">Contact No.</span>
                <span className="flex-1 text-center text-slate-800">{selectedBooking.contact_phone}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 text-slate-500">Check-in</span>
                <span className="flex-1 text-center text-slate-800">
                  {new Date(selectedBooking.service_date).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 text-slate-500">Check-out</span>
                <span className="flex-1 text-center text-slate-800">
                  {selectedBooking.check_out_date
                    ? new Date(selectedBooking.check_out_date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 text-slate-500">Guests pax</span>
                <span className="flex-1 text-center text-slate-800">{selectedBooking.guest_count}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 text-slate-500">Receipt Code</span>
                <span className="flex-1 text-center text-slate-800">{onsiteReceiptCode || "—"}</span>
              </div>
            </div>

            {/* Room / Accommodation */}
            <div className="border-t border-slate-200 pt-3 md:pt-2.5">
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:mb-1">Room / Accommodation</h4>
              <div className="space-y-1">
                {selectedBooking.service_snapshot && (
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="text-slate-600">
                      {selectedBooking.service_snapshot.title} (x {selectedBooking.guest_count})
                    </span>
                    <span className="text-right text-slate-800">
                      {formatPesoCurrency(selectedBooking.service_snapshot.price_amount)}
                    </span>
                  </div>
                )}
                {selectedBooking.service_snapshot?.entrance_fee?.is_active && (
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="text-slate-600">
                      {selectedBooking.service_snapshot.entrance_fee.title} (₱{selectedBooking.service_snapshot.entrance_fee.price_amount} x {selectedBooking.service_snapshot.entrance_fee.guest_count} guest{selectedBooking.service_snapshot.entrance_fee.guest_count !== 1 ? 's' : ''})
                    </span>
                    <span className="text-right text-slate-800">
                      {formatPesoCurrency(selectedBooking.service_snapshot.entrance_fee.price_amount * selectedBooking.service_snapshot.entrance_fee.guest_count)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Amount */}
            <div className="space-y-1.5 md:space-y-1">
              <div className="flex justify-between gap-3 border-t border-slate-200 pt-1.5 text-sm md:pt-1 mb-8">
                <span className="font-semibold text-slate-900">Total Amount</span>
                <span className="font-bold text-emerald-700">{formatCurrency(selectedBooking.total_amount)}</span>
              </div>
              <div className="flex items-start gap-2 rounded-sm border border-emerald-100 bg-emerald-50/70 p-2 md:p-1.5 mt-8">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-xs text-emerald-800 ">
                  This payment will be added to the Onsite Total Under Financials.
                </p>
              </div>
            </div>
          </div>
        </div>
        ) : null}

        {onsitePaymentError ? <p className="mt-3 text-sm text-destructive md:mt-2.5">{onsitePaymentError}</p> : null}
        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end sm:gap-3 md:mt-3 md:pt-2.5">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-sm sm:w-auto"
            onClick={() => setOnsitePaymentOpen(false)}
            disabled={onsitePaymentPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full rounded-sm sm:w-auto"
            onClick={() => void handleOnsitePayment()}
            disabled={onsitePaymentPending || !onsiteReceiptCode || !onsiteAmount}
          >
            {onsitePaymentPending ? "Recording payment..." : "Record Payment"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={staffActionMessageOpen}
        onClose={closeStaffActionMessage}
        title={staffActionSuccess?.includes("declined") ? "Reservation Declined" : "Reservation Confirmed"}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {staffActionSuccess}
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={closeStaffActionMessage}
          >
            Got it
          </Button>
        </div>
      </Modal>

      <Modal
        open={onsitePaymentSuccessOpen}
        onClose={() => {
          setOnsitePaymentSuccessOpen(false);
          setSelectedBookingId(null);
        }}
        title="Payment recorded"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Onsite cash payment has been recorded successfully.
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setOnsitePaymentSuccessOpen(false);
              setSelectedBookingId(null);
            }}
          >
            Done
          </Button>
        </div>
      </Modal>

      <ConfirmationDialog
        open={bulkDialogMode === "confirm"}
        title="Confirm selected reservations?"
        description={`This confirms ${bulkConfirmIds.length} pending reservation(s). Others in your selection that are not pending will be skipped.`}
        confirmLabel="Confirm selected"
        confirmVariant="default"
        isPending={bulkPending === "confirm"}
        onClose={() => setBulkDialogMode(null)}
        onConfirm={async () => {
          setBulkDialogMode(null);
          await runBulkAction("confirm");
        }}
      />
      <ConfirmationDialog
        open={bulkDialogMode === "decline"}
        title="Decline selected reservations?"
        description={`This declines ${bulkDeclineIds.length} pending/confirmed reservation(s). Others in your selection will be skipped.`}
        confirmLabel="Decline selected"
        confirmVariant="destructive"
        isPending={bulkPending === "decline"}
        onClose={() => setBulkDialogMode(null)}
        onConfirm={async () => {
          setBulkDialogMode(null);
          await runBulkAction("decline");
        }}
      />
      <ConfirmationDialog
        open={bulkDialogMode === "delete"}
        title="Delete selected bookings?"
        description={`This permanently deletes ${bulkDeleteIds.length} cancelled/completed booking record(s). Others in your selection will be skipped.`}
        confirmLabel="Delete selected"
        confirmVariant="destructive"
        isPending={bulkPending === "delete"}
        onClose={() => setBulkDialogMode(null)}
        onConfirm={async () => {
          setBulkDialogMode(null);
          await runBulkAction("delete");
        }}
      />
    </div>
  );
}