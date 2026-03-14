import { StaffCreateForm } from "@/components/forms/staff-create-form";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";

export default async function AdminCreateStaffPage() {
  await requireRole(["admin"]);

  return (
    <DashboardShell
      role="admin"
      title="Create staff account"
      description="Create the login, draft destination, and admin-managed location in one step so the staff member can complete services and destination details later."
    >
      <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <CardTitle>Before you create</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-sm text-muted-foreground">
            <p>Destination and location are set by admin at creation time.</p>
            <p>Staff can manage service packages, destination details, media, pricing, and booking operations later.</p>
            <p>No invite email is sent. Share the default password with the staff member directly.</p>
          </CardContent>
        </Card>

        <StaffCreateForm />
      </div>
    </DashboardShell>
  );
}
