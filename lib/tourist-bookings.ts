import { isBookingTicketExpired } from "@/lib/booking-state";
import type { Booking } from "@/lib/types";

export function isTouristHistoryBooking(booking: Booking) {
  return (
    booking.status === "cancelled" ||
    booking.status === "completed" ||
    booking.payment?.status === "expired" ||
    isBookingTicketExpired(booking)
  );
}

export function isTouristActiveBooking(booking: Booking) {
  return !isTouristHistoryBooking(booking);
}

export function getTouristHistoryBookings(bookings: Booking[]) {
  return bookings.filter(isTouristHistoryBooking);
}

export function getTouristActiveBookings(bookings: Booking[]) {
  return bookings.filter(isTouristActiveBooking);
}

export function canTouristOpenTicket(booking: Booking) {
  return Boolean(booking.ticket_code && booking.status !== "cancelled");
}

export function getTouristTicketBookings(bookings: Booking[]) {
  return bookings.filter(canTouristOpenTicket);
}
