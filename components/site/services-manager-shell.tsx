"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, MessageSquareText, Plus } from "lucide-react";

import { DeleteDestinationServiceButton } from "@/components/forms/delete-destination-service-button";
import { ServiceCalendarManager } from "@/components/forms/service-calendar-manager";
import { ServicesEditorForm } from "@/components/forms/services-editor-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { optimizeImageToWebp } from "@/lib/browser-image";
import { formatServiceTypeLabel } from "@/lib/service-types";
import type { Destination, DestinationService } from "@/lib/types";
import { formatPesoCurrency } from "@/lib/utils";
import { formatOpenWeekdays, formatOperatingTime } from "@/lib/service-schedule";

export function ServicesManagerShell({
  destination,
  initialServices
}: {
  destination: Destination;
  initialServices: DestinationService[];
}) {
  const router = useRouter();
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [selectedCoverFileName, setSelectedCoverFileName] = useState<string | null>(null);

  const services = initialServices;
  const activeServices = services.filter((service) => service.is_active);
  const inactiveServices = services.filter((service) => !service.is_active);

  const handleAdd = () => {
    setEditingServiceId("new");
    setShowEditor(true);
  };

  const handleEdit = (id: string) => {
    setEditingServiceId(id);
    setShowEditor(true);
  };

  const handleBack = () => {
    setEditingServiceId(null);
    setShowEditor(false);
  };

  const servicesInEditor =
    editingServiceId === "new"
      ? []
      : editingServiceId
        ? services.filter((service) => service.id === editingServiceId)
        : services;

  async function handleCoverUpload(formData: FormData) {
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setCoverError("Choose an image file before uploading.");
      return;
    }

    setCoverError(null);
    setIsUploadingCover(true);

    try {
      if (file.size > 8 * 1024 * 1024) {
        throw new Error("Images must be under 8MB before optimization.");
      }

      const optimizedFile = await optimizeImageToWebp(file);
      const payload = new FormData();
      payload.append("file", optimizedFile);
      payload.append("folder", "covers");
      payload.append("destinationId", destination.id);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: payload
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to upload cover photo.");
      }

      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = "";
      }
      setSelectedCoverFileName(null);
      setIsCoverModalOpen(false);
      router.refresh();
    } catch (error) {
      setCoverError(
        error instanceof Error ? error.message : "Unable to upload cover photo."
      );
    } finally {
      setIsUploadingCover(false);
    }
  }

  return (
    <section className="space-y-5">
      {/* <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
          <div className="gradient-chip w-fit">Cover photo</div>
        </CardHeader>
        <CardContent className="space-y-3 p-5 sm:p-6">
          <button
            type="button"
            onClick={() => {
              setCoverError(null);
              setIsCoverModalOpen(true);
            }}
            className="mx-auto block w-full max-w-[12rem] overflow-hidden rounded-[0.8rem] border border-border/70 bg-muted text-left transition hover:border-primary/40"
          >
            {destination.cover_url ? (
              <img
                src={destination.cover_url}
                alt={`${destination.title} cover photo`}
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
                No cover photo set
              </div>
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground">Click the cover photo to update it.</p>
        </CardContent>
      </Card> */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="gradient-chip w-fit">Service management</div>
          <p className="text-sm text-muted-foreground">
            Manage your destination packages, optional service photos, and visually open or close future dates.
            Package slots stay as the configured daily total while live availability adjusts automatically as tourists book.
          </p>
        </div>
        {!showEditor ? (
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
            {services.length > 0 ? (
              <DeleteDestinationServiceButton
                destinationId={destination.id}
                deleteAll
                label="Delete all services"
                title="Delete all services?"
                description="Delete every service under this destination? Existing booking snapshots stay on file, but this destination will no longer have any bookable services."
                variant="outline"
                className="border-destructive/25 text-destructive hover:bg-destructive/8 hover:text-destructive"
              />
            ) : null}
            <Button onClick={handleAdd} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add service
            </Button>
          </div>
        ) : null}
      </div>

      {isCoverModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Update cover photo"
            className="w-full max-w-lg rounded-[1.25rem] border border-border/80 bg-background p-5 shadow-xl sm:p-6"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight">Update cover photo</h3>
              <p className="text-sm text-muted-foreground">
                Choose a new image for your destination cover.
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleCoverUpload(new FormData(event.currentTarget));
              }}
              className="mt-4 space-y-4"
            >
              <input
                ref={coverFileInputRef}
                name="file"
                type="file"
                accept="image/*"
                required
                className="sr-only"
                onChange={(event) => {
                  setCoverError(null);
                  setSelectedCoverFileName(event.target.files?.[0]?.name ?? null);
                }}
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">Image file</p>
                <div className="flex flex-wrap items-center gap-3 rounded-[1.15rem] border border-input/90 bg-card px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => coverFileInputRef.current?.click()}
                  >
                    Choose image
                  </Button>
                  <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                    {selectedCoverFileName ?? "No file selected"}
                  </span>
                </div>
              </div>

              {coverError ? <p className="text-sm text-destructive">{coverError}</p> : null}

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isUploadingCover) {
                      return;
                    }
                    setIsCoverModalOpen(false);
                    setCoverError(null);
                    setSelectedCoverFileName(null);
                    if (coverFileInputRef.current) {
                      coverFileInputRef.current.value = "";
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploadingCover}>
                  {isUploadingCover ? "Uploading..." : "Save cover photo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center sm:p-5 sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total services
            </p>
            <p className="mt-1 text-2xl font-bold">{services.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center sm:p-5 sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Active
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{activeServices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center sm:p-5 sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Inactive
            </p>
            <p className="mt-1 text-2xl font-bold text-muted-foreground">{inactiveServices.length}</p>
          </CardContent>
        </Card>
      </div>

      {!showEditor ? (
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
            <CardTitle className="text-base font-semibold">Your services</CardTitle>
            <p className="text-xs text-muted-foreground">
              The packages currently available for booking.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {services.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground sm:px-6">
                <p className="font-semibold text-foreground/80">No services created yet</p>
                <p className="mx-auto mt-1 max-w-xs text-xs opacity-70">
                  Click the add service button above to define your first bookable package.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`group px-4 py-4 transition-all hover:bg-muted/10 sm:px-5 sm:py-5 lg:px-6 ${
                      service.is_active ? "bg-background" : "bg-muted/15"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.title}
                          className="aspect-[4/3] w-full rounded-[0.9rem] object-cover sm:w-40"
                        />
                      ) : null}
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold tracking-tight text-foreground">
                            {service.title}
                          </p>
                          <Badge
                            variant={service.is_active ? "success" : "muted"}
                            className="h-4 text-[10px] uppercase tracking-[0.05em]"
                          >
                            {service.is_active ? "Active" : "Disabled"}
                          </Badge>
                          <Badge
                            variant="muted"
                            className="h-4 bg-muted/40 text-[10px]"
                          >
                            {formatServiceTypeLabel(service.service_type, {
                              category: destination.category,
                              includeSlash: true
                            })}
                          </Badge>
                        </div>
                        {service.description ? (
                          <p className="line-clamp-1 max-w-md text-xs text-muted-foreground">
                            {service.description}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {formatPesoCurrency(service.price_amount)}
                          </span>
                          <span className="opacity-40">|</span>
                          <span>{service.daily_capacity} configured slots/day</span>
                          {service.availability_start_date || service.availability_end_date ? (
                            <>
                              <span className="opacity-40">|</span>
                              <span>
                                {service.availability_start_date ?? "Now"} to{" "}
                                {service.availability_end_date ?? "Open-ended"}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                        <DeleteDestinationServiceButton
                          destinationId={destination.id}
                          serviceId={service.id}
                          label="Delete"
                          title={`Delete ${service.title}?`}
                          description="Delete this service from the destination? Existing booking snapshots stay on file, but the service will no longer appear in the staff workspace or public booking list."
                          variant="outline"
                          className="border-destructive/25 text-destructive hover:bg-destructive/8 hover:text-destructive"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-full px-4 text-xs font-semibold sm:w-auto"
                          onClick={() => handleEdit(service.id)}
                        >
                          Edit service
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-[0.9rem] border border-border/60 bg-muted/20 p-3 text-xs sm:grid-cols-3">
                      <div className="flex items-start gap-2">
                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Operating hours</p>
                          <p className="mt-0.5 text-muted-foreground">
                            {service.opening_time && service.closing_time
                              ? `${formatOperatingTime(service.opening_time)} – ${formatOperatingTime(service.closing_time)}`
                              : "Hours not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Open days</p>
                          <p className="mt-0.5 text-muted-foreground">{formatOpenWeekdays(service.open_weekdays)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Remarks</p>
                          <p className="mt-0.5 text-muted-foreground">{service.operating_remarks || "No operating remarks"}</p>
                        </div>
                      </div>
                    </div>

                    {(service.image_urls?.length ?? 0) > 1 ? (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {service.image_urls?.map((url, photoIndex) => (
                          <img key={`${url}-${photoIndex}`} src={url} alt={`${service.title} photo ${photoIndex + 1}`} className="h-16 w-24 shrink-0 rounded-[0.7rem] object-cover" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="h-8 w-8 rounded-full p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-bold tracking-tight">
                {editingServiceId === "new" ? "Create service" : "Edit service"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground sm:text-right">
              {editingServiceId === "new"
                ? "Define the new bookable package below."
                : "Update this package, then use the calendar below to close or reopen dates without changing the saved slot total."}
            </p>
          </div>

          <ServicesEditorForm
            destinationId={destination.id}
            destinationCategory={destination.category}
            services={servicesInEditor}
            hideAddRow={editingServiceId !== "new"}
            onSuccess={handleBack}
          />

          {editingServiceId !== "new" ? (
            <ServiceCalendarManager destinationId={destination.id} services={servicesInEditor} />
          ) : null}
        </div>
      )}
    </section>
  );
}
