import {
  createGuestTicketCode,
  createGuestTicketToken,
  getBookingGuestTickets,
  verifyGuestTicketToken
} from "@/lib/guest-tickets";
import type { Booking } from "@/lib/types";

describe("per-guest tickets", () => {
  it("creates a distinct ticket code for every saved guest", () => {
    const booking = {
      ticket_code: "GTB-202608-ABC234",
      guest_count: 2,
      contact_name: "Lead Guest",
      service_snapshot: {
        guest_details: [
          { name: "Maria Santos", type: "adult" },
          { name: "Juan Santos", type: "child" }
        ]
      }
    } as Pick<Booking, "ticket_code" | "guest_count" | "contact_name" | "service_snapshot">;

    expect(getBookingGuestTickets(booking)).toEqual([
      {
        name: "Maria Santos",
        type: "adult",
        guestNumber: 1,
        ticketCode: "GTB-202608-ABC234-G01"
      },
      {
        name: "Juan Santos",
        type: "child",
        guestNumber: 2,
        ticketCode: "GTB-202608-ABC234-G02"
      }
    ]);
  });

  it("keeps existing bookings compatible", () => {
    const booking = {
      ticket_code: "GTB-202608-OLD234",
      guest_count: 2,
      contact_name: "Existing Traveler",
      service_snapshot: null
    } as Pick<Booking, "ticket_code" | "guest_count" | "contact_name" | "service_snapshot">;

    const tickets = getBookingGuestTickets(booking);
    expect(tickets).toHaveLength(2);
    expect(tickets[0]?.name).toBe("Existing Traveler");
    expect(tickets[1]?.ticketCode).toBe(createGuestTicketCode(booking.ticket_code!, 2));
  });

  it("signs the booking and guest number and rejects altered values", () => {
    const token = createGuestTicketToken("booking-id", 1);
    expect(verifyGuestTicketToken("booking-id", 1, token)).toBe(true);
    expect(verifyGuestTicketToken("booking-id", 2, token)).toBe(false);
    expect(verifyGuestTicketToken("other-booking", 1, token)).toBe(false);
    expect(verifyGuestTicketToken("booking-id", 1, `${token}0`)).toBe(false);
  });
});
