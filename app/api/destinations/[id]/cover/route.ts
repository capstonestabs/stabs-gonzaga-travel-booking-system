import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { removePublicAsset } from "@/lib/storage";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const user = await getCurrentUserContext();
    if (!user || (user.role !== "staff" && user.role !== "admin")) {
      return NextResponse.json({ error: "Staff or admin access required." }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: destination, error: destinationError } = await supabase
      .from("destinations")
      .select("id, staff_id, cover_path")
      .eq("id", id)
      .maybeSingle();

    if (destinationError) {
      throw new Error(destinationError.message);
    }

    if (!destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    if (user.role !== "admin" && destination.staff_id !== user.authUserId) {
      return NextResponse.json(
        { error: "You can manage the cover photo only for your own destination." },
        { status: 403 }
      );
    }

    if (!destination.cover_path) {
      return NextResponse.json({ error: "No cover photo is set for this destination." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("destinations")
      .update({
        cover_path: null,
        cover_url: null
      })
      .eq("id", destination.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    try {
      await removePublicAsset(destination.cover_path);
    } catch {
      // Keep the database update even if the storage object is already missing.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to remove the cover photo."
      },
      { status: 400 }
    );
  }
}
