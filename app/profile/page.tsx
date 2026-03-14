import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AvatarUploadForm } from "@/components/forms/avatar-upload-form";
import { ProfileForm } from "@/components/forms/profile-form";
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

  const backHref = role === "admin" ? "/admin" : "/account";
  const backLabel = role === "admin" ? "Back to admin panel" : "Back to bookings";

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
        <Link href={backHref as Route}>
          <Button variant="secondary" className="w-full sm:w-auto">{backLabel}</Button>
        </Link>
      </div>

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

    </div>
  );
}
