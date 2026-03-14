"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatServiceWindowLabel } from "@/lib/booking-state";
import type { DestinationService } from "@/lib/types";
import { formatDateKey, formatMonthKey, parseDateKey } from "@/lib/utils";

interface Closure {
  serviceId: string;
  closedDate: string;
}

export function ServiceCalendarManager({
  destinationId,
  services
}: {
  destinationId: string;
  services: DestinationService[];
}) {
  const router = useRouter();
  const [closures, setClosures] = useState<Closure[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");

  useEffect(() => {
    async function fetchCalendar() {
      try {
        const response = await fetch(`/api/destinations/${destinationId}/calendar`, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Failed to load calendar data.");
        }

        const body = (await response.json()) as {
          closures?: Closure[];
        };

        setClosures(body.closures ?? []);
      } catch (_error) {
        setError("Unable to load closed dates.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchCalendar();
  }, [destinationId]);

  useEffect(() => {
    if (!services.length) {
      setSelectedServiceId("");
      return;
    }

    if (!services.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId(services[0]?.id ?? "");
    }
  }, [selectedServiceId, services]);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const minSelectableDate = useMemo(() => {
    if (!selectedService?.availability_start_date) {
      return today;
    }

    const windowStart = parseDateKey(selectedService.availability_start_date);
    return windowStart > today ? windowStart : today;
  }, [selectedService?.availability_start_date, today]);

  const maxSelectableDate = useMemo(
    () =>
      selectedService?.availability_end_date
        ? parseDateKey(selectedService.availability_end_date)
        : undefined,
    [selectedService?.availability_end_date]
  );

  const closedDatesForSelectedService = useMemo(
    () =>
      closures
        .filter((closure) => closure.serviceId === selectedServiceId)
        .map((closure) => closure.closedDate)
        .sort((left, right) => left.localeCompare(right)),
    [closures, selectedServiceId]
  );

  const closedDateSet = useMemo(
    () => new Set(closedDatesForSelectedService),
    [closedDatesForSelectedService]
  );

  function toggleClosedDate(day: Date) {
    if (!selectedServiceId) {
      return;
    }

    const dateKey = formatDateKey(day);
    if (dateKey < formatDateKey(today)) {
      return;
    }

    setClosures((previous) => {
      const exists = previous.some(
        (entry) => entry.serviceId === selectedServiceId && entry.closedDate === dateKey
      );

      if (exists) {
        return previous.filter(
          (entry) => !(entry.serviceId === selectedServiceId && entry.closedDate === dateKey)
        );
      }

      return [...previous, { serviceId: selectedServiceId, closedDate: dateKey }];
    });

    setError(null);
    setMessage(null);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/destinations/${destinationId}/calendar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closures })
      });

      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to save calendar.");
      }

      setMessage(body.message ?? "Calendar settings saved securely.");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Error saving calendar."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <CardTitle>Service calendar</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select a service, then click any future day to mark it closed or reopen it.
          This calendar affects date availability only and does not reduce the saved package slot count.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-4 rounded-[1rem] border border-border/70 bg-muted/15 p-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Selected service
              </span>
              <select
                className="w-full rounded-[0.95rem] border border-input bg-background px-3 py-2.5 text-sm"
                value={selectedServiceId}
                onChange={(event) => {
                  setSelectedServiceId(event.target.value);
                  setError(null);
                  setMessage(null);
                }}
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title} ({service.daily_capacity} slots/day)
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2 rounded-[0.95rem] border border-border/70 bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Service status
              </p>
              <p className="font-medium text-foreground">
                {selectedService?.is_active ? "Active and visible to tourists" : "Hidden from tourists"}
              </p>
              <p className="text-sm text-muted-foreground">
                Open dates use the service&apos;s configured daily slot count. Closed dates are fully unavailable in the booking calendar.
              </p>
              <p className="text-xs text-muted-foreground">
                Booking window:{" "}
                {formatServiceWindowLabel({
                  availabilityStartDate: selectedService?.availability_start_date,
                  availabilityEndDate: selectedService?.availability_end_date
                })}
              </p>
            </div>

            <div className="space-y-3 rounded-[0.95rem] border border-border/70 bg-card px-4 py-3">
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 py-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
                  Open
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 py-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/55" />
                  Closed
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Closed dates for {selectedService?.title ?? "service"}
                </p>
                {closedDatesForSelectedService.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No closed dates yet for {formatMonthKey(currentMonth)}.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {closedDatesForSelectedService.map((date) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => toggleClosedDate(parseDateKey(date))}
                        className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        {date}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-[1rem] border border-border/70 bg-muted/10 p-3">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading calendar...</p>
            ) : (
              <Calendar
                mode="single"
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                onDayClick={(day) => {
                  const dayKey = formatDateKey(day);

                  if (
                    day >= minSelectableDate &&
                    (!selectedService?.availability_end_date ||
                      dayKey <= selectedService.availability_end_date)
                  ) {
                    toggleClosedDate(day);
                  }
                }}
                disabled={[
                  { before: minSelectableDate },
                  ...(maxSelectableDate ? [{ after: maxSelectableDate }] : [])
                ]}
                modifiers={{
                  closed: closedDatesForSelectedService.map((date) => parseDateKey(date))
                }}
                modifiersClassNames={{
                  closed:
                    "text-muted-foreground/80 [&>button]:border-border/70 [&>button]:bg-muted [&>button]:text-muted-foreground [&>button]:line-through [&>button]:opacity-100"
                }}
              />
            )}
            <p className="px-1 text-xs text-muted-foreground">
              Dates outside the service booking window stay disabled automatically. Existing bookings still reduce live availability separately.
            </p>
          </div>
        </div>

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="button" onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? "Saving calendar..." : "Save calendar"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Click a highlighted closed date again to reopen it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
