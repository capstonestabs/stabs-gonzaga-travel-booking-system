import Link from "next/link";
import { Building2, MapPinned, Settings2 } from "lucide-react";

import { DashboardShell } from "@/components/site/dashboard-shell";
import { GalleryUploadGrid } from "@/components/forms/gallery-upload-grid";
import { ListingForm } from "@/components/forms/listing-form";
import { MediaUploadForm } from "@/components/forms/media-upload-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getDestinationForStaff, getProfileBundle } from "@/lib/repositories";
import { serializeList } from "@/lib/utils";

export default async function StaffDestinationManagementPage() {
  const context = await requireRole(["staff"]);
  const destination = await getDestinationForStaff(context.authUserId);
  const profileBundle =
    (await getProfileBundle(context.authUserId)) ?? {
      user: {
        id: context.authUserId,
        email: context.email,
        full_name: context.profile?.full_name ?? null,
        role: "staff" as const,
        phone: context.profile?.phone ?? null,
        avatar_url: context.profile?.avatar_url ?? null,
        created_at: context.profile?.created_at ?? new Date().toISOString(),
        updated_at: context.profile?.updated_at ?? new Date().toISOString()
      },
      staffProfile: null
    };

  return (
    <DashboardShell
      role="staff"
      title="Destination management"
      description="Manage the public destination story, destination contact details, cover photo, and gallery. Service packages, pricing, capacity, and date closures are handled on the services page."
    >
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="gradient-chip inline-flex w-fit items-center gap-2">
            <Building2 className="h-4 w-4" />
            Destination management
          </div>
          <p className="text-sm text-muted-foreground">
            Admin controls the destination name and location. Staff can manage the public details,
            public tourist-facing contact details, cover photo, and gallery here, then open the
            services page for package pricing, capacity, and closures.
          </p>
        </div>

        {destination ? (
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <CardContent className="grid gap-4 p-4 sm:grid-cols-[1.2fr,0.8fr] sm:p-5">
                <div className="rounded-[1rem] bg-muted/45 px-3.5 py-3 sm:px-4 sm:py-3.5">
                  <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPinned className="h-4 w-4" />
                    Destination
                  </p>
                  <p className="mt-1 font-medium">{destination.title}</p>
                  <p className="text-sm text-muted-foreground">{destination.location_text}</p>
                </div>
                <div className="rounded-[1rem] bg-muted/45 px-3.5 py-3 sm:px-4 sm:py-3.5">
                  <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Settings2 className="h-4 w-4" />
                    Status
                  </p>
                  <p className="mt-1 font-medium capitalize">{destination.status}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <ListingForm
                destinationId={destination.id}
                canEditIdentity={false}
                showContactFields
                contactEmailDefault={profileBundle.staffProfile?.contact_email ?? context.email}
                contactPhoneDefault={profileBundle.staffProfile?.contact_phone ?? ""}
                cardTitle="Destination settings"
                cardDescription="Update the destination content, public tourist-facing contact details, status, category, policies, and inclusions. Changing the destination contact email here does not change the staff login email."
                submitLabel="Save destination settings"
                showFeaturedToggle={false}
                defaultValues={{
                  title: destination.title,
                  summary: destination.summary,
                  description: destination.description,
                  locationText: destination.location_text,
                  category: destination.category,
                  status: destination.status,
                  inclusions: serializeList(destination.inclusions),
                  policies: serializeList(destination.policies),
                  featured: destination.featured
                }}
              />

              <Card className="overflow-hidden">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div>
                    <p className="font-medium">Services &amp; Packages</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Manage your bookable service packages, pricing, configured daily slots, and date closures.
                    </p>
                  </div>
                  <Link href="/dashboard/staff/services">
                    <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                      <Building2 className="h-4 w-4" />
                      Manage services
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <div className="grid gap-5 md:grid-cols-2">
                <MediaUploadForm
                  destinationId={destination.id}
                  folder="covers"
                  currentImageUrl={destination.cover_url}
                />
                <GalleryUploadGrid
                  destinationId={destination.id}
                  images={destination.destination_images ?? []}
                  maxItems={5}
                />
              </div>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
              <p>No destination is linked to this staff account yet.</p>
              <p>
                Ask the admin to set the destination name and location first. Once the destination
                is ready, you can manage the description, contacts, cover photo, gallery, status,
                category, policies, and inclusions here, then set up your services and pricing on
                the services page.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </DashboardShell>
  );
}
