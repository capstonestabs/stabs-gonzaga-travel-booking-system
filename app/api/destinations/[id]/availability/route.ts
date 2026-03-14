import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { getServiceAvailabilityMonthStatuses, getServiceAvailabilitySnapshot } from "@/lib/availability";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function isValidMonthString(value: string) {
  return /^\d{4}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}-01T00:00:00`).getTime());
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const serviceDate = request.nextUrl.searchParams.get("serviceDate");
    const month = request.nextUrl.searchParams.get("month");
    const serviceId = request.nextUrl.searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "Service ID is required to check availability." }, { status: 400 });
    }

    if (!serviceDate && !month) {
      return NextResponse.json(
        { error: "Choose a valid service date or month." },
        { status: 400 }
      );
    }

    if (serviceDate && !isValidDateString(serviceDate)) {
      return NextResponse.json({ error: "Choose a valid service date." }, { status: 400 });
    }

    if (month && !isValidMonthString(month)) {
      return NextResponse.json({ error: "Choose a valid month." }, { status: 400 });
    }

    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json(
        { error: "Supabase service role credentials are missing." },
        { status: 503 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: destination, error: destinationError } = await supabase
      .from("destinations")
      .select("id, staff_id, status")
      .eq("id", id)
      .maybeSingle();

    if (destinationError) {
      throw new Error(destinationError.message);
    }

    if (!destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    const viewer = await getCurrentUserContext();
    const canView =
      destination.status === "published" ||
      (viewer != null &&
        (viewer.role === "admin" || destination.staff_id === viewer.authUserId));

    if (!canView) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    const { data: service, error: serviceError } = await supabase
      .from("destination_services")
      .select("id, daily_capacity, is_active, availability_start_date, availability_end_date")
      .eq("id", serviceId)
      .eq("destination_id", id)
      .maybeSingle();

    if (serviceError) {
      throw new Error(serviceError.message);
    }

    if (!service) {
      return NextResponse.json({ error: "Service not found for this destination." }, { status: 404 });
    }

    if (month) {
      const days = await getServiceAvailabilityMonthStatuses(serviceId, month);

      return NextResponse.json({
        month,
        days
      });
    }

    if (
      serviceDate &&
      ((service.availability_start_date && serviceDate < service.availability_start_date) ||
        (service.availability_end_date && serviceDate > service.availability_end_date))
    ) {
      return NextResponse.json({
        availability: {
          is_open: false,
          capacity: Number(service.daily_capacity ?? 0),
          confirmed_guests: 0,
          locked_guests: 0,
          remaining_guests: 0
        }
      });
    }

    const availability = await getServiceAvailabilitySnapshot(serviceId, serviceDate as string);

    return NextResponse.json({
      availability
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load availability."
      },
      { status: 400 }
    );
  }
}
