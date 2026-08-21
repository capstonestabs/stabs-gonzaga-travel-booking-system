import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, MapPin, UserRound } from "lucide-react";

import { DashboardShell } from "@/components/site/dashboard-shell";
import { DestinationFinancialsPanel } from "@/components/site/destination-financials-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import {
  getAdminDashboardData,
  getDestinationCoverPhotos,
  getServiceCoverPhotos,
  getStaffAvatar,
  getUserAvatars
} from "@/lib/repositories";
export default async function AdminDestinationFinancialsDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: destinationId } = await params;

  await requireRole(["admin"]);

  const data = await getAdminDashboardData();
  const summary = data.destinationRevenue.find(
    (entry) => entry.destination_id === destinationId
  );

  if (!summary) {
    notFound();
  }

  const destinationRecords = data.financialRecords.filter(
    (record) => record.destination_id === destinationId
  );
  const staffId = destinationRecords[0]?.staff_id ?? null;

  const serviceIds = Array.from(
    new Set(
      destinationRecords
        .map((record) => record.service_snapshot?.id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const touristUserIds = Array.from(new Set(destinationRecords.map((record) => record.user_id)));

  const [coverPhotos, serviceImagesByServiceId, staffAvatarUrl, touristAvatarsByUserId] = await Promise.all([
    getDestinationCoverPhotos([destinationId]),
    getServiceCoverPhotos(serviceIds),
    staffId ? getStaffAvatar(staffId) : Promise.resolve(null),
    getUserAvatars(touristUserIds)
  ]);
  const coverUrl = coverPhotos[destinationId] ?? null;

  return (
    <DashboardShell
      role="admin"
      title={summary.destination_title}
      description="Full payout breakdown for this destination, grouped by service."
    >
      {coverUrl ? (
        <div className="relative h-40 w-full overflow-hidden rounded-[1.1rem] border border-border/70 sm:h-52">
          <img src={coverUrl} alt={summary.destination_title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <p className="absolute bottom-3 left-4 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {summary.destination_title}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {summary.destination_location_text}
        </span>
        <Link href={"/admin/destination-financials" as Route}>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            All destinations
          </Button>
        </Link>
      </div>

      {summary.staff_name ? (
        <Card className="overflow-hidden">
          {staffId ? (
            <Link
              href={`/admin/staff/${staffId}` as Route}
              className="flex items-center gap-3.5 p-4 transition-colors hover:bg-muted/25 sm:p-4.5"
            >
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border/70 bg-secondary/65">
                {staffAvatarUrl ? (
                  <img
                    src={staffAvatarUrl}
                    alt={summary.staff_name ?? "Staff"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-primary">
                    <UserRound className="h-5 w-5" />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Assigned staff
                </p>
                <p className="mt-0.5 truncate font-display text-[1.05rem] font-semibold tracking-tight text-foreground">
                  {summary.staff_name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  View profile and manage this destination
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          ) : (
            <CardContent className="flex items-center gap-3.5 p-4 sm:p-4.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/70 bg-secondary/65 text-primary">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Assigned staff
                </p>
                <p className="mt-0.5 truncate font-display text-[1.05rem] font-semibold tracking-tight text-foreground">
                  {summary.staff_name}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      ) : null}

      <DestinationFinancialsPanel
        destinationTitle={summary.destination_title}
        records={destinationRecords}
        readOnly={false}
        serviceImagesByServiceId={serviceImagesByServiceId}
        touristAvatarsByUserId={touristAvatarsByUserId}
        destinationCoverUrl={coverUrl}
      />
    </DashboardShell>
  );
}