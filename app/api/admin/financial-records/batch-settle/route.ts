import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { batchFinancialSettlementSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function isMissingFinancialArchiveColumn(
  error: { code?: string; message?: string } | null | undefined
) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "42703" ||
    (message.includes("archived_at") &&
      (message.includes("financial_records") ||
        message.includes("schema cache") ||
        message.includes("column"))) ||
    false
  );
}

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

export async function PATCH(request: NextRequest) {
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
    const parsedPayload = batchFinancialSettlementSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error:
            parsedPayload.error.issues[0]?.message ??
            "Unable to record the payout."
        },
        { status: 400 }
      );
    }

    const payload = parsedPayload.data;
    const supabase = createAdminSupabaseClient();

    let existingRecordsResponse = await supabase
      .from("financial_records")
      .select("id, settlement_status, archived_at, settled_at")
      .in("id", payload.recordIds)
      .is("archived_at", null)
      .is("purged_at", null);

    if (isMissingFinancialPurgedColumn(existingRecordsResponse.error)) {
      existingRecordsResponse = await supabase
        .from("financial_records")
        .select("id, settlement_status, archived_at, settled_at")
        .in("id", payload.recordIds)
        .is("archived_at", null);
    }

    if (isMissingFinancialArchiveColumn(existingRecordsResponse.error)) {
      existingRecordsResponse = await supabase
        .from("financial_records")
        .select("id, settlement_status, archived_at, settled_at")
        .in("id", payload.recordIds);
    }

    if (existingRecordsResponse.error) {
      throw new Error(existingRecordsResponse.error.message);
    }

    const existingRecords = existingRecordsResponse.data ?? [];

    if (!existingRecords.length) {
      return NextResponse.json({ error: "No payout records found." }, { status: 404 });
    }

    const unsettledRecords = existingRecords.filter(
      (record) => record.settlement_status !== "settled"
    );

    if (!unsettledRecords.length) {
      return NextResponse.json(
        { error: "All records in this service are already settled." },
        { status: 400 }
      );
    }

    const settledAt = new Date().toISOString();
    const { error } = await supabase
      .from("financial_records")
      .update({
        settlement_status: "settled",
        settled_at: settledAt,
        receipt_reference: payload.receiptReference,
        settlement_notes: payload.settlementNotes || null,
        archived_at: settledAt
      })
      .in(
        "id",
        unsettledRecords.map((record) => record.id as string)
      );

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      message: "Service payout recorded and moved to payout history.",
      updatedCount: unsettledRecords.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to record the payout."
      },
      { status: 400 }
    );
  }
}
