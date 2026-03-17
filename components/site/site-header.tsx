import { getCurrentUserContext } from "@/lib/auth";

import { SiteHeaderClient } from "@/components/site/site-header-client";

export async function SiteHeader() {
  const user = await getCurrentUserContext();

  return (
    <SiteHeaderClient
      role={user?.role ?? null}
      account={
        user
          ? {
              name: user.profile?.full_name ?? user.email,
              email: user.email,
              avatarUrl: user.profile?.avatar_url ?? null
            }
          : null
      }
    />
  );
}
