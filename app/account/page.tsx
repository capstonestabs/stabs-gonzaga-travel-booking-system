import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, History, LayoutDashboard, Settings2, Ticket } from "lucide-react";

import { ProfileSummaryCard } from "@/components/site/profile-summary-card";
import { UserBookingCalendar } from "@/components/site/user-booking-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth";
import { getBookingsForUser, getProfileBundle } from "@/lib/repositories";
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

  const bookings = await getBookingsForUser(user.authUserId);
  const activeBookings = getTouristActiveBookings(bookings);
  const historyBookings = getTouristHistoryBookings(bookings);
  const ticketBookings = getTouristTicketBookings(bookings);
  const profileBundle =
    (await getProfileBundle(user.authUserId)) ?? {
      user: {
        id: user.authUserId,
        email: user.email,
        full_name: user.profile?.full_name ?? null,
        role: "user" as const,
        phone: user.profile?.phone ?? null,
        avatar_url: user.profile?.avatar_url ?? null,
        created_at: user.profile?.created_at ?? new Date().toISOString(),
        updated_at: user.profile?.updated_at ?? new Date().toISOString()
      },
      staffProfile: null
    };

  return (
    <div className="page-shell space-y-5 py-6 sm:space-y-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="gradient-chip inline-flex w-fit items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Tourist account
          </div>
          <h1 className="page-title">Tourist dashboard</h1>
          <p className="page-intro">
            Keep your travel summary in one place, then open dedicated pages for current bookings,
            booking history, and saved passes.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link href={"/account/current" as Route}>
            <Button variant="secondary" className="w-full sm:w-auto">
              <CalendarDays className="h-4 w-4" />
              Current bookings
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
          <Link href="/profile">
            <Button variant="secondary" className="w-full sm:w-auto">
              <Settings2 className="h-4 w-4" />
              Account settings
            </Button>
          </Link>
        </div>
      </div>

      <ProfileSummaryCard
        role="user"
        user={profileBundle.user}
        email={user.email}
        staffProfile={profileBundle.staffProfile}
        heading="Account summary"
      />

      {bookings.length > 0 ? <UserBookingCalendar bookings={bookings} /> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1.5 p-4 sm:p-5">
            <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Current bookings
            </p>
            <p className="text-2xl font-semibold">{activeBookings.length}</p>
            <p className="text-sm text-muted-foreground">Reservations still active in your dashboard.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1.5 p-4 sm:p-5">
            <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Ticket className="h-3.5 w-3.5" />
              Ticket wallet
            </p>
            <p className="text-2xl font-semibold">{ticketBookings.length}</p>
            <p className="text-sm text-muted-foreground">Passes ready to open, review, or save to your device.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1.5 p-4 sm:p-5">
            <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              History
            </p>
            <p className="text-2xl font-semibold">{historyBookings.length}</p>
            <p className="text-sm text-muted-foreground">Finished, cancelled, and expired records kept outside the dashboard.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Current bookings now have their own page.</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Open your active reservations separately so the dashboard stays lighter and easier to
              scan, especially when your account grows.
            </p>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <Link href={"/account/current" as Route}>
              <Button>
                <CalendarDays className="h-4 w-4" />
                Open current bookings
              </Button>
            </Link>
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
    </div>
  );
}
