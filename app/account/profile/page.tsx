import { AvatarUploadForm } from "@/components/forms/avatar-upload-form";
import { TouristProfileForm } from "@/components/forms/tourist-profile-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth";
import { getProfileBundle } from "@/lib/repositories";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MoveLeft } from "lucide-react";

export default async function TouristProfilePage() {
  const user = await getCurrentUserContext();
  if (!user || user.role !== "user") {
    redirect("/sign-in");
  }

  const profileBundle = await getProfileBundle(user.authUserId);

  return (
    <div className="page-shell space-y-6 py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="gradient-chip w-fit">Profile settings</div>
          <h1 className="page-title">Personal settings</h1>
          <p className="page-intro">
            Manage your personal traveler details and account security.
          </p>
        </div>
        <Link
          href="/account"
          className="flex h-10 w-fit items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-4 text-sm font-medium hover:bg-secondary"
        >
          <MoveLeft className="h-4 w-4" /> Return to bookings
        </Link>
      </div>

      <section className="grid gap-5 lg:grid-cols-[320px,minmax(0,1fr)]">
        <div className="space-y-5">
          <AvatarUploadForm
            currentAvatarUrl={profileBundle?.user.avatar_url ?? null}
            className="w-full"
          />
          <Card className="h-fit w-full overflow-hidden">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <p className="font-display text-2xl font-semibold tracking-tight">Security</p>
                <p className="text-sm text-muted-foreground">
                  Update your password here when you need to change your account access.
                </p>
              </div>
              <Link href="/auth/set-password">
                <Button>Change password</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="h-fit space-y-5">
          <TouristProfileForm
            defaultValues={{
              fullName: profileBundle?.user.full_name,
              phone: profileBundle?.user.phone
            }}
          />
        </div>
      </section>
    </div>
  );
}
