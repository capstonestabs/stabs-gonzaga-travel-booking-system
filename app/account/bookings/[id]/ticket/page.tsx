import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BookingTicketCard } from "@/components/site/booking-ticket-card";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import { isBookingTicketExpired } from "@/lib/booking-state";
import { getBookingForUserById } from "@/lib/repositories";
import { formatCurrency } from "@/lib/utils";
import {
  createGuestTicketVerificationUrl,
  getBookingGuestTickets
} from "@/lib/guest-tickets";

export default async function BookingTicketPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUserContext();
  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "user") {
    redirect((user.role === "admin" ? "/admin" : "/staff") as Route);
  }

  const { id } = await params;
  const booking = await getBookingForUserById(user.authUserId, id);

  if (!booking || !booking.ticket_code || booking.status === "cancelled") {
    notFound();
  }

  const isExpired = isBookingTicketExpired(booking);
  const guestTickets = getBookingGuestTickets(booking);
  const ticket = guestTickets[0];

  if (!ticket) {
    notFound();
  }

  return (
    <div className="page-shell space-y-6 py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="gradient-chip w-fit">{isExpired ? "Expired pass" : "Verified booking"}</div>
          <h1 className="page-title">Booking pass</h1>
          <p className="page-intro">
            {isExpired
              ? "This pass is no longer valid because the scheduled date has already passed."
              : `Present this single QR ticket on arrival for your full party of ${booking.guest_count} guest${booking.guest_count === 1 ? "" : "s"}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/account/tickets">
            <Button variant="outline" className="border-border/60">
              Ticket wallet
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <BookingTicketCard
            ticketCode={ticket.ticketCode}
            verificationUrl={createGuestTicketVerificationUrl(booking.id, ticket.guestNumber)}
            referenceCode={booking.id.split("-")[0].toUpperCase()}
            guestName={ticket.name}
            isExpired={isExpired}
          />
        </section>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Need help? <Link href="/feedback" className="text-primary underline">Contact destination support</Link>
        </p>
      </div>
    </div>
  );
}