import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { env, hasSupabaseBrowserEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  if (!hasSupabaseBrowserEnv()) {
    return response;
  }

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
    return response;
  }

  const supabase = createServerClient(env.nextPublicSupabaseUrl, env.nextPublicSupabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: any }>
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/bookings");

  if (!user) {
    if (isProtectedPage) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = "/sign-in";
      signInUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, archived_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.archived_at) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    return NextResponse.redirect(signInUrl);
  }

  const role = profile?.role ?? "user";

  if (role === "admin") {
    if (!pathname.startsWith("/admin")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  } else if (role === "staff") {
    if (!pathname.startsWith("/staff")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/staff";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  } else if (role === "user") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/account";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    if (pathname === "/sign-in" || pathname === "/sign-up") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/account";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
