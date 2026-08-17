import type { Route } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthForm } from "@/components/forms/auth-form";
import { getCurrentUserContext } from "@/lib/auth";

export default async function SignInPage() {
  const user = await getCurrentUserContext();

  if (user) {
    if (user.role === "admin") {
      redirect("/admin" as Route);
    }
    if (user.role === "staff") {
      redirect("/staff" as Route);
    }
    redirect("/account" as Route);
  }

  return (
    <div className="page-shell grid gap-6 py-10 lg:grid-cols-[0.92fr,1.08fr]">
      <div className="space-y-4 lg:pt-6">
        
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
