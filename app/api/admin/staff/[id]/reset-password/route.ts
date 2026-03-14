import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { adminResetStaffPasswordSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const payload = adminResetStaffPasswordSchema.parse(await request.json());

    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const currentUser = await getCurrentUserContext();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: staffUser, error: staffLookupError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (staffLookupError) {
      throw new Error(staffLookupError.message);
    }

    if (!staffUser || staffUser.role !== "staff") {
      return NextResponse.json({ error: "Staff user not found." }, { status: 404 });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
      password: payload.password
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      message: "Staff password reset. Share the new temporary password with the staff member."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to reset staff password."
      },
      { status: 400 }
    );
  }
}
