import Link from "next/link";

import { AvatarUploadForm } from "@/components/forms/avatar-upload-form";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getProfileBundle } from "@/lib/repositories";

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

  return (
    <DashboardShell
      role="staff"
      title="Account management"
      description="Update the avatar and password for this staff account."
    >
      <section className="space-y-5">
        <div className="space-y-2">
          <div className="gradient-chip w-fit">Account management</div>
          <p className="text-sm text-muted-foreground">
            Use this page to manage only the staff account access and avatar.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px,minmax(0,1fr)]">
          <AvatarUploadForm
            currentAvatarUrl={profileBundle.user.avatar_url}
            className="w-full"
          />
          <div className="grid gap-5">
          <Card className="h-fit w-full overflow-hidden">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="space-y-2">
                <p className="font-display text-2xl font-semibold tracking-tight">Login email</p>
                <p className="text-sm text-muted-foreground">
                  This email is used only for staff sign-in. Only the admin can change it.
                </p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-muted/35 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Staff login email
                </p>
                <p className="mt-2 break-all text-sm font-medium text-foreground">
                  {profileBundle.user.email}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="h-fit w-full overflow-hidden">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="space-y-2">
                <p className="font-display text-2xl font-semibold tracking-tight">Security</p>
                <p className="text-sm text-muted-foreground">
                  Update your password here when you need to change your account access.
                </p>
              </div>
              <div className="border-t border-border/60 pt-4">
                <Link href="/auth/set-password">
                  <Button className="w-full sm:w-auto">Change password</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <CardTitle>Destination manager account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5 sm:p-6">
            <p className="text-sm leading-6 text-muted-foreground">
              This page is only for staff account access. The destination contact email and contact
              number shown to tourists are managed from the destination page and do not change the
              staff login email.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/staff/destination">
                <Button variant="outline" size="sm">
                  Open destination page
                </Button>
              </Link>
              <Link href="/staff/services">
                <Button variant="outline" size="sm">
                  Open services page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  );
}
