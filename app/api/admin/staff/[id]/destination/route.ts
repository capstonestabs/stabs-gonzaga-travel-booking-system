import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { staffDestinationAssignmentSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

async function createUniqueSlug(baseSlug: string) {
  const supabase = createAdminSupabaseClient();
  let slug = baseSlug;
  let iteration = 1;

  while (true) {
    const { data } = await supabase.from("destinations").select("id").eq("slug", slug).maybeSingle();

    if (!data) {
      return slug;
    }

    iteration += 1;
    slug = `${baseSlug}-${iteration}`;
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const payload = staffDestinationAssignmentSchema.parse(await request.json());

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
      .select("id, role, full_name, email")
      .eq("id", id)
      .maybeSingle();

    if (staffLookupError) {
      throw new Error(staffLookupError.message);
    }

    if (!staffUser || staffUser.role !== "staff") {
      return NextResponse.json({ error: "Staff user not found." }, { status: 404 });
    }

    const destinationTitle = payload.destinationTitle.trim();

    const { data: destination, error: destinationLookupError } = await supabase
      .from("destinations")
      .select("id")
      .eq("staff_id", id)
      .maybeSingle();

    if (destinationLookupError) {
      throw new Error(destinationLookupError.message);
    }

    if (destination) {
      const { error: updateError } = await supabase
        .from("destinations")
        .update({
          title: destinationTitle,
          location_text: payload.locationText
        })
        .eq("id", destination.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return NextResponse.json({ message: "Destination assignment updated." });
    }

    const slug = await createUniqueSlug(slugify(destinationTitle));
    const { error: insertError } = await supabase.from("destinations").insert({
      slug,
      staff_id: id,
      title: destinationTitle,
      summary: `${destinationTitle} in Gonzaga`,
      description: `${destinationTitle} in ${payload.locationText}. Destination details will be completed by the assigned staff member.`,
      location_text: payload.locationText,
      province: null,
      city: null,
      category: "tour",
      status: "draft",
      price_amount: 1000,
      currency: "PHP",
      max_guests: 1,
      duration_text: null,
      inclusions: [],
      policies: [],
      featured: false
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ message: "Destination assigned." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save destination assignment."
      },
      { status: 400 }
    );
  }
}
