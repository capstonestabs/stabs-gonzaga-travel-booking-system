import { StaffCreateForm } from "@/components/forms/staff-create-form";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminCreateStaffPage() {
  await requireRole(["admin"]);

  return (
    <DashboardShell
      role="admin"
      title="Create staff account"
      description="Create a staff login and its assigned draft destination in one guided form."
    >
      <div className="max-w-4xl space-y-3">
        <div className="rounded-[1rem] border border-border/70 bg-secondary/45 px-4 py-3 text-sm leading-6 text-muted-foreground">
          This creates the login and a draft destination immediately. Share the temporary password securely; no invitation email is sent.
        </div>
        <StaffCreateForm />
      </div>
    </DashboardShell>
  );
}
