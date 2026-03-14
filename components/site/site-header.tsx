import { getCurrentUserContext } from "@/lib/auth";

import { SiteHeaderClient } from "@/components/site/site-header-client";

export async function SiteHeader() {
  const user = await getCurrentUserContext();

  return <SiteHeaderClient role={user?.role ?? null} />;
}
