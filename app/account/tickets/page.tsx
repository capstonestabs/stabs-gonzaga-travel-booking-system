import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TouristTicketWalletBrowser } from "@/components/site/tourist-ticket-wallet-browser";
import { getCurrentUserContext } from "@/lib/auth";
import { getBookingsForUser } from "@/lib/repositories";
import { getTouristTicketBookings } from "@/lib/tourist-bookings";
import { DashboardShell } from "@/components/site/dashboard-shell";

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
    <DashboardShell
      role="user"
      title="Ticket wallet"
      description="Open any confirmed or completed pass here, then save the ticket image when you need it."
    >
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
        <TouristTicketWalletBrowser bookings={ticketBookings} />
      )}
    </DashboardShell>
  );
}
