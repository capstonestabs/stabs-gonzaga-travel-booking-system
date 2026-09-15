import { UsersRound } from "lucide-react";

import { AdminTouristAccountsPanel } from "@/components/site/dmin-tourist-accounts-panel";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/repositories";

export default async function AdminTouristAccountsPage() {
  await requireRole(["admin"]);

  const data = await getAdminDashboardData();

  return (
    <DashboardShell
      role="admin"
      title="Tourist accounts"
      description="Review tourist accounts and remove access when a public account should no longer sign in."
    >
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <div>
            <CardTitle className="inline-flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-primary" />
              Tourist accounts
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Review account activity and manage access without losing historical records.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-4">
          <AdminTouristAccountsPanel
            activeTourists={data.tourists}
            archivedTourists={data.archivedTourists}
            bookingActivity={data.bookingActivity}
          />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}