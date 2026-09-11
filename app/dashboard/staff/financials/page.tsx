import { DashboardShell } from "@/components/site/dashboard-shell";
import { AdminFinancialOverview } from "@/components/site/admin-financial-overview";
import { requireRole } from "@/lib/auth";
import {
  getFinancialRecordsForStaff,
} from "@/lib/repositories";

export default async function StaffFinancialsPage() {
  const context = await requireRole(["staff"]);

  const records = await getFinancialRecordsForStaff(context.authUserId);

  return (
    <DashboardShell
      role="staff"
      title="Financials"
      description="View and manage financials"
    >
      <AdminFinancialOverview records={records} />
    </DashboardShell>
  );
}