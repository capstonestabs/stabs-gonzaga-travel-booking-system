import { DashboardShell } from "@/components/site/dashboard-shell";
import { StaffBookingsManager } from "@/components/site/staff-bookings-manager";
import { requireRole } from "@/lib/auth";
import { getBookingsForStaff } from "@/lib/repositories";

export default async function StaffBookingsPage() {
  const context = await requireRole(["staff"]);
  const bookings = await getBookingsForStaff(context.authUserId, 50);

  return (
    <DashboardShell
      role="staff"
      title="Bookings"
      description="Review the bookings received for your assigned destination. Payment is handled centrally by the platform, while staff deliver and complete the service."
    >
      <StaffBookingsManager bookings={bookings} />
    </DashboardShell>
  );
}
