import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const context = await getCurrentUserContext();

    if (!context || (context.role !== "staff" && context.role !== "admin")) {
      return NextResponse.json({ error: "You do not have access to delete feedback." }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createAdminSupabaseClient();
    const { data: feedback, error: feedbackError } = await supabase
      .from("feedback_entries")
      .select("id, destination_id")
      .eq("id", id)
      .maybeSingle<{ id: string; destination_id: string | null }>();

    if (feedbackError) {
      throw new Error(feedbackError.message);
    }

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
    }

    if (context.role === "staff") {
      const { data: destination, error: destinationError } = await supabase
        .from("destinations")
        .select("id")
        .eq("staff_id", context.authUserId)
        .maybeSingle<{ id: string }>();

      if (destinationError) {
        throw new Error(destinationError.message);
      }

      if (!destination || destination.id !== feedback.destination_id) {
        return NextResponse.json(
          { error: "You can only delete feedback for your assigned destination." },
          { status: 403 }
        );
      }
    }

    const { error: deleteError } = await supabase.from("feedback_entries").delete().eq("id", id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete this feedback."
      },
      { status: 400 }
    );
  }
}
