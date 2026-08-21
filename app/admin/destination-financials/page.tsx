import { Landmark } from "lucide-react";

import { DashboardShell } from "@/components/site/dashboard-shell";
import { DestinationFinancialsList } from "@/components/site/destination-financials-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardData, getDestinationCoverPhotos } from "@/lib/repositories";

export default async function AdminDestinationFinancialsPage() {
  await requireRole(["admin"]);

  const data = await getAdminDashboardData();
  const destinationSummaries = data.destinationRevenue.filter(
    (summary) => summary.booking_count > 0
  );

  const coverPhotosByDestinationId = await getDestinationCoverPhotos(
    destinationSummaries.map((summary) => summary.destination_id)
  );

  const items = destinationSummaries.map((summary) => {
    const serviceCount = new Set(
      data.financialRecords
        .filter((record) => record.destination_id === summary.destination_id)
        .map((record) => record.service_snapshot?.id ?? record.service_snapshot?.title)
    ).size;

    return {
      destinationId: summary.destination_id,
      title: summary.destination_title,
      locationText: summary.destination_location_text,
      staffName: summary.staff_name,
      coverUrl: coverPhotosByDestinationId[summary.destination_id] ?? null,
      serviceCount,
      grossAmount: summary.total_paid_amount,
      settledAmount: summary.settled_amount,
      unsettledAmount: summary.unsettled_amount
    };
  });

  return (
    <DashboardShell
      role="admin"
      title="Destination financials"
      description="Pick a destination to review its full payout history, grouped by service."
    >
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="inline-flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Destinations
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Every destination with at least one paid booking. Open one to see its services,
            bookings, and payout status.
          </p>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No paid bookings recorded yet. Destinations will appear here once a booking is paid.
            </p>
          ) : (
            <DestinationFinancialsList items={items} />
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}