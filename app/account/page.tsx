import type { Route } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, History, Ticket } from "lucide-react";

import { DashboardShell } from "@/components/site/dashboard-shell";
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
    <DashboardShell
      role="user"
      title="Tourist dashboard"
      description="Keep your travel summary in one place, then move between current bookings, history, ticket wallet, and account settings from one section menu."
    >
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
            <p className="text-sm font-medium text-foreground">Ready for another trip?</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Use the sidebar to move between your booking sections, then browse destinations again
              when you are ready to plan another visit.
            </p>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <Link href="/destinations">
              <Button variant="secondary">
                <CalendarDays className="h-4 w-4" />
                Browse destinations
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
