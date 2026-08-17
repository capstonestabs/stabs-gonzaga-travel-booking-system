import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AvatarUploadForm } from "@/components/forms/avatar-upload-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { ProfileSummaryCard } from "@/components/site/profile-summary-card";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import { getProfileBundle } from "@/lib/repositories";

export default async function ProfilePage() {
  const context = await getCurrentUserContext();
  if (!context) {
    redirect("/sign-in");
  }

  if (context.role === "staff") {
    redirect("/staff/account" as Route);
  }

  const userId = context.authUserId;
  const role = context.role;
  const profileBundle =
    (await getProfileBundle(userId)) ?? {
      user: {
        id: context.authUserId,
        email: context.email,
        full_name: context.profile?.full_name ?? null,
        role,
        phone: context.profile?.phone ?? null,
        avatar_url: context.profile?.avatar_url ?? null,
        created_at: context.profile?.created_at ?? new Date().toISOString(),
        updated_at: context.profile?.updated_at ?? new Date().toISOString()
      },
      staffProfile: null
    };

  const accountContent = (
    <>
      <ProfileSummaryCard
        role={role}
        user={profileBundle.user}
        email={context.email}
        staffProfile={profileBundle.staffProfile}
        heading="Account summary"
      />

      <div className="grid items-start gap-5 lg:grid-cols-[320px,minmax(0,1fr)]">
        <AvatarUploadForm currentAvatarUrl={profileBundle.user.avatar_url} />
        <ProfileForm
          mode="self"
          role={role}
          email={context.email}
          initialUser={profileBundle.user}
          initialStaffProfile={profileBundle.staffProfile}
          endpoint="/api/profile"
        />
      </div>
    </>
  );

  if (role === "user") {
    return (
      <DashboardShell
        role="user"
        title="Account settings"
        description="Update your traveler details, avatar, and personal account information from one settings page."
      >
        {accountContent}
      </DashboardShell>
    );
  }

  return (
    <div className="page-shell space-y-6 py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="gradient-chip w-fit">Account settings</div>
          <h1 className="page-title">Manage your account</h1>
          <p className="page-intro">
            Update your account details and avatar from one page.
          </p>
        </div>
        <Link href={"/admin" as Route}>
          <Button variant="secondary" className="w-full sm:w-auto">Back to admin panel</Button>
        </Link>
      </div>

      {accountContent}
    </div>
  );
}
