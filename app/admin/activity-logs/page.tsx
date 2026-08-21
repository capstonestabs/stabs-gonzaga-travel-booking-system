import { ClipboardList } from "lucide-react";

import { ComingSoonPlaceholder } from "@/components/site/coming-soon-placeholder";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminActivityLogsPage() {
  await requireRole(["admin"]);

  return (
    <DashboardShell
      role="admin"
      title="Activity Logs"
      description="A record of actions taken across the platform."
    >
      <ComingSoonPlaceholder
        title="Activity Logs is coming soon"
        message="A searchable audit trail of admin, staff, and system actions will appear here in a future update."
        icon={ClipboardList}
      />
    </DashboardShell>
  );
}