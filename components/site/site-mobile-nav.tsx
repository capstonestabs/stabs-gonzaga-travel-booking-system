import { getCurrentUserContext } from "@/lib/auth";
import { MobileBottomNav } from "@/components/site/mobile-bottom-nav";

export async function SiteMobileNav() {
  const user = await getCurrentUserContext();
  return <MobileBottomNav role={user?.role ?? null} />;
}
