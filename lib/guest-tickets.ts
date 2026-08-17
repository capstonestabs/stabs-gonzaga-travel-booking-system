import { createHmac, timingSafeEqual } from "crypto";

import { env, getSiteUrl } from "@/lib/env";
import type { Booking } from "@/lib/types";

export type BookingGuestTicket = {
  name: string;
  type: "adult" | "child";
  guestNumber: number;
  ticketCode: string;
};

function getGuestTicketSecret() {
  return env.paymongoSecretKey || env.supabaseServiceRoleKey || "stabs-guest-ticket-verification";
}

function getGuestTicketPayload(bookingId: string, guestNumber: number) {
  return `${bookingId}:${guestNumber}`;
}

export function createGuestTicketToken(bookingId: string, guestNumber: number) {
  return createHmac("sha256", getGuestTicketSecret())
    .update(getGuestTicketPayload(bookingId, guestNumber))
    .digest("hex");
}

export function verifyGuestTicketToken(
  bookingId: string,
  guestNumber: number,
  token?: string | null
) {
  if (!token || !Number.isInteger(guestNumber) || guestNumber < 1) {
    return false;
  }

  const expected = createGuestTicketToken(bookingId, guestNumber);
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function createGuestTicketCode(bookingTicketCode: string, guestNumber: number) {
  return `${bookingTicketCode}-G${String(guestNumber).padStart(2, "0")}`;
}

export function getBookingGuestTickets(
  booking: Pick<Booking, "ticket_code" | "guest_count" | "contact_name" | "service_snapshot">
) {
  if (!booking.ticket_code) {
    return [];
  }

  const savedGuests = booking.service_snapshot?.guest_details;
  const savedTypes = booking.service_snapshot?.guest_breakdown?.guest_types ?? [];

  return Array.from({ length: booking.guest_count }, (_, index): BookingGuestTicket => {
    const guestNumber = index + 1;
    const savedGuest = savedGuests?.[index];
    return {
      guestNumber,
      name:
        savedGuest?.name ||
        (index === 0 ? booking.contact_name : `${booking.contact_name} - Guest ${guestNumber}`),
      type: savedGuest?.type || savedTypes[index] || "adult",
      ticketCode: createGuestTicketCode(booking.ticket_code as string, guestNumber)
    };
  });
}

export function createGuestTicketVerificationUrl(bookingId: string, guestNumber: number) {
  const token = createGuestTicketToken(bookingId, guestNumber);
  return `${getSiteUrl()}/tickets/verify/${bookingId}/${guestNumber}?token=${token}`;
}
