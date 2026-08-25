import type { Route } from "next";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/site/dashboard-shell";
import { TouristDashboardShell } from "@/components/site/tourist-dashboard-shell";
import { getCurrentUserContext } from "@/lib/auth";
import { getBookingsForUser } from "@/lib/repositories";
import {
  getTouristActionAlerts,
  getTouristDashboardStats,
  getTouristFeedbackPrompts,
  getTouristNextTrip,
  getTouristRecentBookings,
  getTouristSpendingTrend,
  getTouristTopDestinations
} from "@/lib/tourist-dashboard";   

export default async function TouristDashboardPage() {
  const user = await getCurrentUserContext();
  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "user") {
    redirect((user.role === "admin" ? "/admin" : "/staff") as Route);
  }

  const bookings = await getBookingsForUser(user.authUserId);

  const stats = getTouristDashboardStats(bookings);
  const nextTrip = getTouristNextTrip(bookings);
  const spendingTrend = getTouristSpendingTrend(bookings, 12);
  const topDestinations = getTouristTopDestinations(bookings, 5);
  const recentBookings = getTouristRecentBookings(bookings, 5);
  const actionAlerts = getTouristActionAlerts(bookings, 3);
  const feedbackPrompts = getTouristFeedbackPrompts(bookings, 3);

  return (
    <DashboardShell
      role="user"
      title="Dashboard"
      description="Track your spending, upcoming trips, and booking activity at a glance."
    >
      <TouristDashboardShell
        stats={stats}
        nextTrip={nextTrip}
        spendingTrend={spendingTrend}
        topDestinations={topDestinations}
        recentBookings={recentBookings}
        actionAlerts={actionAlerts}
        feedbackPrompts={feedbackPrompts}
      />
    </DashboardShell>
  );
}