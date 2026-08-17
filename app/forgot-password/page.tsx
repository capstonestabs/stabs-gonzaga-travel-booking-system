import { KeyRound, ShieldAlert } from "lucide-react";

import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="page-shell grid gap-6 py-10 lg:grid-cols-[0.92fr,1.08fr]">
      <div className="space-y-4 lg:pt-6">
        <div className="gradient-chip inline-flex w-fit items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Tourist recovery
        </div>
        <h1 className="page-title max-w-2xl">
          Recover a tourist password by email.
        </h1>
        <p className="page-intro">
          Enter the tourist email address to receive a reset link. Staff accounts stay under admin
          control and are not reset from this page.
        </p>
        <div className="rounded-[1rem] border border-border/70 bg-muted/35 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Staff accounts
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            If a staff member forgets the password, the system will show a contact-admin message
            instead of sending email recovery.
          </p>
        </div>
      </div>
      <div className="flex justify-center lg:justify-end">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
