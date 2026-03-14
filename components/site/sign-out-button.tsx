"use client";

import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { createClientSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({ variant = "ghost", size = "sm", className }: ButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClientSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setIsPending(true);
    try {
      await supabase.auth.signOut();
      window.location.assign("/");
    } catch {
      setIsPending(false);
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsDialogOpen(true)}
        disabled={isPending}
      >
        {isPending ? "Signing out..." : "Sign out"}
      </Button>
      <ConfirmationDialog
        open={isDialogOpen}
        title="Sign out now?"
        description="You will be returned to the public homepage after signing out."
        confirmLabel="Sign out"
        confirmVariant="destructive"
        isPending={isPending}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={async () => {
          setIsDialogOpen(false);
          await handleSignOut();
        }}
      />
    </>
  );
}
