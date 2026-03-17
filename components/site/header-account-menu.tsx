"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { SignOutButton } from "@/components/site/sign-out-button";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

function HeaderAvatar({
  name,
  avatarUrl,
  scenic
}: {
  name: string;
  avatarUrl: string | null;
  scenic: boolean;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          "h-10 w-10 rounded-full object-cover",
          scenic ? "border border-white/22" : "border border-emerald-900/12"
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
        scenic ? "bg-white text-primary" : "bg-primary text-primary-foreground"
      )}
    >
      {getInitials(name)}
    </span>
  );
}

export function HeaderAccountMenu({
  name,
  email,
  avatarUrl,
  scenic = false
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  scenic?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;

      if (target?.closest("[data-confirmation-dialog='true']")) {
        return;
      }

      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (document.querySelector("[data-confirmation-dialog='true']")) {
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant={scenic ? "outline" : "ghost"}
        size="sm"
        className={cn(
          "h-11 min-w-0 gap-2 rounded-full px-1.5",
          scenic
            ? "border-white/16 bg-white/10 text-white hover:bg-white/16 hover:text-white"
            : "text-emerald-950 hover:bg-emerald-950/8"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        onClick={() => setOpen((current) => !current)}
      >
        <HeaderAvatar name={name} avatarUrl={avatarUrl} scenic={scenic} />
        <ChevronDown className={cn("hidden h-4 w-4 sm:block", open ? "rotate-180" : "")} />
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.55rem)] z-[125] w-[min(18rem,88vw)] overflow-hidden rounded-[1.1rem] border border-border/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,246,0.98))] shadow-[0_20px_48px_rgba(14,30,20,0.18)]"
        >
          <div className="flex items-center gap-3 border-b border-border/70 px-3.5 py-3">
            <HeaderAvatar name={name} avatarUrl={avatarUrl} scenic={false} />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="grid gap-1.5 p-2">
            <SignOutButton
              variant="outline"
              className="min-h-11 w-full justify-start rounded-[0.95rem] px-3 text-sm"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
