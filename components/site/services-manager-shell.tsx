"use client";

import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";

import { DeleteDestinationServiceButton } from "@/components/forms/delete-destination-service-button";
import { ServiceCalendarManager } from "@/components/forms/service-calendar-manager";
import { ServicesEditorForm } from "@/components/forms/services-editor-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Destination, DestinationService } from "@/lib/types";
import { formatPesoCurrency } from "@/lib/utils";

export function ServicesManagerShell({
  destination,
  initialServices
}: {
  destination: Destination;
  initialServices: DestinationService[];
}) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

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

  return (
    <section className="space-y-5">
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
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
                            className="h-4 bg-muted/40 text-[10px] uppercase"
                          >
                            {service.service_type}
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
