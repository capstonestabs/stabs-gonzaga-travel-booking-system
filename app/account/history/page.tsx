import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { History, LayoutDashboard } from "lucide-react";

import { ClearBookingHistoryButton } from "@/components/forms/clear-booking-history-button";
import { TouristBookingRecordCard } from "@/components/site/tourist-booking-record-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressiveList } from "@/components/ui/progressive-list";
import { getCurrentUserContext } from "@/lib/auth";
import { getBookingsForUser } from "@/lib/repositories";
import { getTouristHistoryBookings } from "@/lib/tourist-bookings";

export default async function TouristBookingHistoryPage() {
  const user = await getCurrentUserContext();
  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "user") {
    redirect((user.role === "admin" ? "/admin" : "/staff") as Route);
  }

  const bookings = await getBookingsForUser(user.authUserId);
  const historyBookings = getTouristHistoryBookings(bookings);

  return (
    <div className="page-shell space-y-5 py-6 sm:space-y-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="gradient-chip inline-flex w-fit items-center gap-2">
            <History className="h-4 w-4" />
            Booking history
          </div>
          <h1 className="page-title">Past and cleared-up trips</h1>
          <p className="page-intro">
            Review finished, cancelled, and expired reservations without stretching your main dashboard.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link href="/account">
            <Button variant="secondary" className="w-full sm:w-auto">
              <LayoutDashboard className="h-4 w-4" />
              Tourist dashboard
            </Button>
          </Link>
          {historyBookings.length > 0 ? <ClearBookingHistoryButton count={historyBookings.length} /> : null}
        </div>
      </div>

      {historyBookings.length === 0 ? (
        <Card>
          <CardContent className="space-y-3.5 p-6 text-sm text-muted-foreground">
            <p>Your booking history is clear right now.</p>
            <p>Finished, cancelled, or expired trips will appear here when you need to review them.</p>
            <Link href="/account">
              <Button variant="secondary">
                <LayoutDashboard className="h-4 w-4" />
                Back to dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ProgressiveList
          initialCount={4}
          step={4}
          maxHeightClass="max-h-[min(74vh,42rem)]"
          showMoreLabel="Show more history"
          showLessLabel="Show fewer history items"
        >
          {historyBookings.map((booking) => (
            <TouristBookingRecordCard key={booking.id} booking={booking} mode="history" />
          ))}
        </ProgressiveList>
      )}
    </div>
  );
}
