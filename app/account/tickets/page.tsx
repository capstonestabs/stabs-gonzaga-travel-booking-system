import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, History, LayoutDashboard, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressiveList } from "@/components/ui/progressive-list";
import { getBookingTicketState, isBookingTicketExpired } from "@/lib/booking-state";
import { getCurrentUserContext } from "@/lib/auth";
import { getBookingsForUser } from "@/lib/repositories";
import { getTouristTicketBookings } from "@/lib/tourist-bookings";
import { formatCurrency } from "@/lib/utils";

const ticketBadgeVariantByState = {
  valid: "success",
  used: "success",
  expired: "warning",
  pending: "warning",
  cancelled: "destructive"
} as const;

export default async function TouristTicketsPage() {
  const user = await getCurrentUserContext();
  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "user") {
    redirect((user.role === "admin" ? "/admin" : "/staff") as Route);
  }

  const bookings = await getBookingsForUser(user.authUserId);
  const ticketBookings = getTouristTicketBookings(bookings);

  return (
    <div className="page-shell space-y-5 py-6 sm:space-y-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="gradient-chip inline-flex w-fit items-center gap-2">
            <Ticket className="h-4 w-4" />
            Ticket wallet
          </div>
          <h1 className="page-title">Saved booking passes</h1>
          <p className="page-intro">
            Open any confirmed or completed pass here, then save the ticket image when you need it.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link href="/account">
            <Button variant="secondary" className="w-full sm:w-auto">
              <LayoutDashboard className="h-4 w-4" />
              Tourist dashboard
            </Button>
          </Link>
          <Link href="/account/history">
            <Button variant="secondary" className="w-full sm:w-auto">
              <History className="h-4 w-4" />
              Booking history
            </Button>
          </Link>
        </div>
      </div>

      {ticketBookings.length === 0 ? (
        <Card>
          <CardContent className="space-y-3.5 p-6 text-sm text-muted-foreground">
            <p>No booking passes are ready yet.</p>
            <p>Once a reservation is confirmed, its ticket will appear here for quick access.</p>
            <Link href="/destinations">
              <Button variant="secondary">
                <Ticket className="h-4 w-4" />
                Browse destinations
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ProgressiveList
          initialCount={6}
          step={6}
          maxHeightClass="max-h-[min(74vh,42rem)]"
          showMoreLabel="Show more passes"
          showLessLabel="Show fewer passes"
        >
          {ticketBookings.map((booking) => {
            const ticketState = getBookingTicketState(booking);
            const isExpired = isBookingTicketExpired(booking);

            return (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="flex flex-col gap-3 border-b border-border/70 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{booking.destination_snapshot.title}</CardTitle>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {booking.destination_snapshot.location_text} - {booking.service_date}
                    </p>
                  </div>
                  <Badge variant={ticketBadgeVariantByState[ticketState] ?? "warning"}>
                    {ticketState === "valid"
                      ? "Ready to present"
                      : ticketState === "used"
                        ? "Already used"
                        : ticketState === "expired"
                          ? "Expired pass"
                          : "Awaiting confirmation"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
                      <p className="text-muted-foreground">Package</p>
                      <p className="mt-1 font-medium">
                        {booking.service_snapshot?.title ?? "Standard service"}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
                      <p className="text-muted-foreground">Ticket code</p>
                      <p className="mt-1 font-medium">{booking.ticket_code}</p>
                    </div>
                    <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
                      <p className="text-muted-foreground">Guests</p>
                      <p className="mt-1 font-medium">{booking.guest_count}</p>
                    </div>
                    <div className="rounded-[1rem] bg-muted/45 px-4 py-3">
                      <p className="text-muted-foreground">Amount</p>
                      <p className="mt-1 font-medium">{formatCurrency(booking.total_amount)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
                    <Link href={`/account/bookings/${booking.id}/ticket` as Route}>
                      <Button variant="secondary">
                        <Download className="h-4 w-4" />
                        {isExpired ? "View expired pass" : "Open and download"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </ProgressiveList>
      )}
    </div>
  );
}
