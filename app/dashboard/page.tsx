import type { Route } from "next";
import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/auth";

export default async function DashboardIndexPage() {
  const user = await getCurrentUserContext();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role === "admin") {
    redirect("/admin" as Route);
  }

  if (user.role === "staff") {
    redirect("/staff" as Route);
  }

  redirect("/account");
}
