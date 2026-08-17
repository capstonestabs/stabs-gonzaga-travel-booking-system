import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { financialSettlementSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function looksLikeFullRecordPayload(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "destinationId" in value || "userId" in value || "paidAt" in value;
}

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

export async function PATCH(
  request: NextRequest,
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
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const rawPayload = await request.json();
    const supabase = createAdminSupabaseClient();
    let existingRecordResponse = await supabase
      .from("financial_records")
      .select("id, settled_at")
      .eq("id", id)
      .is("archived_at", null)
      .is("purged_at", null)
      .maybeSingle();

    if (isMissingFinancialPurgedColumn(existingRecordResponse.error)) {
      existingRecordResponse = await supabase
        .from("financial_records")
        .select("id, settled_at")
        .eq("id", id)
        .is("archived_at", null)
        .maybeSingle();
    }

    if (isMissingFinancialArchiveColumn(existingRecordResponse.error)) {
      existingRecordResponse = await supabase
        .from("financial_records")
        .select("id, settled_at")
        .eq("id", id)
        .maybeSingle();
    }

    const { data: existingRecord, error: existingRecordError } = existingRecordResponse;

    if (existingRecordError) {
      throw new Error(existingRecordError.message);
    }

    if (!existingRecord) {
      return NextResponse.json({ error: "Financial record not found." }, { status: 404 });
    }

    if (looksLikeFullRecordPayload(rawPayload)) {
      return NextResponse.json(
        {
          error:
            "Financial records are created automatically from paid bookings. Admin can only record settlement details here."
        },
        { status: 403 }
      );
    }

    const parsedPayload = financialSettlementSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error:
            parsedPayload.error.issues[0]?.message ??
            "Unable to update the financial record."
        },
        { status: 400 }
      );
    }

    const payload = parsedPayload.data;
    const { error } = await supabase
      .from("financial_records")
      .update({
        settlement_status: "settled",
        settled_at: existingRecord.settled_at ?? new Date().toISOString(),
        receipt_reference: payload.receiptReference,
        settlement_notes: payload.settlementNotes || null,
        archived_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ message: "Financial record settled and moved to payout history." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update the financial record."
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const permanentDelete = request.nextUrl.searchParams.get("permanent") === "1";

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

    const supabase = createAdminSupabaseClient();
    let existingRecordResponse = await supabase
      .from("financial_records")
      .select("id, archived_at, settlement_status, purged_at")
      .eq("id", id)
      .is("purged_at", null)
      .maybeSingle();

    if (isMissingFinancialPurgedColumn(existingRecordResponse.error)) {
      existingRecordResponse = await supabase
        .from("financial_records")
        .select("id, archived_at, settlement_status, purged_at")
        .eq("id", id)
        .maybeSingle();
    }

    if (existingRecordResponse.error) {
      throw new Error(existingRecordResponse.error.message);
    }

    const existingRecord = existingRecordResponse.data;

    if (!existingRecord) {
      return NextResponse.json({ error: "Financial record not found." }, { status: 404 });
    }

    if (permanentDelete) {
      if (!existingRecord.archived_at) {
        return NextResponse.json(
          { error: "Move this payout to history before deleting it permanently." },
          { status: 400 }
        );
      }

      let purgeResponse = await supabase
        .from("financial_records")
        .update({
          purged_at: new Date().toISOString()
        })
        .eq("id", id)
        .is("purged_at", null);

      if (isMissingFinancialPurgedColumn(purgeResponse.error)) {
        return NextResponse.json(
          {
            error:
              "Apply the latest database migration before deleting payout history permanently."
          },
          { status: 409 }
        );
      }

      if (purgeResponse.error) {
        throw new Error(purgeResponse.error.message);
      }

      return NextResponse.json({
        message: "Financial record removed from payout history permanently."
      });
    }

    if (existingRecord.settlement_status !== "settled") {
      return NextResponse.json(
        { error: "Record the staff payout first before moving this transaction to history." },
        { status: 400 }
      );
    }

    let archiveResponse = await supabase
      .from("financial_records")
      .update({
        archived_at: new Date().toISOString()
      })
      .eq("id", id)
      .is("archived_at", null);

    if (isMissingFinancialArchiveColumn(archiveResponse.error)) {
      archiveResponse = await supabase.from("financial_records").delete().eq("id", id);
    }

    if (archiveResponse.error) {
      throw new Error(archiveResponse.error.message);
    }

    return NextResponse.json({ message: "Financial record moved to payout history." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to remove the financial record."
      },
      { status: 400 }
    );
  }
}
