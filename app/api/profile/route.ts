import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { selfProfileSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceEnv } from "@/lib/env";

export async function PATCH(request: NextRequest) {
  try {
    const payload = selfProfileSchema.parse(await request.json());

    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { error: userError } = await supabase
      .from("users")
      .update({
        full_name: payload.fullName,
        phone: payload.phone || null,
        avatar_url: payload.avatarUrl || user.profile?.avatar_url || null
      })
      .eq("id", user.authUserId);

    if (userError) {
      throw new Error(userError.message);
    }

    if (user.role === "staff") {
      const { error: staffError } = await supabase
        .from("staff_profiles")
        .upsert(
          {
            user_id: user.authUserId,
            contact_email: payload.contactEmail || user.email,
            contact_phone: payload.contactPhone || null
          },
          {
            onConflict: "user_id"
          }
        );

      if (staffError) {
        throw new Error(staffError.message);
      }
    }

    return NextResponse.json({
      message: "Account updated."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update profile."
      },
      { status: 400 }
    );
  }
}
