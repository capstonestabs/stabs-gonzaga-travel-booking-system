import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { batchFinancialHistoryDeleteSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function isMissingFinancialPurgedColumn(
  error: { code?: string; message?: string } | null | undefined
) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "42703" ||
    (message.includes("purged_at") &&
      (message.includes("financial_records") ||
        message.includes("schema cache") ||
        message.includes("column"))) ||
    false
  );
}

export async function DELETE(request: NextRequest) {
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

    const rawPayload = await request.json();
    const parsedPayload = batchFinancialHistoryDeleteSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error:
            parsedPayload.error.issues[0]?.message ??
            "Unable to delete the selected history records."
        },
        { status: 400 }
      );
    }

    const payload = parsedPayload.data;
    const supabase = createAdminSupabaseClient();
    const { data: archivedRecords, error: archivedRecordsError } = await supabase
      .from("financial_records")
      .select("id")
      .in("id", payload.recordIds)
      .not("archived_at", "is", null)
      .is("purged_at", null);

    if (isMissingFinancialPurgedColumn(archivedRecordsError)) {
      return NextResponse.json(
        {
          error: "Apply the latest database migration before deleting payout history in bulk."
        },
        { status: 409 }
      );
    }

    if (archivedRecordsError) {
      throw new Error(archivedRecordsError.message);
    }

    const idsToPurge = (archivedRecords ?? []).map((record) => record.id as string);

    if (!idsToPurge.length) {
      return NextResponse.json(
        { error: "No archived payout records matched the selected history rows." },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("financial_records")
      .update({
        purged_at: new Date().toISOString()
      })
      .in("id", idsToPurge)
      .is("purged_at", null);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      message: "Selected payout history rows were removed.",
      deletedCount: idsToPurge.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete the selected history records."
      },
      { status: 400 }
    );
  }
}
