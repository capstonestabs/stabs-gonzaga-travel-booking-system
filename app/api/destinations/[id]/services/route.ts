import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getDestinationById } from "@/lib/repositories";
import { normalizeServiceTypeLabel, SERVICE_TYPE_MAX_LENGTH } from "@/lib/service-types";
import { removePublicAsset } from "@/lib/storage";
import { DEFAULT_OPEN_WEEKDAYS, normalizeOpenWeekdays } from "@/lib/service-schedule";

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
      imagePaths: z.array(z.string().max(500)).max(5).default([]),
      imageUrls: z.array(z.string().max(1000)).max(5).default([]),
      availabilityStartDate: z.string().date().optional().nullable(),
      availabilityEndDate: z.string().date().optional().nullable(),
      openingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
      closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
      openWeekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7).default(DEFAULT_OPEN_WEEKDAYS),
      operatingRemarks: z.string().max(300).optional().or(z.literal("")),
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
      if (service.openingTime && service.closingTime && service.openingTime >= service.closingTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["closingTime"],
          message: "Closing time must be after opening time."
        });
      }
      if (service.imagePaths.length !== service.imageUrls.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["imageUrls"],
          message: "Each service photo must include its storage path and URL."
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
      .select("id, image_path, image_paths")
      .eq("destination_id", destinationId);

    const currentServiceById = new Map(
      (currentServices ?? []).map((service) => [
        service.id as string,
        {
          image_path: service.image_path as string | null,
          image_paths: (service.image_paths as string[] | null) ?? []
        }
      ])
    );

    // Upsert the remaining
    const rowsToUpsert = payload.services.map((service) => {
      const imagePaths = service.imagePaths.length > 0
        ? service.imagePaths
        : service.imagePath ? [service.imagePath] : [];
      const imageUrls = service.imageUrls.length > 0
        ? service.imageUrls
        : service.imageUrl ? [service.imageUrl] : [];

      return {
        id: service.id || crypto.randomUUID(),
        destination_id: destinationId,
        title: service.title,
        description: service.description || null,
        price_amount: service.priceAmount,
        daily_capacity: service.dailyCapacity,
        image_path: imagePaths[0] ?? null,
        image_url: imageUrls[0] ?? null,
        image_paths: imagePaths,
        image_urls: imageUrls,
        availability_start_date: normalizeDateOrNull(service.availabilityStartDate),
        availability_end_date: normalizeDateOrNull(service.availabilityEndDate),
        opening_time: service.openingTime ?? null,
        closing_time: service.closingTime ?? null,
        open_weekdays: normalizeOpenWeekdays(service.openWeekdays),
        operating_remarks: service.operatingRemarks || null,
        service_type: normalizeServiceTypeLabel(service.serviceType, destination.category),
        is_active: service.isActive,
      };
    });

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

      const current = currentServiceById.get(service.id);
      const previousPaths = current?.image_paths.length
        ? current.image_paths
        : current?.image_path ? [current.image_path] : [];
      const nextPaths = new Set(service.imagePaths.length ? service.imagePaths : service.imagePath ? [service.imagePath] : []);
      for (const previousPath of previousPaths) {
        if (!nextPaths.has(previousPath)) stalePaths.add(previousPath);
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
      .select("id, image_path, image_paths")
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
      const paths = (service.image_paths as string[] | null)?.length
        ? (service.image_paths as string[])
        : service.image_path ? [service.image_path] : [];
      for (const path of new Set(paths)) {
        try {
          await removePublicAsset(path);
        } catch {
          // Ignore storage misses once the DB row is already gone.
        }
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
