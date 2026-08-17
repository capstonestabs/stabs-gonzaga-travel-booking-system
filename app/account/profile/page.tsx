import { AvatarUploadForm } from "@/components/forms/avatar-upload-form";
import { TouristProfileForm } from "@/components/forms/tourist-profile-form";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth";
import { getProfileBundle } from "@/lib/repositories";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";

export default async function TouristProfilePage() {
  const user = await getCurrentUserContext();
  if (!user || user.role !== "user") {
    redirect("/sign-in");
  }

  const profileBundle = await getProfileBundle(user.authUserId);

  return (
    <DashboardShell
      role="user"
      title="Account settings"
      description="Manage your personal traveler details, avatar, and password from one settings page."
    >
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
                  <Button>
                    <KeyRound className="h-4 w-4" />
                    Change password
                  </Button>
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
    </DashboardShell>
  );
}
