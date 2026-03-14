import type { Booking } from "@/lib/types";
import { formatDateKey } from "@/lib/utils";

function getTodayDateKey(now = new Date()) {
  return formatDateKey(now);
}

export function isBookingDateInPast(serviceDate: string, now = new Date()) {
  return serviceDate < getTodayDateKey(now);
}

export function isBookingTicketExpired(
  booking: Pick<Booking, "status" | "service_date" | "completed_at">
) {
  if (booking.status !== "confirmed") {
    return false;
  }

  if (booking.completed_at) {
    return false;
  }

  return isBookingDateInPast(booking.service_date);
}

export function getBookingTicketState(
  booking: Pick<Booking, "status" | "service_date" | "completed_at">
) {
  if (booking.status === "cancelled") {
    return "cancelled" as const;
  }

  if (booking.status === "pending_payment") {
    return "pending" as const;
  }

  if (booking.status === "completed") {
    return "used" as const;
  }

  if (isBookingTicketExpired(booking)) {
    return "expired" as const;
  }

  return "valid" as const;
}

export function formatBookingStatusLabel(status: Booking["status"]) {
  switch (status) {
    case "pending_payment":
      return "Awaiting confirmation";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

export function formatReservationStatusLabel(
  status: NonNullable<Booking["payment"]>["status"] | "pending"
) {
  switch (status) {
    case "pending":
      return "Still in progress";
    case "paid":
      return "Confirmed";
    case "failed":
      return "Unsuccessful";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
  }
}

export function formatServiceWindowLabel(options: {
  availabilityStartDate?: string | null;
  availabilityEndDate?: string | null;
}) {
  const start = options.availabilityStartDate;
  const end = options.availabilityEndDate;

  if (start && end) {
    return `${start} to ${end}`;
  }

  if (start) {
    return `From ${start}`;
  }

  if (end) {
    return `Until ${end}`;
  }

  return "No end date set";
}
