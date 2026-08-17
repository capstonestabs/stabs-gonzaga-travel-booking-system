import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceEnv } from "@/lib/env";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const user = await getCurrentUserContext();
    if (!user || user.role !== "user") {
      return NextResponse.json({ error: "Tourist access required." }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    
    const { error: profileError } = await supabase
      .from("users")
      .update({
        full_name: body.fullName || null,
        phone: body.phone || null
      })
      .eq("id", user.authUserId);

    if (profileError) throw new Error(profileError.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update profile." },
      { status: 400 }
    );
  }
}
