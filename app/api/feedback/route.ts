import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { hasSupabaseServiceEnv } from "@/lib/env";
import { getDestinationById } from "@/lib/repositories";
import { feedbackSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatZodError } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const payload = feedbackSchema.parse(await request.json());
    const destination = await getDestinationById(payload.destinationId);
    if (!destination || destination.status !== "published") {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("feedback_entries").insert({
      destination_id: payload.destinationId,
      name: payload.name,
      email: payload.email,
      message: payload.message
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      message: "Thanks for the feedback."
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: formatZodError(error, {
            destinationId: "Destination",
            name: "Your name",
            email: "Email address",
            message: "Feedback"
          })
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to submit feedback."
      },
      { status: 400 }
    );
  }
}
