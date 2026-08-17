import { UsersRound } from "lucide-react";

import { AdminTouristList } from "@/components/site/admin-tourist-list";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Badge } from "@/components/ui/badge";
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="inline-flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-primary" />
                Active tourist accounts
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Review account activity and manage access without losing historical records.
              </p>
            </div>
            <Badge variant="muted">{data.tourists.length} active</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-4">
          <AdminTouristList
            tourists={data.tourists}
            bookingActivity={data.bookingActivity}
            emptyMessage="No tourist accounts have been created yet."
          />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
