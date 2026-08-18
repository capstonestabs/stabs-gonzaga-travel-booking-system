import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package, TentTree } from "lucide-react";

import { AdminDeleteStaffForm } from "@/components/forms/admin-delete-staff-form";
import { AdminDestinationAssignmentForm } from "@/components/forms/admin-destination-assignment-form";
import { DestinationStatusActions } from "@/components/forms/destination-status-actions";
import { AdminStaffPasswordForm } from "@/components/forms/admin-staff-password-form";
import { DashboardShell } from "@/components/site/dashboard-shell";
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
    <DashboardShell
      role="admin"
      title={bundle.user.full_name ?? "Manage staff account"}
      description="Review this staff account, its assigned destination, login access, and administrative controls."
    >
      <div className="flex justify-end">
        <Link href={"/admin/staff" as Route}>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Staff accounts
          </Button>
        </Link>
      </div>

      <ProfileSummaryCard
        role="staff"
        user={bundle.user}
        email={bundle.user.email}
        staffProfile={bundle.staffProfile}
        heading="Staff information"
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr),minmax(18rem,0.75fr)] xl:items-start">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/70 py-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Assigned destination</CardTitle>
                <Link href={"#destination-assignment" as Route}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3">
              {[
                { label: "Destination", value: destination?.title ?? "Not assigned", icon: TentTree },
                { label: "Location", value: destination?.location_text ?? "Not set", icon: MapPin },
                { label: "Services", value: `${destination?.destination_services?.length ?? 0} configured`, icon: Package }
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 rounded-[0.95rem] border border-border/60 bg-muted/30 p-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
                    <p className="mt-1 break-words font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
            {destination ? (
              <CardContent className="border-t border-border/70 p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                      Listing status
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Keep the destination in draft, publish it for tourists, or archive it when it is no longer active.
                    </p>
                  </div>
                  <DestinationStatusActions
                    destinationId={destination.id}
                    currentStatus={destination.status}
                  />
                </div>
              </CardContent>
            ) : null}
          </Card>

          <AdminDestinationAssignmentForm
            staffId={bundle.user.id}
            defaultDestinationTitle={destination?.title ?? ""}
            defaultLocationText={destination?.location_text ?? ""}
            hasDestination={Boolean(destination)}
          />
        </div>

        <div className="grid gap-4">
          <AdminStaffPasswordForm staffId={bundle.user.id} />
          <AdminDeleteStaffForm
            staffId={bundle.user.id}
            staffName={bundle.user.full_name ?? bundle.user.email}
            redirectTo={"/admin/staff" as Route}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
