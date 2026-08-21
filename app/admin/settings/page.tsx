import { Settings } from "lucide-react";

import { ComingSoonPlaceholder } from "@/components/site/coming-soon-placeholder";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminSettingsPage() {
  await requireRole(["admin"]);

  return (
    <DashboardShell
      role="admin"
      title="Settings"
      description="Platform-wide configuration and preferences."
    >
      <ComingSoonPlaceholder
        title="Settings is coming soon"
        message="Platform configuration options will be available here in a future update."
        icon={Settings}
      />
    </DashboardShell>
  );
}