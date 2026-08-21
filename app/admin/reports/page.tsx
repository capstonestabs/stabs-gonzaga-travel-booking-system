import { BarChart3 } from "lucide-react";

import { ComingSoonPlaceholder } from "@/components/site/coming-soon-placeholder";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminReportsPage() {
  await requireRole(["admin"]);

  return (
    <DashboardShell
      role="admin"
      title="Reports & Analytics"
      description="Deeper insights and exportable reports across bookings, revenue, and destinations."
    >
      <ComingSoonPlaceholder
        title="Reports & Analytics is coming soon"
        message="Detailed charts, exportable reports, and trend analysis will appear here in a future update."
        icon={BarChart3}
      />
    </DashboardShell>
  );
}