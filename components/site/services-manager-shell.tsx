"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Home,
  Pencil,
  Plus,
  Sparkles
} from "lucide-react";
import { splitServicesByCategory } from "@/lib/service-categories";

import { AdditionalServicesEditorForm } from "@/components/forms/additional-services-editor-form";
import { DeleteDestinationServiceButton } from "@/components/forms/delete-destination-service-button";
import { ServiceCalendarManager } from "@/components/forms/service-calendar-manager";
import { ServicesEditorForm } from "@/components/forms/services-editor-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { optimizeImageToWebp } from "@/lib/browser-image";
import { formatServiceTypeLabel } from "@/lib/service-types";
import type { Destination, DestinationService } from "@/lib/types";
import { formatPesoCurrency } from "@/lib/utils";
import { formatOperatingTime } from "@/lib/service-schedule";

const ITEMS_PER_PAGE = 5;

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
  const [activeTab, setActiveTab] = useState<"core" | "additional">("core");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  const { core, additional } = splitServicesByCategory(initialServices);
  const services = activeTab === "core" ? core : additional;

  const totalPages = Math.max(1, Math.ceil(services.length / ITEMS_PER_PAGE));
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return services.slice(start, start + ITEMS_PER_PAGE);
  }, [services, currentPage]);

  function switchTab(tab: "core" | "additional") {
    setActiveTab(tab);
    setCurrentPage(1);
  }

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
      {!showEditor ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">Services Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage core services and additional service details separately.
              </p>
            </div>
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Button variant="outline" onClick={() => setIsAvailabilityModalOpen(true)} className="w-full sm:w-auto">
                <CalendarRange className="mr-2 h-4 w-4" />
                Manage availability
              </Button>
              <Button onClick={handleAdd} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {activeTab === "core" ? "Add Service" : "Add Additional Service"}
              </Button>
            </div>
          </div>

          <div className="flex gap-6 border-b border-border/60">
            <button
              type="button"
              onClick={() => switchTab("core")}
              className={`-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors ${
                activeTab === "core"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Core Services
            </button>
            <button
              type="button"
              onClick={() => switchTab("additional")}
              className={`-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors ${
                activeTab === "additional"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Additional Services
            </button>
          </div>
        </>
      ) : null}

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

      {isAvailabilityModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 px-4 py-6 sm:items-center">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[1.25rem] bg-background shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-background/95 px-5 py-3 backdrop-blur-sm">
              <p className="text-sm font-semibold text-foreground">Manage availability</p>
              <Button variant="outline" size="sm" onClick={() => setIsAvailabilityModalOpen(false)}>
                Close
              </Button>
            </div>
            <div className="p-0">
              <ServiceCalendarManager destinationId={destination.id} services={core} />
            </div>
          </div>
        </div>
      ) : null}

      {!showEditor ? (
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  {activeTab === "core" ? <Home className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    {activeTab === "core" ? "Core Services" : "Additional Services"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeTab === "core"
                      ? "The main bookable packages guests reserve a date and slot for."
                      : "Light add-ons like life vests, spa access, or snorkeling gear just a photo, price, and status."}
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <span className="text-xs text-muted-foreground">
                  {activeTab === "core" ? "Total Core Services" : "Total Additional Services"}
                </span>
                <Badge variant="success">{services.length}</Badge>
              </div>
            </div>

            {services.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground sm:px-6">
                <p className="font-semibold text-foreground/80">
                  {activeTab === "core" ? "No services created yet" : "No additional services yet"}
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs opacity-70">
                  {activeTab === "core"
                    ? "Click Add Service above to define your first bookable package."
                    : "Click Add Additional Service above to list a life vest, spa pass, or similar add-on."}
                </p>
              </div>
            ) : activeTab === "core" ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3 font-medium">Service name</th>
                        <th className="px-3 py-3 font-medium">Description</th>
                        <th className="px-3 py-3 font-medium">Price</th>
                        <th className="px-3 py-3 font-medium">Slots</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedServices.map((service) => (
                        <tr key={service.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              {service.image_url ? (
                                <img
                                  src={service.image_url}
                                  alt={service.title}
                                  className="h-16 w-16 shrink-0 rounded-sm object-cover"
                                />
                              ) : (
                                <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100" />
                              )}
                              <div>
                                <p className="font-semibold text-slate-800">{service.title}</p>
                                <p className="text-xs text-slate-400">
                                  {formatServiceTypeLabel(service.service_type, {
                                    category: destination.category,
                                    includeSlash: true
                                  })}
                                  {" · "}
                                  {service.opening_time && service.closing_time
                                    ? `${formatOperatingTime(service.opening_time)} – ${formatOperatingTime(service.closing_time)}`
                                    : "Hours not set"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[220px] px-3 py-3 text-slate-600">
                            <p className="line-clamp-2">{service.description || "No description"}</p>
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-800">
                            {formatPesoCurrency(service.price_amount)}
                          </td>
                          <td className="px-3 py-3 text-slate-600">{service.daily_capacity}</td>
                          <td className="px-3 py-3">
                            <Badge variant={service.is_active ? "success" : "muted"}>
                              {service.is_active ? "Active" : "Disabled"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                title="Edit service"
                                aria-label="Edit service"
                                onClick={() => handleEdit(service.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <DeleteDestinationServiceButton
                                destinationId={destination.id}
                                serviceId={service.id}
                                label="Delete service"
                                title={`Delete ${service.title}?`}
                                description="Delete this service from the destination? Existing booking snapshots stay on file, but the service will no longer appear in the staff workspace or public booking list."
                                iconOnly
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalCount={services.length}
                  itemLabel="core service"
                  onChange={setCurrentPage}
                />
              </>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3 font-medium">Service Name</th>
                        <th className="px-3 py-3 font-medium">Description</th>
                        <th className="px-3 py-3 font-medium">Price</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedServices.map((service) => (
                        <tr key={service.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              {service.image_url ? (
                                <img
                                  src={service.image_url}
                                  alt={service.title}
                                  className="h-14 w-14 shrink-0 rounded-sm object-cover"
                                />
                              ) : (
                                <div className="h-14 w-14 shrink-0 rounded-lg bg-slate-100" />
                              )}
                              <p className="font-semibold text-slate-800">{service.title}</p>
                            </div>
                          </td>
                          <td className="max-w-[260px] px-3 py-3 text-slate-600">
                            <p className="line-clamp-2">{service.description || "No description"}</p>
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-800">
                            {formatPesoCurrency(service.price_amount)}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant={service.is_active ? "success" : "muted"}>
                              {service.is_active ? "Active" : "Disabled"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                title="Edit item"
                                aria-label="Edit item"
                                onClick={() => handleEdit(service.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <DeleteDestinationServiceButton
                                destinationId={destination.id}
                                serviceId={service.id}
                                label="Delete item"
                                title={`Delete ${service.title}?`}
                                description="Delete this add-on from the destination? Existing booking snapshots stay on file, but the item will no longer appear in the staff workspace or public booking list."
                                iconOnly
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalCount={services.length}
                  itemLabel="additional service"
                  onChange={setCurrentPage}
                />
              </>
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
                {editingServiceId === "new"
                  ? activeTab === "core" ? "Create service" : "Create additional service"
                  : activeTab === "core" ? "Edit service" : "Edit additional service"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground sm:text-right">
              {activeTab === "core"
                ? editingServiceId === "new"
                  ? "Define the new bookable package below."
                  : "Update this package, then use the calendar above to close or reopen dates without changing the saved slot total."
                : "Just a photo, name, description, price, and status — no schedule or capacity needed."}
            </p>
          </div>

          {activeTab === "core" ? (
            <ServicesEditorForm
              destinationId={destination.id}
              destinationCategory={destination.category}
              services={servicesInEditor}
              hideAddRow={editingServiceId !== "new"}
              onSuccess={handleBack}
            />
          ) : (
            <AdditionalServicesEditorForm
              destinationId={destination.id}
              services={servicesInEditor}
              hideAddRow={editingServiceId !== "new"}
              onSuccess={handleBack}
            />
          )}
        </div>
      )}
    </section>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  itemsPerPage,
  totalCount,
  itemLabel,
  onChange
}: {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalCount: number;
  itemLabel: string;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-6">
      <p className="text-xs text-slate-400">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} {itemLabel}
        {totalCount === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onChange(page)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              page === currentPage
                ? "bg-emerald-700 text-white"
                : "border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}