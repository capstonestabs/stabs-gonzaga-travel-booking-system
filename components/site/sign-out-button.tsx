"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { createClientSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignOutButton({ variant = "ghost", size = "sm", className, collapsed }: ButtonProps & { collapsed?: boolean }) {
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
        className={cn(className, "text-sm")}
        onClick={() => setIsDialogOpen(true)}
        disabled={isPending}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!collapsed && (isPending ? "Signing out..." : "Sign out")}
      </Button>
      <ConfirmationDialog
        open={isDialogOpen}
        title="Sign out now?"
        description="Your current session will end and you will be returned to the public homepage."
        icon={<LogOut className="h-5 w-5" />}
        confirmLabel="Sign out"
        pendingConfirmLabel="Signing out..."
        confirmVariant="destructive"
        isPending={isPending}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleSignOut}
      />
    </>
  );
}
