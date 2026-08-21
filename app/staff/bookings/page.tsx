import { DashboardShell } from "@/components/site/dashboard-shell";
import { StaffBookingsManager } from "@/components/site/staff-bookings-manager";
import { requireRole } from "@/lib/auth";
import {
  getBookingsForStaff,
  getDestinationCoverPhotos,
  getServiceCoverPhotos,
  getUserAvatars
} from "@/lib/repositories";

export default async function StaffBookingsPage() {
  const context = await requireRole(["staff"]);
  const bookings = await getBookingsForStaff(context.authUserId, 50);

  const destinationIds = Array.from(
    new Set(bookings.map((booking) => booking.destination_id).filter(Boolean))
  );
  const serviceIds = Array.from(
    new Set(bookings.map((booking) => booking.service_id).filter((id): id is string => Boolean(id)))
  );
  const touristUserIds = Array.from(
    new Set(bookings.map((booking) => booking.user_id).filter(Boolean))
  );

  const [destinationCoverByDestinationId, serviceImagesByServiceId, touristAvatarsByUserId] =
    await Promise.all([
      getDestinationCoverPhotos(destinationIds),
      getServiceCoverPhotos(serviceIds),
      getUserAvatars(touristUserIds)
    ]);

  return (
    <DashboardShell
      role="staff"
      title="Bookings"
      description="Review the bookings received for your assigned destination. Payment is handled centrally by the platform, while staff deliver and complete the service."
    >
      <StaffBookingsManager
        bookings={bookings}
        destinationCoverByDestinationId={destinationCoverByDestinationId}
        serviceImagesByServiceId={serviceImagesByServiceId}
        touristAvatarsByUserId={touristAvatarsByUserId}
      />
    </DashboardShell>
  );
}