"use client";

import { useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { getBookingTicketState } from "@/lib/booking-state";
import type { Booking } from "@/lib/types";
import { formatDateKey, parseDateKey } from "@/lib/utils";

type CalendarBooking = Pick<
  Booking,
  "id" | "status" | "service_date" | "completed_at" | "destination_snapshot" | "service_snapshot"
>;

export function UserBookingCalendar({ bookings }: { bookings: CalendarBooking[] }) {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    bookings.find((booking) => getBookingTicketState(booking) === "valid")?.service_date ??
      bookings[0]?.service_date ??
      null
  );

  const selectedBookings = useMemo(
    () =>
      selectedDate
        ? bookings.filter((booking) => booking.service_date === selectedDate)
        : [],
    [bookings, selectedDate]
  );

  const upcomingDates = useMemo(
    () =>
      bookings
        .filter((booking) => getBookingTicketState(booking) === "valid")
        .map((booking) => parseDateKey(booking.service_date)),
    [bookings]
  );

  const completedDates = useMemo(
    () =>
      bookings
        .filter((booking) => getBookingTicketState(booking) === "used")
        .map((booking) => parseDateKey(booking.service_date)),
    [bookings]
  );

  const expiredDates = useMemo(
    () =>
      bookings
        .filter((booking) => getBookingTicketState(booking) === "expired")
        .map((booking) => parseDateKey(booking.service_date)),
    [bookings]
  );

  const pendingDates = useMemo(
    () =>
      bookings
        .filter((booking) => getBookingTicketState(booking) === "pending")
        .map((booking) => parseDateKey(booking.service_date)),
    [bookings]
  );

  const cancelledDates = useMemo(
    () =>
      bookings
        .filter((booking) => getBookingTicketState(booking) === "cancelled")
        .map((booking) => parseDateKey(booking.service_date)),
    [bookings]
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),18rem] 2xl:grid-cols-[minmax(0,1.08fr),20rem]">
      <div className="rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5">
        <div className="mb-4 space-y-1">
          <p className="text-sm font-medium text-foreground">My booking calendar</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Your booked dates are highlighted so you can quickly see upcoming trips, completed visits, and expired passes.
          </p>
        </div>

        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={selectedDate ? parseDateKey(selectedDate) : undefined}
          onSelect={(date) => {
            if (!date) {
              return;
            }

            setSelectedDate(formatDateKey(date));
          }}
          modifiers={{
            upcoming: upcomingDates,
            completed: completedDates,
            expired: expiredDates,
            pending: pendingDates,
            cancelled: cancelledDates
          }}
          modifiersClassNames={{
            upcoming:
              "[&>button]:border-primary/45 [&>button]:bg-primary/12 [&>button]:text-primary [&>button]:hover:bg-primary/16",
            completed:
              "[&>button]:border-emerald-300 [&>button]:bg-emerald-50 [&>button]:text-emerald-800",
            expired:
              "[&>button]:border-destructive/35 [&>button]:bg-destructive/8 [&>button]:text-destructive",
            pending:
              "[&>button]:border-amber-300 [&>button]:bg-amber-50 [&>button]:text-amber-800",
            cancelled:
              "[&>button]:border-rose-300 [&>button]:bg-rose-50 [&>button]:text-rose-700"
          }}
        />

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
            Upcoming
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Completed
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Pending payment
          </span>
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {selectedDate ? `Bookings on ${selectedDate}` : "Select a date"}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Tap a highlighted date to see which destination and service are scheduled there.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {selectedDate && selectedBookings.length > 0 ? (
            selectedBookings.map((booking) => {
              const ticketState = getBookingTicketState(booking);

              return (
                <div
                  key={booking.id}
                  className="rounded-[1rem] border border-border/70 bg-muted/30 px-4 py-3"
                >
                  <p className="font-medium text-foreground">
                    {booking.destination_snapshot.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {booking.service_snapshot?.title ?? "Standard service"}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {ticketState === "valid"
                      ? "Upcoming"
                      : ticketState === "used"
                        ? "Completed"
                        : ticketState === "expired"
                          ? "Expired pass"
                          : ticketState === "cancelled"
                            ? "Unsuccessful"
                            : "Pending payment"}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="rounded-[1rem] border border-dashed border-border/70 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
              No bookings are scheduled for this date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
