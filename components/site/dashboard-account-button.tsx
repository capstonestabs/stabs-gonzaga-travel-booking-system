"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClientSupabaseBrowserClient } from "@/lib/supabase/client";

export function DashboardAccountButton({
  account
}: {
  account: { name: string; email: string; avatarUrl: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = account.name
    ? account.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClientSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="dashboard-glass-chip flex items-center gap-2 py-1 pl-1 pr-3 transition-colors hover:bg-white/80"
      >
        {account.avatarUrl ? (
          <img src={account.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initials}
          </span>
        )}
        <span className="max-w-[7rem] truncate text-sm font-medium text-foreground">
          {account.name}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-foreground/60 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="dashboard-glass-panel-solid absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 p-1.5">
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-foreground">{account.name}</p>
            <p className="truncate text-xs text-muted-foreground">{account.email}</p>
          </div>
          <div className="my-1 h-px bg-border/70" />
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/80 hover:bg-secondary/60"
          >
            <User className="h-4 w-4" />
            Profile settings
          </Link>
          <div className="my-1 h-px bg-border/70" />
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}