import Link from "next/link";

import { AvatarUploadForm } from "@/components/forms/avatar-upload-form";
import { DestinationImageUpload } from "@/components/forms/destination-image-upload";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getDestinationForStaff, getProfileBundle } from "@/lib/repositories";

export default async function StaffAccountManagementPage() {
  const context = await requireRole(["staff"]);
  const profileBundle =
    (await getProfileBundle(context.authUserId)) ?? {
      user: {
        id: context.authUserId,
        email: context.email,
        full_name: context.profile?.full_name ?? null,
        role: "staff" as const,
        phone: context.profile?.phone ?? null,
        avatar_url: context.profile?.avatar_url ?? null,
        created_at: context.profile?.created_at ?? new Date().toISOString(),
        updated_at: context.profile?.updated_at ?? new Date().toISOString()
      },
      staffProfile: null
    };

  const destination = await getDestinationForStaff(context.authUserId);

  return (
    <DashboardShell
      role="staff"
      title="Account management"
      description="Update your avatar, manage login details, and keep destination photos current."
    >
      <div className="space-y-6">
        {/* Photos: avatar (narrow) + destination images (wide) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,minmax(0,1fr)] lg:items-start">
          <AvatarUploadForm currentAvatarUrl={profileBundle.user.avatar_url} />

          {destination ? (
            <DestinationImageUpload
              destinationId={destination.id}
              coverUrl={destination.cover_url}
              galleryImages={destination.destination_images ?? []}
            />
          ) : (
            <Card>
              <CardHeader className="border-b border-border/70">
                <CardTitle>Destination images</CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                <p className="text-sm text-muted-foreground">
                  No destination is assigned to this staff account yet. Contact an admin to
                  assign a destination.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Account: login email + security, side by side to use full width */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle className="text-base">Login email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-muted-foreground">
                Used only for staff sign-in. Only an admin can change it.
              </p>
              <div className="rounded-[1rem] border border-border/70 bg-muted/35 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Staff email
                </p>
                <p className="mt-1.5 break-all text-sm font-medium text-foreground">
                  {profileBundle.user.email}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle className="text-base">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-muted-foreground">
                Change the password used to access your staff account.
              </p>
              <Link href="/auth/set-password" className="block">
                <Button className="w-full sm:w-auto">Change password</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer note, full width */}
        <Card>
          <CardHeader className="border-b border-border/70">
            <CardTitle>Destination manager account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5 sm:p-6">
            <p className="text-sm leading-6 text-muted-foreground">
              This page only covers staff account access. Services, packages, pricing, daily slot
              capacity, and closure dates are managed from the services page.
            </p>
            <Link href="/staff/services">
              <Button variant="outline" size="sm">
                Open services page
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}