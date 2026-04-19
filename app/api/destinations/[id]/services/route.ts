import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getDestinationById } from "@/lib/repositories";
import { normalizeServiceTypeLabel, SERVICE_TYPE_MAX_LENGTH } from "@/lib/service-types";
import { removePublicAsset } from "@/lib/storage";

function normalizeDateOrNull(value?: string | null) {
  return value ? value : null;
}

const payloadSchema = z.object({
  services: z.array(
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(2).max(100),
      description: z.string().max(400).optional().or(z.literal("")),
      priceAmount: z.number().min(0),
      serviceType: z.string().trim().min(1).max(SERVICE_TYPE_MAX_LENGTH),
      dailyCapacity: z.number().int().min(1),
      imagePath: z.string().max(500).nullable().optional(),
      imageUrl: z.string().max(1000).nullable().optional(),
      availabilityStartDate: z.string().date().optional().nullable(),
      availabilityEndDate: z.string().date().optional().nullable(),
      isActive: z.boolean(),
    }).superRefine((service, ctx) => {
      if (
        service.availabilityStartDate &&
        service.availabilityEndDate &&
        service.availabilityEndDate < service.availabilityStartDate
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["availabilityEndDate"],
          message: "End date must be on or after the start date."
        });
      }
    })
  )
});

const deletePayloadSchema = z
  .object({
    serviceId: z.string().uuid().optional(),
    deleteAll: z.boolean().optional()
  })
  .refine((value) => value.deleteAll === true || Boolean(value.serviceId), {
    message: "Select a service to delete or choose delete all."
  });

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: destinationId } = await params;
    const user = await getCurrentUserContext();
    if (!user || user.role !== "staff") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const payload = payloadSchema.parse(await request.json());
    const destination = await getDestinationById(destinationId);

    if (!destination || destination.staff_id !== user.authUserId) {
      return NextResponse.json(
        { error: "Destination not found or unauthorized." },
        { status: 404 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Only upsert the submitted services here. Existing services that are not part of
    // the current edit request must stay untouched so staff can add or edit one
    // package without wiping the rest of the destination's services.
    const { data: currentServices } = await supabase
      .from("destination_services")
      .select("id, image_path")
      .eq("destination_id", destinationId);

    const currentServiceById = new Map(
      (currentServices ?? []).map((service) => [
        service.id as string,
        { image_path: service.image_path as string | null }
      ])
    );

    // Upsert the remaining
    const rowsToUpsert = payload.services.map((service) => ({
      id: service.id || crypto.randomUUID(),
      destination_id: destinationId,
      title: service.title,
      description: service.description || null,
      price_amount: service.priceAmount,
      daily_capacity: service.dailyCapacity,
      image_path: service.imagePath ?? null,
      image_url: service.imageUrl ?? null,
      availability_start_date: normalizeDateOrNull(service.availabilityStartDate),
      availability_end_date: normalizeDateOrNull(service.availabilityEndDate),
      service_type: normalizeServiceTypeLabel(service.serviceType, destination.category),
      is_active: service.isActive,
    }));

    if (rowsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from("destination_services")
        .upsert(rowsToUpsert, { onConflict: "id" });

      if (upsertError) {
        throw new Error("Failed to save service records.");
      }
    }

    const stalePaths = new Set<string>();

    for (const service of payload.services) {
      if (!service.id) {
        continue;
      }

      const previousPath = currentServiceById.get(service.id)?.image_path;
      if (previousPath && previousPath !== (service.imagePath ?? null)) {
        stalePaths.add(previousPath);
      }
    }

    for (const path of stalePaths) {
      try {
        await removePublicAsset(path);
      } catch {
        // Keep the service records even if an old file is already gone.
      }
    }

    return NextResponse.json({ message: "Services updated successfully." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process request." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: destinationId } = await params;
    const user = await getCurrentUserContext();
    if (!user || user.role !== "staff") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const payload = deletePayloadSchema.parse(await request.json());
    const destination = await getDestinationById(destinationId);

    if (!destination || destination.staff_id !== user.authUserId) {
      return NextResponse.json(
        { error: "Destination not found or unauthorized." },
        { status: 404 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: currentServices, error: currentServicesError } = await supabase
      .from("destination_services")
      .select("id, image_path")
      .eq("destination_id", destinationId);

    if (currentServicesError) {
      throw new Error(currentServicesError.message);
    }

    const servicesToDelete = payload.deleteAll
      ? currentServices ?? []
      : (currentServices ?? []).filter((service) => service.id === payload.serviceId);

    if (!servicesToDelete.length) {
      return NextResponse.json({ error: "No matching services found to delete." }, { status: 404 });
    }

    const serviceIds = servicesToDelete.map((service) => service.id as string);
    const { error: deleteError } = await supabase
      .from("destination_services")
      .delete()
      .in("id", serviceIds);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    for (const service of servicesToDelete) {
      if (!service.image_path) {
        continue;
      }

      try {
        await removePublicAsset(service.image_path);
      } catch {
        // Ignore storage misses once the DB row is already gone.
      }
    }

    return NextResponse.json({
      message:
        serviceIds.length === 1
          ? "Service deleted successfully."
          : "All selected services were deleted successfully.",
      deletedCount: serviceIds.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete the service." },
      { status: 400 }
    );
  }
}
