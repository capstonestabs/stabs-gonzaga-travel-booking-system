import type { Route } from "next";
import Link from "next/link";

import { DashboardNav } from "@/components/site/dashboard-nav";
import { HeaderAccountMenu } from "@/components/site/header-account-menu";
import { workspaceNavByRole } from "@/components/site/workspace-nav-config";
import { blueprintLogo } from "@/lib/blueprint";

export function StaffHeader({
  account
}: {
  account: { name: string; email: string; avatarUrl: string | null } | null;
}) {
  return (
    <header className="sticky top-0 z-20 bg-white/95 px-4 py-2.5 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="xl:hidden">
            <DashboardNav items={workspaceNavByRole.staff} variant="drawer" />
          </div>

          <Link href={"/staff" as Route} prefetch className="flex items-center gap-2.5">
            <img src={blueprintLogo} alt="Gonzaga Travel Bookings logo" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-display text-base font-semibold tracking-tight text-emerald-950">STABS</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-900/70">
                Gonzaga Travel Bookings
              </p>
            </div>
          </Link>
        </div>

        {account ? (
          <HeaderAccountMenu name={account.name} email={account.email} avatarUrl={account.avatarUrl} role="staff" />
        ) : null}
      </div>
    </header>
  );
}