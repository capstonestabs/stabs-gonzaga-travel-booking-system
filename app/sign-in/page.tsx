import { Suspense } from "react";

import { AuthForm } from "@/components/forms/auth-form";

export default function SignInPage() {
  return (
    <div className="page-shell grid gap-6 py-10 lg:grid-cols-[0.92fr,1.08fr]">
      <div className="space-y-4 lg:pt-6">
        <div className="gradient-chip w-fit">Tourist, staff, admin</div>
        <h1 className="page-title max-w-2xl">
          Sign in when you are ready to continue.
        </h1>
        <p className="page-intro">
          Guests can browse listings without an account. Sign in here to continue checkout, review
          your bookings, or access staff and admin workspaces.
        </p>
      </div>
      <div className="flex justify-center lg:justify-end">
        <Suspense fallback={null}>
          <AuthForm mode="sign-in" />
        </Suspense>
      </div>
    </div>
  );
}
