import type { Route } from "next";
import { redirect } from "next/navigation";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppUser, UserRole } from "@/lib/types";
import { hasSupabaseBrowserEnv, hasSupabaseServiceEnv } from "@/lib/env";

export interface CurrentUserContext {
  authUserId: string;
  email: string;
  profile: AppUser | null;
  role: UserRole;
}

export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  if (!hasSupabaseServiceEnv()) {
    return {
      authUserId: user.id,
      email: user.email ?? "",
      profile: null,
      role: "user"
    };
  }

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<AppUser>();

  if (profile?.archived_at) {
    return null;
  }

  return {
    authUserId: user.id,
    email: user.email ?? "",
    profile: profile ?? null,
    role: profile?.role ?? "user"
  };
}

export async function requireAuthenticatedUser() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in");
  }

  return context;
}

export async function requireRole(roles: UserRole[]) {
  const context = await requireAuthenticatedUser();

  if (context.profile?.archived_at) {
    redirect("/sign-in");
  }

  if (!roles.includes(context.role)) {
    redirect(
      (context.role === "user"
        ? "/account"
        : context.role === "admin"
          ? "/admin"
          : "/staff") as Route
    );
  }

  return context;
}
