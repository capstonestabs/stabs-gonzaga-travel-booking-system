import type { Route } from "next";
import Link from "next/link";
import { UsersRound } from "lucide-react";

import { AdminTouristList } from "@/components/site/admin-tourist-list";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Button } from "@/components/ui/button";
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
      description="Review tourist accounts and archive access when a public account should no longer sign in."
    >
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="inline-flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-primary" />
                Active tourist accounts
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Archive tourist access without removing historical bookings already recorded in the system.
              </p>
            </div>
            <Link href={"/admin" as Route}>
              <Button variant="outline" size="sm">
                Back to admin overview
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
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
