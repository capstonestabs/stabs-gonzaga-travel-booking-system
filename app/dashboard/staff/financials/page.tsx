import { DashboardShell } from "@/components/site/dashboard-shell";
import { DestinationFinancialsPanel } from "@/components/site/destination-financials-panel";
import { requireRole } from "@/lib/auth";
import {
  getFinancialRecordsForStaff,
  getServiceCoverPhotos,
  getStaffDashboardData,
  getUserAvatars
} from "@/lib/repositories";

export default async function StaffFinancialsPage() {
  const context = await requireRole(["staff"]);

  const [records, dashboardData] = await Promise.all([
    getFinancialRecordsForStaff(context.authUserId),
    getStaffDashboardData(context.authUserId)
  ]);

  const destinationTitle = dashboardData.listings[0]?.title ?? "Your destination";

  const serviceIds = Array.from(
    new Set(
      records
        .map((record) => record.service_snapshot?.id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const touristUserIds = Array.from(new Set(records.map((record) => record.user_id)));

  const [serviceImagesByServiceId, touristAvatarsByUserId] = await Promise.all([
    getServiceCoverPhotos(serviceIds),
    getUserAvatars(touristUserIds)
  ]);

  const destinationCoverUrl = dashboardData.listings[0]?.cover_url ?? null;

  return (
    <DashboardShell
      role="staff"
      title="Financials & Payouts"
      description="Track earnings, view payout status, and see which services generated your bookings."
    >
      <DestinationFinancialsPanel
        destinationTitle={destinationTitle}
        records={records}
        readOnly
        serviceImagesByServiceId={serviceImagesByServiceId}
        touristAvatarsByUserId={touristAvatarsByUserId}
        destinationCoverUrl={destinationCoverUrl}
      />
    </DashboardShell>
  );
}