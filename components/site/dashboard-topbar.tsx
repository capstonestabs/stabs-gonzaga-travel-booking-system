import { DashboardAccountButton } from "@/components/site/dashboard-account-button";
import { cn } from "@/lib/utils";

export function DashboardTopbar({
  account
}: {
  account: { name: string; email: string; avatarUrl: string | null };
}) {
  return (
    <header className={cn("dashboard-glass-topbar flex h-16 items-center justify-end px-4 sm:px-6")}>
      <DashboardAccountButton account={account} />
    </header>
  );
}