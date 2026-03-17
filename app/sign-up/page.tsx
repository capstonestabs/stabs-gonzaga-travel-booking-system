import { Suspense } from "react";

import { AuthForm } from "@/components/forms/auth-form";

export default function SignUpPage() {
  return (
    <div className="page-shell grid gap-6 py-10 lg:grid-cols-[0.92fr,1.08fr]">
      <div className="space-y-4 lg:pt-6">
        <div className="gradient-chip w-fit">Create account</div>
        <h1 className="page-title max-w-2xl">Create your tourist account.</h1>
        <p className="page-intro">
          Reserve trips, confirm plans, and keep your booking history in one place.
        </p>
      </div>
      <div className="flex justify-center lg:justify-end">
        <Suspense fallback={null}>
          <AuthForm mode="sign-up" />
        </Suspense>
      </div>
    </div>
  );
}
