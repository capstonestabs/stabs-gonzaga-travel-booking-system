import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { env, getSiteUrl, hasSupabaseBrowserEnv, hasSupabaseServiceEnv } from "@/lib/env";
import { forgotPasswordSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const TOURIST_RECOVERY_MESSAGE =
  "If the email belongs to a tourist account, a password reset link has been sent.";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseBrowserEnv() || !hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing." },
        { status: 503 }
      );
    }

    const payload = forgotPasswordSchema.parse(await request.json());
    const email = payload.email.trim().toLowerCase();
    const adminSupabase = createAdminSupabaseClient();
    const { data: user, error: userError } = await adminSupabase
      .from("users")
      .select("id, role, archived_at")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!user || user.archived_at) {
      return NextResponse.json({ message: TOURIST_RECOVERY_MESSAGE });
    }

    if (user.role === "staff") {
      return NextResponse.json({
        message: "Please contact admin. This is a staff account for security reasons.",
        mode: "staff"
      });
    }

    if (user.role === "admin") {
      return NextResponse.json({
        message: "Admin password recovery is handled directly by the system owner.",
        mode: "admin"
      });
    }

    const supabase = createClient(env.nextPublicSupabaseUrl, env.nextPublicSupabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const redirectTo = `${getSiteUrl()}/auth/callback?next=/auth/set-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (resetError) {
      throw new Error(resetError.message);
    }

    return NextResponse.json({
      message: TOURIST_RECOVERY_MESSAGE,
      mode: "tourist"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start password recovery."
      },
      { status: 400 }
    );
  }
}
