import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const calendarPayloadSchema = z.object({
  closures: z.array(
    z.object({
      serviceId: z.string().uuid(),
      closedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    })
  )
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: destinationId } = await context.params;

    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role missing." }, { status: 503 });
    }

    const user = await getCurrentUserContext();
    if (!user || !["staff", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: destination, error: destinationError } = await supabase
      .from("destinations")
      .select("id, staff_id")
      .eq("id", destinationId)
      .maybeSingle();

    if (destinationError || !destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    if (user.role !== "admin" && destination.staff_id !== user.authUserId) {
      return NextResponse.json({ error: "Permission denied." }, { status: 403 });
    }
    
    // Get all services for this destination
    const { data: services, error: servicesError } = await supabase
      .from("destination_services")
      .select("id")
      .eq("destination_id", destinationId);

    if (servicesError) throw new Error(servicesError.message);
    
    if (!services || services.length === 0) {
      return NextResponse.json({ closures: [] });
    }

    const serviceIds = services.map(s => s.id);

    const { data: closures, error: closuresError } = await supabase
      .from("service_availability_closures")
      .select("service_id, closed_date")
      .in("service_id", serviceIds);

    if (closuresError) throw new Error(closuresError.message);

    return NextResponse.json({
      closures: closures.map(c => ({
        serviceId: c.service_id,
        closedDate: c.closed_date
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load calendar." },
      { status: 400 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: destinationId } = await context.params;

    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role missing." }, { status: 503 });
    }

    const user = await getCurrentUserContext();
    if (!user || !["staff", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: destination, error: destError } = await supabase
      .from("destinations")
      .select("id, staff_id")
      .eq("id", destinationId)
      .maybeSingle();

    if (destError || !destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    if (user.role !== "admin" && destination.staff_id !== user.authUserId) {
      return NextResponse.json({ error: "Permission denied." }, { status: 403 });
    }

    const payload = calendarPayloadSchema.parse(await request.json());

    // 1. Get valid service IDs for this destination to prevent tampering
    const { data: services } = await supabase
      .from("destination_services")
      .select("id")
      .eq("destination_id", destinationId);
    
    const validServiceIds = new Set((services || []).map(s => s.id));

    // 2. Filter closures to only those that belong to this destination
    const validClosures = payload.closures.filter(c => validServiceIds.has(c.serviceId));

    // 3. Wipe existing closures for all these services
    if (validServiceIds.size > 0) {
      const { error: deleteError } = await supabase
        .from("service_availability_closures")
        .delete()
        .in("service_id", Array.from(validServiceIds));

      if (deleteError) throw new Error(deleteError.message);
    }

    // 4. Insert the new valid closures
    if (validClosures.length > 0) {
      const { error: insertError } = await supabase
        .from("service_availability_closures")
        .insert(
          validClosures.map(c => ({
            service_id: c.serviceId,
            closed_date: c.closedDate
          }))
        );

      if (insertError) throw new Error(insertError.message);
    }

    return NextResponse.json({ message: "Calendar saved successfully." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save calendar." },
      { status: 400 }
    );
  }
}
