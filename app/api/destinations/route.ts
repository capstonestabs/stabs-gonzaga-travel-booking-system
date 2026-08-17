import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { destinationSchema } from "@/lib/schemas";
import { getCurrentUserContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { formatZodError } from "@/lib/validation";
import { parseMultilineList, slugify } from "@/lib/utils";

async function createUniqueSlug(baseSlug: string) {
  const supabase = createAdminSupabaseClient();
  let slug = baseSlug;
  let iteration = 1;

  while (true) {
    const { data } = await supabase
      .from("destinations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) {
      return slug;
    }

    iteration += 1;
    slug = `${baseSlug}-${iteration}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = destinationSchema.parse(body);

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
    const assignedStaffId = String(body.staffId ?? "");
    const contactEmail = String(body.contactEmail ?? "");
    const contactPhone = String(body.contactPhone ?? "");

    if (!assignedStaffId) {
      return NextResponse.json(
        { error: "Select the staff account that will manage this destination." },
        { status: 400 }
      );
    }

    const { data: assignedStaff, error: assignedStaffError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", assignedStaffId)
      .maybeSingle();

    if (assignedStaffError) {
      throw new Error(assignedStaffError.message);
    }

    if (!assignedStaff || assignedStaff.role !== "staff") {
      return NextResponse.json(
        { error: "The selected account is not a valid staff account." },
        { status: 404 }
      );
    }

    const { data: existingListing, error: existingListingError } = await supabase
      .from("destinations")
      .select("id")
      .eq("staff_id", assignedStaffId)
      .maybeSingle();

    if (existingListingError) {
      throw new Error(existingListingError.message);
    }

    if (existingListing) {
      return NextResponse.json(
        {
          error: "This staff account already has a destination. Edit the existing destination instead of creating another one."
        },
        { status: 409 }
      );
    }

    const slug = await createUniqueSlug(slugify(payload.title));
    const { data, error } = await supabase
      .from("destinations")
      .insert({
        slug,
        staff_id: assignedStaffId,
        title: payload.title,
        summary: payload.summary,
        description: payload.description,
        location_text: payload.locationText,
        province: payload.province || null,
        city: payload.city || null,
        category: payload.category,
        booking_type: payload.bookingType ?? "online",
        status: payload.status,
        currency: "PHP",
        inclusions: parseMultilineList(payload.inclusions || ""),
        policies: parseMultilineList(payload.policies || ""),
        featured: payload.featured
      })
      .select("id, title")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to create destination.");
    }

    const { error: staffProfileError } = await supabase
      .from("staff_profiles")
      .upsert(
        {
          user_id: assignedStaffId,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null
        },
        {
          onConflict: "user_id"
        }
      );

    if (staffProfileError) {
      throw new Error(staffProfileError.message);
    }

    return NextResponse.json({
      destination: data
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: formatZodError(error, {
            locationText: "Location"
          })
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create destination."
      },
      { status: 400 }
    );
  }
}
