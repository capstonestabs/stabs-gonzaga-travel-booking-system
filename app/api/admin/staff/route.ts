import { NextRequest, NextResponse } from "next/server";

import { adminStaffSchema } from "@/lib/schemas";
import { getCurrentUserContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceEnv } from "@/lib/env";
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

export async function POST(request: NextRequest) {
  try {
    const payload = adminStaffSchema.parse(await request.json());

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
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.defaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name: payload.destination
      }
    });

    if (createError || !createdUser.user) {
      throw new Error(createError?.message ?? "Unable to create staff user.");
    }

    const userId = createdUser.user.id;

    const { error: profileError } = await supabase.from("users").upsert({
      id: userId,
      email: payload.email,
      full_name: payload.destination,
      phone: null,
      role: "staff"
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: staffError } = await supabase
      .from("staff_profiles")
      .upsert(
        {
          user_id: userId,
          contact_email: payload.email,
          contact_phone: null
        },
        {
          onConflict: "user_id"
        }
      );

    if (staffError) {
      throw new Error(staffError.message);
    }

    const slug = await createUniqueSlug(slugify(payload.destination));
    const { error: destinationError } = await supabase.from("destinations").insert({
      slug,
      staff_id: userId,
      title: payload.destination,
      summary: `${payload.destination} in Gonzaga`,
      description: `${payload.destination} in ${payload.locationText}. Destination details will be completed by the assigned staff member.`,
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

    if (destinationError) {
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(destinationError.message);
    }

    return NextResponse.json({
      userId,
      message: "Staff account and destination created."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create staff account."
      },
      { status: 400 }
    );
  }
}
