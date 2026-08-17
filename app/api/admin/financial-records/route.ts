import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";

export async function POST(_request: NextRequest) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const user = await getCurrentUserContext();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    return NextResponse.json({
      error:
        "Manual financial record creation is disabled. Financial records are created automatically when the platform PayMongo checkout succeeds."
    }, { status: 403 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Manual financial record creation is disabled."
      },
      { status: 400 }
    );
  }
}
