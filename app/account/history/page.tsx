import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { History, LayoutDashboard } from "lucide-react";

import { ClearBookingHistoryButton } from "@/components/forms/clear-booking-history-button";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { TouristBookingHistoryBrowser } from "@/components/site/tourist-booking-history-browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <DashboardShell
      role="user"
      title="Booking history"
      description="Review finished, cancelled, and expired reservations without stretching your main dashboard."
    >
      {historyBookings.length > 0 ? <ClearBookingHistoryButton count={historyBookings.length} /> : null}

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
        <TouristBookingHistoryBrowser bookings={historyBookings} />
      )}
    </DashboardShell>
  );
}
