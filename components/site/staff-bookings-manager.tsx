"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LogIn,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
  ImageOff,
  UserRound
} from "lucide-react";
import { CompleteBookingButton } from "@/components/forms/complete-booking-button";
import { DeleteBookingButton } from "@/components/forms/delete-booking-button";
import { ProgressiveList } from "@/components/ui/progressive-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { isBookingTicketExpired } from "@/lib/booking-state";
import { getBookingGuestTickets } from "@/lib/guest-tickets";
import type { Booking } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

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

function getBookingBadgeVariant(status: string) {
  switch (status) {
    case "confirmed":
    case "completed":
      return "success" as const;
    case "pending_payment":
      return "warning" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "muted" as const;
  }
}

type StatusFilter = "all" | "pending_payment" | "confirmed" | "completed" | "cancelled" | "duplicate";

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "duplicate", label: "Duplicate bookings" }
];

type SelectAction = "all-shown" | "ready-to-complete" | "deletable";

const selectActionOptions: { value: SelectAction; label: string }[] = [
  { value: "all-shown", label: "Select all shown" },
  { value: "ready-to-complete", label: "Select ready to complete" },
  { value: "deletable", label: "Select deletable" }
];

/** Small reusable dropdown: shows the active label, a floating option list, closes on outside click / Escape. */
function InlineDropdown<T extends string>({
  label,
  activeLabel,
  options,
  value,
  onSelect
}: {
  label: string;
  activeLabel: string;
  options: { value: T; label: string }[];
  value?: T;
  onSelect: (next: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-[0.9rem] border px-3.5 py-2 text-xs font-medium transition-colors",
          open
            ? "border-primary bg-primary/10 text-primary"
            : "border-border/70 bg-card text-muted-foreground hover:bg-muted/50"
        )}
      >
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{activeLabel}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open ? "rotate-180" : "")} />
      </button>

      <div
        role="listbox"
        className={cn(
          "absolute left-0 top-[calc(100%+0.4rem)] z-20 w-52 origin-top-left overflow-hidden rounded-[0.85rem] border border-border/70 bg-card shadow-[0_18px_40px_rgba(22,74,47,0.14)] transition-all duration-150 ease-out",
          open
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
            : "-translate-y-1 opacity-0 scale-95 pointer-events-none"
        )}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={value === option.value}
            onClick={() => {
              onSelect(option.value);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-colors",
              value === option.value
                ? "bg-primary/10 font-medium text-primary"
                : "text-foreground hover:bg-muted/50"
            )}
          >
            {option.label}
            {value === option.value ? <Check className="h-3.5 w-3.5" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"complete" | "delete" | null>(null);
  const [dialogMode, setDialogMode] = useState<"complete" | "delete" | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedBookingIds, setExpandedBookingIds] = useState<string[]>([]);
  const [visitPending, setVisitPending] = useState<Record<string, "check_in" | "check_out" | null>>({});
  const [visitError, setVisitError] = useState<Record<string, string | null>>({});

  const duplicateBookingIds = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;
      const key = `${booking.user_id}::${booking.service_id}::${booking.service_date}`;
      groups.set(key, [...(groups.get(key) ?? []), booking.id]);
    }
    const flagged = new Set<string>();
    for (const ids of groups.values()) {
      if (ids.length > 1) {
        ids.forEach((id) => flagged.add(id));
      }
    }
    return flagged;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "duplicate" ? duplicateBookingIds.has(booking.id) : booking.status === statusFilter);

      if (!matchesStatus) return false;
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
  }, [bookings, query, statusFilter, duplicateBookingIds]);

  const allBookingIds = useMemo(() => filteredBookings.map((booking) => booking.id), [filteredBookings]);

  const completeEligibleIds = useMemo(
    () =>
      filteredBookings
        .filter((booking) => booking.status === "confirmed" && !isBookingTicketExpired(booking))
        .map((booking) => booking.id),
    [filteredBookings]
  );

  const deleteEligibleIds = useMemo(
    () =>
      filteredBookings
        .filter(
          (booking) =>
            booking.status === "cancelled" || booking.status === "completed"
        )
        .map((booking) => booking.id),
    [filteredBookings]
  );

  const selectedCompleteIds = selectedIds.filter((id) => completeEligibleIds.includes(id));
  const selectedDeleteIds = selectedIds.filter((id) => deleteEligibleIds.includes(id));

  function handleSelectAction(action: SelectAction) {
    setError(null);
    if (action === "all-shown") setSelectedIds(allBookingIds);
    if (action === "ready-to-complete") setSelectedIds(completeEligibleIds);
    if (action === "deletable") setSelectedIds(deleteEligibleIds);
  }

  function toggleSelection(bookingId: string) {
    setError(null);
    setSelectedIds((current) =>
      current.includes(bookingId)
        ? current.filter((id) => id !== bookingId)
        : [...current, bookingId]
    );
  }

  function toggleExpand(bookingId: string) {
    setExpandedBookingIds((current) =>
      current.includes(bookingId)
        ? current.filter((id) => id !== bookingId)
        : [...current, bookingId]
    );
  }

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
      const body = await response.json() as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to update visit status.");
      }
      router.refresh();
    } catch (err) {
      setVisitError((prev) => ({ ...prev, [key]: err instanceof Error ? err.message : "Failed to update status." }));
    } finally {
      setVisitPending((prev) => ({ ...prev, [key]: null }));
    }
  }

  async function runBulkAction(mode: "complete" | "delete") {
    const actionableIds = mode === "complete" ? selectedCompleteIds : selectedDeleteIds;
    const invalidCount = selectedIds.length - actionableIds.length;

    if (selectedIds.length === 0) {
      setError("Select at least one booking first.");
      return;
    }

    if (actionableIds.length === 0) {
      setError(
        mode === "complete"
          ? "Select confirmed upcoming bookings to mark as completed."
          : "Select cancelled bookings or completed bookings to delete."
      );
      return;
    }

    if (invalidCount > 0) {
      setError(
        mode === "complete"
          ? "Only confirmed upcoming bookings can be marked as completed."
          : "Only cancelled bookings or completed bookings can be deleted."
      );
      return;
    }

    setError(null);
    setPendingAction(mode);

    try {
      const response = await fetch(
        mode === "complete" ? "/api/staff/bookings/batch-complete" : "/api/staff/bookings/batch-delete",
        {
          method: mode === "complete" ? "POST" : "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ bookingIds: actionableIds })
        }
      );
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          body.error ??
            (mode === "complete"
              ? "Unable to mark the selected bookings as completed."
              : "Unable to delete the selected bookings.")
        );
      }

      setSelectedIds([]);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : mode === "complete"
            ? "Unable to mark the selected bookings as completed."
            : "Unable to delete the selected bookings."
      );
      setPendingAction(null);
    }
  }

  const activeStatusLabel = statusFilterOptions.find((option) => option.value === statusFilter)?.label ?? "All statuses";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Bookings</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest booking records for this staff account.
              </p>
            </div>
            {bookings.length > 0 && (
              <label className="relative block w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search guest, contact, ticket..."
                  aria-label="Search bookings"
                  className="pl-9 min-h-10 h-10 text-sm"
                />
              </label>
            )}
          </div>

          {bookings.length > 0 ? (
            <div className="rounded-[0.95rem] border border-border/70 bg-muted/30 p-3 sm:p-3.5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Filter &amp; bulk actions
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Showing: <span className="font-medium text-foreground">{filteredBookings.length}</span>
                    {" / "}Selected: <span className="font-medium text-foreground">{selectedIds.length}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                  <InlineDropdown
                    label="Filter:"
                    activeLabel={activeStatusLabel}
                    options={statusFilterOptions}
                    value={statusFilter}
                    onSelect={setStatusFilter}
                  />
                  <InlineDropdown
                    label="Select:"
                    activeLabel="Choose a preset"
                    options={selectActionOptions}
                    onSelect={handleSelectAction}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="min-h-11"
                    onClick={() => setDialogMode("complete")}
                    disabled={selectedIds.length === 0 || pendingAction !== null}
                  >
                    {pendingAction === "complete"
                      ? "Saving..."
                      : "Mark selected as completed"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="min-h-11"
                    onClick={() => setDialogMode("delete")}
                    disabled={selectedIds.length === 0 || pendingAction !== null}
                  >
                    {pendingAction === "delete" ? "Deleting..." : "Delete selected"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-11"
                    onClick={() => {
                      setError(null);
                      setSelectedIds([]);
                    }}
                    disabled={selectedIds.length === 0 || pendingAction !== null}
                  >
                    Clear selection
                  </Button>
                </div>
              </div>
              {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 p-3.5 sm:space-y-4 sm:p-[1.125rem]">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bookings have been received for your destination yet.
          </p>
        ) : filteredBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bookings match your search or filter.
          </p>
        ) : (
          <ProgressiveList
            initialCount={6}
            step={6}
            maxHeightClass="max-h-[min(70vh,40rem)]"
            showMoreLabel="Show more bookings"
            showLessLabel="Show fewer bookings"
          >
            {filteredBookings.map((booking) => {
              const expired = isBookingTicketExpired(booking);
              const canComplete = booking.status === "confirmed" && !expired;
              const canDelete =
                booking.status === "cancelled" || booking.status === "completed";
              const checked = selectedIds.includes(booking.id);

              const guestTickets = getBookingGuestTickets(booking);
              const checkedInCount = booking.visits?.filter((v) => v.checked_in_at).length ?? 0;
              const checkedOutCount = booking.visits?.filter((v) => v.checked_out_at).length ?? 0;
              const isExpanded = expandedBookingIds.includes(booking.id);
              const isToday = booking.service_date === todayString;

              const destinationCoverUrl = destinationCoverByDestinationId[booking.destination_id] ?? null;
              const serviceImageUrl = booking.service_id
                ? serviceImagesByServiceId[booking.service_id] ?? null
                : null;
              const touristAvatarUrl = touristAvatarsByUserId[booking.user_id] ?? null;

              return (
                <div
                  key={booking.id}
                  className={cn(
                    "grid gap-3 rounded-[0.95rem] border border-border/70 bg-card/85 p-3.5 sm:p-4 xl:grid-cols-[auto,1.1fr,0.7fr,0.7fr,0.92fr]",
                    checked ? "ring-1 ring-primary/35" : ""
                  )}
                >
                  <label className="flex items-start justify-center pt-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelection(booking.id)}
                      className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                      aria-label={`Select booking ${booking.id}`}
                    />
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 shrink-0 overflow-hidden rounded-[0.5rem] bg-muted"
                        title="Destination cover photo"
                      >
                        {destinationCoverUrl ? (
                          <img src={destinationCoverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageOff className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium">{booking.destination_snapshot.title}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 shrink-0 overflow-hidden rounded-[0.5rem] bg-muted"
                        title="Service photo"
                      >
                        {serviceImageUrl ? (
                          <img src={serviceImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageOff className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Package: {booking.service_snapshot?.title ?? "Standard service"}
                      </p>
                    </div>

                    {booking.service_snapshot?.additional_services && booking.service_snapshot.additional_services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 pb-1">
                        {booking.service_snapshot.additional_services.map((addon: any) => (
                          <span key={addon.id} className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            + {addon.title} (Qty: {addon.quantity})
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border/70 bg-secondary/65"
                        title="Tourist profile"
                      >
                        {touristAvatarUrl ? (
                          <img src={touristAvatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-primary">
                            <UserRound className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.contact_name} | {booking.contact_email}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground">{booking.contact_phone}</p>
                    <p className="text-xs text-muted-foreground">
                      Ticket: {booking.ticket_code ?? "Issued after payment confirmation"}
                    </p>
                    {booking.ticket_code && (
                      <div className="flex flex-wrap items-center gap-2 pt-1.5">
                        <span className="inline-flex items-center rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          Guests: {checkedInCount} / {booking.guest_count} in
                          {checkedOutCount > 0 && ` (${checkedOutCount} out)`}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-[1.5rem] h-6 rounded-md px-1.5 py-0 text-[11px] font-semibold"
                          onClick={() => toggleExpand(booking.id)}
                        >
                          {isExpanded ? (
                            <>Hide guests <ChevronUp className="h-3 w-3" /></>
                          ) : (
                            <>Show guests <ChevronDown className="h-3 w-3" /></>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[0.9rem] bg-muted/45 px-3 py-3 sm:px-3.5">
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p className="mt-1 font-medium">{booking.service_date}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground">Check-out</p>
                    <p className="mt-1 font-medium">
                      {booking.check_out_date
                        ? `${booking.check_out_date}${booking.check_out_time ? ` · ${booking.check_out_time}` : ""}`
                        : "Not set"}
                    </p>
                    <p className="mt-1.5 text-sm text-muted-foreground">{booking.guest_count} guests</p>
                  </div>

                  <div className="rounded-[0.9rem] bg-muted/45 px-3 py-3 sm:px-3.5">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="mt-1 font-medium">{formatCurrency(booking.total_amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex h-full flex-col gap-2.5 rounded-[0.9rem] bg-muted/45 px-3 py-3 sm:px-3.5 sm:py-3.5">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getBookingBadgeVariant(booking.status)}>
                      {booking.status.replace("_", " ")}
                    </Badge>
                    {expired ? <Badge variant="warning">expired / no-show</Badge> : null}
                    {duplicateBookingIds.has(booking.id) ? (
                      <Badge variant="destructive" className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Duplicate booking
                      </Badge>
                    ) : null}
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {canComplete ? <p>Ready for bulk complete</p> : null}
                      {canDelete ? <p>Ready for bulk delete</p> : null}
                    </div>
                    <div className="mt-auto space-y-3 border-t border-border/55 pt-3">
                      {canComplete ? <CompleteBookingButton bookingId={booking.id} /> : null}
                      {booking.status === "confirmed" && expired ? (
                        <p className="text-xs text-muted-foreground">
                          This booking date has passed without completion. The pass is now expired and can no longer be used.
                        </p>
                      ) : null}
                      {canDelete ? (
                        <DeleteBookingButton
                          bookingId={booking.id}
                          className="w-full justify-center"
                          confirmMessage="Delete this booking from the staff list? Cancelled and completed bookings can be removed. Active bookings stay protected until they are completed or cancelled."
                        />
                      ) : null}
                      {booking.status !== "cancelled" && booking.status !== "completed" ? (
                        <p className="text-xs text-muted-foreground">
                          This record stays protected until the booking is completed or cancelled.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {isExpanded && booking.ticket_code && (
                    <div className="col-span-full border-t border-border/60 pt-4 mt-2.5 space-y-3">
                      {booking.service_snapshot?.additional_services && booking.service_snapshot.additional_services.length > 0 && (
                        <div className="rounded-[0.95rem] border border-border/70 bg-muted/40 p-3 mb-2">
                          <h5 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-2">Booked Add-on Services</h5>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {booking.service_snapshot.additional_services.map((addon: any) => (
                              <div key={addon.id} className="flex justify-between items-center rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs font-medium">
                                <span className="text-foreground">{addon.title}</span>
                                <span className="text-[11px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                                  Qty: {addon.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-sm">Guest Passes & Visits</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Check in/out guests directly. Visits can only be recorded on the scheduled visit date ({booking.service_date}).
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {guestTickets.map((guest) => {
                          const visit = booking.visits?.find((v) => v.guest_number === guest.guestNumber) ?? null;
                          const key = `${booking.id}-${guest.guestNumber}`;
                          const pending = visitPending[key] ?? null;
                          const err = visitError[key] ?? null;

                          return (
                            <div key={guest.guestNumber} className="flex flex-col justify-between gap-3 rounded-[0.95rem] border border-border/70 bg-card p-3.5 shadow-sm">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">{guest.name}</p>
                                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">{guest.ticketCode}</p>
                                  </div>
                                  <Badge variant={guest.type === "child" ? "muted" : "default"} className="text-[10px] uppercase font-bold shrink-0">
                                    {guest.type}
                                  </Badge>
                                </div>
                                {err && (
                                  <p className="mt-2 text-xs text-destructive leading-4">{err}</p>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2.5 mt-1 text-xs">
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  {!visit?.checked_in_at ? (
                                    "Not checked in"
                                  ) : !visit?.checked_out_at ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Checked in</span>
                                  ) : (
                                    <span className="text-muted-foreground">Checked out</span>
                                  )}
                                </span>

                                <div className="flex gap-1.5">
                                  {!visit?.checked_in_at && (
                                    <Button
                                      type="button"
                                      variant="default"
                                      disabled={pending !== null || !isToday}
                                      onClick={() => handleGuestVisitAction(booking.id, guest.guestNumber, "check_in")}
                                      className="min-h-8 h-8 rounded-lg px-2 text-xs font-semibold"
                                    >
                                      <LogIn className="h-3.5 w-3.5" />
                                      {pending === "check_in" ? "..." : "Check in"}
                                    </Button>
                                  )}
                                  {visit?.checked_in_at && !visit?.checked_out_at && (
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      disabled={pending !== null || !isToday}
                                      onClick={() => handleGuestVisitAction(booking.id, guest.guestNumber, "check_out")}
                                      className="min-h-8 h-8 rounded-lg px-2 text-xs font-semibold"
                                    >
                                      <LogOut className="h-3.5 w-3.5" />
                                      {pending === "check_out" ? "..." : "Check out"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </ProgressiveList>
        )}
      </CardContent>

      <ConfirmationDialog
        open={dialogMode === "complete"}
        title="Mark selected bookings as completed?"
        description="Only confirmed upcoming bookings can be completed. Make sure the service has already been delivered before you continue."
        confirmLabel="Mark selected as completed"
        confirmVariant="default"
        isPending={pendingAction === "complete"}
        onClose={() => setDialogMode(null)}
        onConfirm={async () => {
          setDialogMode(null);
          await runBulkAction("complete");
        }}
      />
      <ConfirmationDialog
        open={dialogMode === "delete"}
        title="Delete selected bookings?"
        description="Only cancelled bookings or completed bookings can be deleted. Active bookings stay protected until they are completed or cancelled."
        confirmLabel="Delete selected"
        confirmVariant="destructive"
        isPending={pendingAction === "delete"}
        onClose={() => setDialogMode(null)}
        onConfirm={async () => {
          setDialogMode(null);
          await runBulkAction("delete");
        }}
      />
    </Card>
  );
}