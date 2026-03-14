import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { env, hasSupabaseBrowserEnv } from "@/lib/env";
import { getSafeRedirectPath } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"), "/dashboard");

  if (!hasSupabaseBrowserEnv()) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL(next, request.url));
  const supabase = createServerClient(env.nextPublicSupabaseUrl, env.nextPublicSupabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
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

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return response;
  }

  if (tokenHash && type) {
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType
    });
  }

  return response;
}
