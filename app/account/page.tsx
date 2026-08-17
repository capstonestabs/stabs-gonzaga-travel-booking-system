import type { Route } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarDays, Compass, History, Ticket } from "lucide-react";

import { DashboardShell } from "@/components/site/dashboard-shell";
import { ListingCard } from "@/components/site/listing-card";
import { UserBookingCalendar } from "@/components/site/user-booking-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth";
import { getBookingsForUser, getPublishedDestinations } from "@/lib/repositories";
import {
  getTouristActiveBookings,
  getTouristHistoryBookings,
  getTouristTicketBookings
} from "@/lib/tourist-bookings";

export default async function AccountPage() {
  const user = await getCurrentUserContext();
  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "user") {
    redirect((user.role === "admin" ? "/admin" : "/staff") as Route);
  }

  const [bookings, destinations] = await Promise.all([
    getBookingsForUser(user.authUserId),
    getPublishedDestinations().catch(() => [])
  ]);

  const activeBookings = getTouristActiveBookings(bookings);
  const historyBookings = getTouristHistoryBookings(bookings);
  const ticketBookings = getTouristTicketBookings(bookings);

  return (
    <DashboardShell
      role="user"
      title="Tourist overview"
      description="Explore Gonzaga travel destinations, choose stay activities, and manage your reservation passes."
    >
      {/* Quick Booking Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/account/current">
          <Card className="transition-all hover:-translate-y-[2px] hover:border-primary/30">
            <CardContent className="space-y-1.5 p-4 sm:p-5">
              <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                Current bookings
              </p>
              <p className="text-2xl font-semibold">{activeBookings.length}</p>
              <p className="text-sm text-muted-foreground">Active reservations ready for your trip.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/tickets">
          <Card className="transition-all hover:-translate-y-[2px] hover:border-primary/30">
            <CardContent className="space-y-1.5 p-4 sm:p-5">
              <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <Ticket className="h-3.5 w-3.5 text-primary" />
                Ticket wallet
              </p>
              <p className="text-2xl font-semibold">{ticketBookings.length}</p>
              <p className="text-sm text-muted-foreground">Passes ready to display or download.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/history">
          <Card className="transition-all hover:-translate-y-[2px] hover:border-primary/30">
            <CardContent className="space-y-1.5 p-4 sm:p-5">
              <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <History className="h-3.5 w-3.5 text-primary" />
                Booking history
              </p>
              <p className="text-2xl font-semibold">{historyBookings.length}</p>
              <p className="text-sm text-muted-foreground">Past and completed trip records.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Gonzaga Destinations Catalog Section */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <Badge variant="accent">Gonzaga Destinations</Badge>
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Explore Destinations & Experiences
            </h2>
            <p className="text-sm text-muted-foreground">
              Select a destination below to check available dates, service details, and book your visit.
            </p>
          </div>
          <Link href="/destinations" className="shrink-0">
            <Button variant="outline" size="sm" className="gap-2">
              <Compass className="h-4 w-4" />
              View full catalog
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {destinations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No destinations are published at the moment. Please check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <ListingCard key={destination.id} destination={destination} />
            ))}
          </div>
        )}
      </section>

      {/* User Booking Calendar (if user has active bookings) */}
      {bookings.length > 0 ? (
        <section className="space-y-3 pt-4">
          <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
            My Travel Schedule
          </h3>
          <UserBookingCalendar bookings={bookings} />
        </section>
      ) : null}
    </DashboardShell>
  );
}
