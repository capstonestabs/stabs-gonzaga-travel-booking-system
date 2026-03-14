import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  MapPin,
  MessageSquareText,
  Package,
  UserRound
} from "lucide-react";

import { DashboardShell } from "@/components/site/dashboard-shell";
import { MetricCard } from "@/components/site/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getStaffDashboardData } from "@/lib/repositories";

function WorkspaceActionCard({
  title,
  description,
  value,
  href,
  cta,
  icon: Icon
}: {
  title: string;
  description: string;
  value: string | number;
  href: Route;
  cta: string;
  icon: typeof CalendarCheck2;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex h-full flex-col gap-5 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-border/70 bg-secondary/70">
            <Icon className="h-[1.125rem] w-[1.125rem] text-primary" />
          </span>
          <div className="space-y-1.5">
            <h3 className="font-display text-[1.45rem] font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Current
            </p>
            <p className="mt-1 font-display text-[1.9rem] font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <Link href={href}>
            <Button variant="secondary" size="sm" className="w-full justify-between sm:w-auto">
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function StaffDashboardPage() {
  const context = await requireRole(["staff"]);

  const data = await getStaffDashboardData(context.authUserId);
  const destination = data.listings[0] ?? null;

  return (
    <DashboardShell
      role="staff"
      title="Staff workspace"
      description="Keep your assigned destination current, review bookings, and stay ready for the next visitor."
    >
      <Card className="overflow-hidden">
        <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr),auto] lg:items-start">
          <div className="space-y-4">
            <div className="gradient-chip w-fit">Assigned destination</div>
            {destination ? (
              <>
                <div className="space-y-2">
                  <h2 className="font-display text-[1.7rem] font-semibold tracking-tight text-foreground sm:text-[2.2rem]">
                    {destination.title}
                  </h2>
                  <p className="inline-flex items-center gap-2 text-sm leading-6 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {destination.location_text}
                  </p>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Keep the destination story, cover photo, and gallery up to date here. Service
                    packages, prices, daily capacity, and closed dates are managed from the
                    services page.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/55 px-3 py-1.5 text-sm text-foreground/82">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={destination.status === "published" ? "success" : "muted"}>
                      {destination.status}
                    </Badge>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/55 px-3 py-1.5 text-sm text-foreground/82">
                    <Package className="h-4 w-4 text-primary" />
                    {destination.destination_services?.length ?? 0} service
                    {(destination.destination_services?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <h2 className="font-display text-[1.7rem] font-semibold tracking-tight text-foreground">
                  No destination assigned yet
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Ask the admin to assign your destination name and location first. Once that is
                  ready, you can manage the public details and bookable services from this
                  workspace.
                </p>
              </div>
            )}
          </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[15rem] lg:grid-cols-1">
            <Link href={"/staff/destination" as Route}>
              <Button className="min-h-11 w-full justify-between">
                Open destination
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={"/staff/services" as Route}>
              <Button variant="secondary" className="min-h-11 w-full justify-between">
                Open services
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <WorkspaceActionCard
          title="Bookings"
          description="Review reservations for your destination and mark finished visits as completed."
          value={data.recentBookings.length}
          href={"/staff/bookings" as Route}
          cta="Open bookings"
          icon={CalendarCheck2}
        />
        <WorkspaceActionCard
          title="Feedback"
          description="Read the latest questions and public messages connected to your destination."
          value={data.feedbackEntries.length}
          href={"/staff/feedback" as Route}
          cta="Open feedback"
          icon={MessageSquareText}
        />
        <WorkspaceActionCard
          title="Account"
          description="Update your avatar and keep your password current from the account page."
          value="Ready"
          href={"/staff/account" as Route}
          cta="Open account"
          icon={UserRound}
        />
      </div>
    </DashboardShell>
  );
}
