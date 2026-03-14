import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  env,
  getSiteUrl,
  hasSupabaseBrowserEnv,
  hasSupabaseServiceEnv
} from "@/lib/env";
import { resendConfirmationSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const TOURIST_CONFIRMATION_MESSAGE =
  "If the email belongs to a tourist account that still needs confirmation, a new confirmation link has been sent.";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseBrowserEnv() || !hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing." },
        { status: 503 }
      );
    }

    const payload = resendConfirmationSchema.parse(await request.json());
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
      return NextResponse.json({ message: TOURIST_CONFIRMATION_MESSAGE });
    }

    if (user.role === "staff") {
      return NextResponse.json({
        message: "Please contact admin. This is a staff account for security reasons.",
        mode: "staff"
      });
    }

    if (user.role === "admin") {
      return NextResponse.json({
        message: "Admin email confirmation is handled directly by the system owner.",
        mode: "admin"
      });
    }

    const supabase = createClient(env.nextPublicSupabaseUrl, env.nextPublicSupabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const emailRedirectUrl = `${getSiteUrl()}/auth/callback`;
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: emailRedirectUrl
      }
    });

    if (resendError) {
      throw new Error(resendError.message);
    }

    return NextResponse.json({
      message: TOURIST_CONFIRMATION_MESSAGE,
      mode: "tourist"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to resend confirmation email."
      },
      { status: 400 }
    );
  }
}
