import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminDeleteStaffForm } from "@/components/forms/admin-delete-staff-form";
import { AdminDestinationAssignmentForm } from "@/components/forms/admin-destination-assignment-form";
import { AdminStaffPasswordForm } from "@/components/forms/admin-staff-password-form";
import { ProfileSummaryCard } from "@/components/site/profile-summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getDestinationForStaff, getStaffMemberProfile } from "@/lib/repositories";

export default async function AdminStaffProfilePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await requireRole(["admin"]);

  const bundle = await getStaffMemberProfile(id);
  const destination = await getDestinationForStaff(id);

  if (!bundle) {
    notFound();
  }

  return (
    <div className="page-shell space-y-6 py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="gradient-chip w-fit">Admin staff management</div>
          <h1 className="page-title">Manage staff account</h1>
          <p className="page-intro">
            View staff information, review the assigned destination and service count, update the assigned location, reset password, or delete the staff account from active access.
          </p>
        </div>
        <Link href={"/admin/staff" as Route}>
          <Button variant="secondary" className="w-full sm:w-auto">Back to staff accounts</Button>
        </Link>
      </div>

      <ProfileSummaryCard
        role="staff"
        user={bundle.user}
        email={bundle.user.email}
        staffProfile={bundle.staffProfile}
        heading="Staff information"
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <CardTitle>What admin can manage here</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 p-4 text-sm text-muted-foreground sm:p-5">
            <p>View staff account information.</p>
            <p>Update the assigned location for the destination.</p>
            <p>Reset the staff password.</p>
            <p>Delete the staff account from active access when needed.</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Assigned destination</CardTitle>
              <Link href={"#destination-assignment" as Route}>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Edit destination
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 text-sm sm:grid-cols-3 sm:p-5">
            <div className="rounded-[1rem] bg-muted/45 px-3.5 py-3 sm:px-4">
              <p className="text-muted-foreground">Destination</p>
              <p className="mt-1 font-medium">{destination?.title ?? "Not assigned"}</p>
            </div>
            <div className="rounded-[1rem] bg-muted/45 px-3.5 py-3 sm:px-4">
              <p className="text-muted-foreground">Location</p>
              <p className="mt-1 font-medium">{destination?.location_text ?? "Not set"}</p>
            </div>
            <div className="rounded-[1rem] bg-muted/45 px-3.5 py-3 sm:px-4">
              <p className="text-muted-foreground">Services</p>
              <p className="mt-1 font-medium">
                {destination?.destination_services?.length ?? 0} configured
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-5">
          <AdminStaffPasswordForm staffId={bundle.user.id} />
          <AdminDeleteStaffForm
            staffId={bundle.user.id}
            staffName={bundle.user.full_name ?? bundle.user.email}
            redirectTo={"/admin/staff" as Route}
          />
        </div>
      </div>

      <AdminDestinationAssignmentForm
        staffId={bundle.user.id}
        defaultDestinationTitle={destination?.title ?? ""}
        defaultLocationText={destination?.location_text ?? ""}
        hasDestination={Boolean(destination)}
      />
    </div>
  );
}
