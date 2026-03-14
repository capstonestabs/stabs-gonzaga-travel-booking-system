import type { Route } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { AdminStaffList } from "@/components/site/admin-staff-list";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/repositories";

export default async function AdminStaffAccountsPage() {
  await requireRole(["admin"]);

  const data = await getAdminDashboardData();

  return (
    <DashboardShell
      role="admin"
      title="Staff accounts"
      description="Open staff details, review assigned destinations and service counts, reset passwords, or archive inactive accounts."
    >
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All active staff accounts</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Each staff account is linked to one destination, while service packages are managed on the staff side.
              </p>
            </div>
            <Link href={"/admin/staff/create" as Route}>
              <Button size="sm" className="w-full sm:w-auto">
                Create staff account
                <PlusCircle className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <AdminStaffList
            staff={data.staff}
            listings={data.listings}
            emptyMessage="No staff accounts yet. Create the first one from this page."
          />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
