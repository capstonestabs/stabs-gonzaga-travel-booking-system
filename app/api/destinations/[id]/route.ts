import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { destinationSchema, destinationStatusSchema } from "@/lib/schemas";
import { getCurrentUserContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { formatZodError } from "@/lib/validation";
import { parseMultilineList } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

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
    const { data: existing, error: existingError } = await supabase
      .from("destinations")
      .select("id, staff_id, title, location_text, province, city")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (!existing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (user.role !== "admin" && existing.staff_id !== user.authUserId) {
      return NextResponse.json({ error: "You do not manage this listing." }, { status: 403 });
    }

    const isStatusOnly = Object.keys(body).length === 1 && "status" in body;
    const isEntranceFeeOnly =
      "isEntranceFeeActive" in body || "entranceFeeAmount" in body || "entranceFeeTitle" in body;
    const isPoliciesOnly = Object.keys(body).length === 1 && "policies" in body;

    const data = isStatusOnly
      ? {
          status: destinationStatusSchema.parse(body).status
        }
      : isEntranceFeeOnly && !("title" in body)
        ? {
            entrance_fee_amount:
              body.entranceFeeAmount !== undefined
                ? Math.max(0, Number(body.entranceFeeAmount) || 0)
                : undefined,
            is_entrance_fee_active:
              body.isEntranceFeeActive !== undefined
                ? Boolean(body.isEntranceFeeActive)
                : undefined,
            entrance_fee_title:
              body.entranceFeeTitle !== undefined
                ? String(body.entranceFeeTitle || "Entrance Fee").trim()
                : undefined
          }
        : isPoliciesOnly
          ? {
              policies: Array.isArray(body.policies)
                ? body.policies.map((p: any) => String(p).trim()).filter(Boolean)
                : parseMultilineList(String(body.policies || ""))
            }
          : (() => {
              const updatePayload = destinationSchema.parse(body);

              return {
                title: user.role === "admin" ? updatePayload.title : existing.title,
                summary: updatePayload.summary,
                description: updatePayload.description,
                location_text:
                  user.role === "admin" ? updatePayload.locationText : existing.location_text,
                province: user.role === "admin" ? updatePayload.province || null : existing.province,
                city: user.role === "admin" ? updatePayload.city || null : existing.city,
                category: updatePayload.category,
                booking_type: updatePayload.bookingType ?? "online",
                status: updatePayload.status,
                inclusions: parseMultilineList(updatePayload.inclusions || ""),
                policies: parseMultilineList(updatePayload.policies || ""),
                entrance_fee_amount: updatePayload.entranceFeeAmount ?? 0,
                is_entrance_fee_active: updatePayload.isEntranceFeeActive ?? false,
                entrance_fee_title: updatePayload.entranceFeeTitle ?? "Entrance Fee",
                featured: updatePayload.featured
              };
            })();

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    const { error } = await supabase.from("destinations").update(cleanData).eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    if ("contactEmail" in body || "contactPhone" in body) {
      const { error: staffProfileError } = await supabase
        .from("staff_profiles")
        .upsert(
          {
            user_id: existing.staff_id,
            contact_email: String(body.contactEmail ?? "") || null,
            contact_phone: String(body.contactPhone ?? "") || null
          },
          {
            onConflict: "user_id"
          }
        );

      if (staffProfileError) {
        throw new Error(staffProfileError.message);
      }
    }

    return NextResponse.json({ destinationId: id });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: formatZodError(error, {
            locationText: "Location",
            priceAmount: "Price"
          })
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update destination."
      },
      { status: 400 }
    );
  }
}
