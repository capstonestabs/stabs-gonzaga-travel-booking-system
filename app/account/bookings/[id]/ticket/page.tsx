import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BookingTicketCard } from "@/components/site/booking-ticket-card";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import { isBookingTicketExpired } from "@/lib/booking-state";
import { getBookingForUserById } from "@/lib/repositories";
import { formatCurrency } from "@/lib/utils";

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

  return (
    <div className="page-shell space-y-6 py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="gradient-chip w-fit">{isExpired ? "Expired pass" : "Verified booking"}</div>
          <h1 className="page-title">Booking pass</h1>
          <p className="page-intro">
            {isExpired
              ? "This pass is no longer valid because the scheduled date has already passed."
              : "Save this card to your device and present it when you arrive at the destination."}
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

      <BookingTicketCard
        destinationTitle={booking.destination_snapshot.title}
        locationText={booking.destination_snapshot.location_text}
        ticketCode={booking.ticket_code}
        serviceTitle={booking.service_snapshot?.title ?? "Standard service"}
        guestName={booking.contact_name}
        serviceDate={booking.service_date}
        guestCount={booking.guest_count}
        totalPaid={formatCurrency(booking.total_amount)}
        referenceCode={booking.id.split("-")[0].toUpperCase()}
        isExpired={isExpired}
      />
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Need help? <Link href="/feedback" className="text-primary underline">Contact destination support</Link>
        </p>
      </div>
    </div>
  );
}
