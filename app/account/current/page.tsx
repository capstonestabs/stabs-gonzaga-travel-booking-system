import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, History } from "lucide-react";

import { DashboardShell } from "@/components/site/dashboard-shell";
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
    <DashboardShell
      role="user"
      title="Current bookings"
      description="Review active reservations on their own page so the tourist dashboard stays lighter and easier to scan."
    >
      {activeBookings.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-5 text-sm text-muted-foreground sm:p-[1.375rem]">
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
          maxHeightClass="max-h-[min(70vh,38rem)]"
          showMoreLabel="Show more current bookings"
          showLessLabel="Show fewer current bookings"
        >
          {activeBookings.map((booking) => (
            <TouristBookingRecordCard key={booking.id} booking={booking} />
          ))}
        </ProgressiveList>
      )}
    </DashboardShell>
  );
}
