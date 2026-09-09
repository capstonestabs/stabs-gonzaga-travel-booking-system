import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Compass, ImageOff, MapPin, MessageSquareText, Wallet } from "lucide-react";
import { TouristSpendingChart } from "@/components/site/tourist-spending-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type {
  TouristAlertItem,
  TouristDashboardStats,
  TouristFeedbackPrompt,
  TouristSpendPoint,
  TouristTopDestination
} from "@/lib/tourist-dashboard";;
import type { Booking } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function formatBookingDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function TouristDashboardShell({
  stats,
  nextTrip,
  spendingTrend,
  topDestinations,
  recentBookings,
  actionAlerts,
  feedbackPrompts
}: {
  stats: TouristDashboardStats;
  nextTrip: Booking | null;
  spendingTrend: TouristSpendPoint[];
  topDestinations: TouristTopDestination[];
  recentBookings: Booking[];
  actionAlerts: TouristAlertItem[];
  feedbackPrompts: TouristFeedbackPrompt[];
}) {
  return (
    <div className="tourist-dashboard space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Total spent + mini stats */}
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total Spent</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {formatCurrency(stats.totalSpent)}
              </p>
              {stats.spentChangePercent !== null ? (
                <p
                  className={`mt-1 text-xs font-medium ${
                    stats.spentChangePercent >= 0 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {stats.spentChangePercent >= 0 ? "+" : ""}
                  {stats.spentChangePercent.toFixed(1)}% this month
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">No spend recorded last month</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-4">
              <div className="tourist-glass-subpanel rounded-[0.9rem] border p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{stats.totalBookings}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Bookings</p>
              </div>
              <div className="tourist-glass-subpanel rounded-[0.9rem] border p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{stats.destinationsVisited}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Visited</p>
              </div>
              <div className="tourist-glass-subpanel rounded-[0.9rem] border p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{stats.upcomingTripsCount}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Next trip */}
        <Card className="overflow-hidden lg:col-span-1">
          <CardContent className="flex h-full flex-col p-0">
            {nextTrip ? (
              <>
                <div className="relative h-28 w-full shrink-0 overflow-hidden bg-muted/40">
                  {nextTrip.destination?.cover_url ? (
                    <img
                      src={nextTrip.destination.cover_url}
                      alt={nextTrip.destination_snapshot.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageOff className="h-5 w-5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary backdrop-blur-sm">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <p className="absolute bottom-2.5 left-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">
                    Next Trip
                  </p>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div className="space-y-1.5">
                    <p className="text-lg font-semibold leading-tight text-foreground">
                      {nextTrip.destination_snapshot.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {nextTrip.service_snapshot?.title ?? "Standard service"}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      {formatBookingDate(nextTrip.service_date)}
                    </p>
                  </div>
                  <Link
                    href={`/account/bookings/${nextTrip.id}/ticket` as Route}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    View ticket
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Next Trip</p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-2 text-center">
                  <p className="text-sm text-muted-foreground">No upcoming trips yet.</p>
                  <Link
                    href="/destinations"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    Browse destinations
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top destinations */}
        <Card className="lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Top Destinations</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Compass className="h-4 w-4" />
              </span>
            </div>
            {topDestinations.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {topDestinations.map((entry) => (
                  <div key={entry.destinationId} className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-muted/40">
                      {entry.coverUrl ? (
                        <img src={entry.coverUrl} alt={entry.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageOff className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate font-medium text-foreground">{entry.title}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {entry.count} {entry.count === 1 ? "trip" : "trips"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${entry.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <TouristSpendingChart data={spendingTrend} />
        <Card className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 pb-1 pt-3.5">
            <CardTitle className="m-0">Recent Bookings</CardTitle>
            <Link
              href={"/account/history" as Route}
              className="text-xs font-semibold text-primary hover:text-primary/80"
            >
              See all
            </Link>
          </div>
          <CardContent className="flex-1 space-y-1 p-4 pt-2">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {booking.destination_snapshot.title}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {formatBookingDate(booking.service_date)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(booking.total_amount)}
                      </p>
                      <Badge
                        variant={
                          booking.status === "completed" || booking.status === "confirmed"
                            ? "success"
                            : booking.status === "cancelled"
                              ? "destructive"
                              : "warning"
                        }
                        className="mt-0.5 text-[10px]"
                      >
                        {booking.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {feedbackPrompts.length > 0 ? (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquareText className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Share Your Experience</p>
                <p className="text-xs text-muted-foreground">Help other tourists by leaving feedback</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {feedbackPrompts.map((prompt) => (
                <div
                  key={prompt.destinationId}
                  className="tourist-glass-subpanel overflow-hidden rounded-[0.9rem] border"
                >
                  <div className="h-24 w-full overflow-hidden bg-muted/40">
                    {prompt.serviceImageUrl || prompt.coverUrl ? (
                      <img
                        src={prompt.serviceImageUrl ?? prompt.coverUrl ?? undefined}
                        alt={prompt.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    <div>
                      <p className="truncate text-sm font-medium text-foreground">{prompt.title}</p>
                      {prompt.serviceTitle ? (
                        <p className="truncate text-xs text-muted-foreground">{prompt.serviceTitle}</p>
                      ) : null}
                    </div>
                    <Link
                      href={"/feedback" as Route}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      Leave feedback
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}