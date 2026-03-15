import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, History, LayoutDashboard, Ticket } from "lucide-react";

import { TouristBookingRecordCard } from "@/components/site/tourist-booking-record-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressiveList } from "@/components/ui/progressive-list";
import { getCurrentUserContext } from "@/lib/auth";
import { getBookingsForUser } from "@/lib/repositories";
import { getTouristActiveBookings, getTouristHistoryBookings } from "@/lib/tourist-bookings";

export default async function TouristCurrentBookingsPage() {
  const user = await getCurrentUserContext();
  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "user") {
    redirect((user.role === "admin" ? "/admin" : "/staff") as Route);
  }

  const bookings = await getBookingsForUser(user.authUserId);
  const activeBookings = getTouristActiveBookings(bookings);
  const historyBookings = getTouristHistoryBookings(bookings);

  return (
    <div className="page-shell space-y-5 py-6 sm:space-y-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="gradient-chip inline-flex w-fit items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Current bookings
          </div>
          <h1 className="page-title">Reservations in progress</h1>
          <p className="page-intro">
            Keep active reservations on a dedicated page so your dashboard stays lighter and easier
            to review.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link href="/account">
            <Button variant="secondary" className="w-full sm:w-auto">
              <LayoutDashboard className="h-4 w-4" />
              Tourist dashboard
            </Button>
          </Link>
          <Link href="/account/tickets">
            <Button variant="secondary" className="w-full sm:w-auto">
              <Ticket className="h-4 w-4" />
              Ticket wallet
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

      {activeBookings.length === 0 ? (
        <Card>
          <CardContent className="space-y-3.5 p-6 text-sm text-muted-foreground">
            <p>No active reservations are sitting in your account right now.</p>
            <p>
              Browse destinations for your next trip, or open booking history and ticket wallet to
              review older records.
            </p>
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Link href="/destinations">
                <Button variant="secondary">
                  <CalendarDays className="h-4 w-4" />
                  Browse destinations
                </Button>
              </Link>
              {historyBookings.length > 0 ? (
                <Link href="/account/history">
                  <Button variant="outline">
                    <History className="h-4 w-4" />
                    Open booking history
                  </Button>
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <ProgressiveList
          initialCount={4}
          step={4}
          maxHeightClass="max-h-[min(74vh,42rem)]"
          showMoreLabel="Show more current bookings"
          showLessLabel="Show fewer current bookings"
        >
          {activeBookings.map((booking) => (
            <TouristBookingRecordCard key={booking.id} booking={booking} />
          ))}
        </ProgressiveList>
      )}
    </div>
  );
}
