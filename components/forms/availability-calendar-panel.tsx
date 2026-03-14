"use client";

import { useEffect, useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import type { AvailabilityCalendarDay } from "@/lib/types";
import { formatDateKey, formatMonthKey, parseDateKey } from "@/lib/utils";

function normalizeToMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function AvailabilityCalendarPanel({
  destinationId,
  serviceId,
  selectedDate,
  onSelectDate
}: {
  destinationId: string;
  serviceId: string;
  selectedDate: string;
  onSelectDate: (nextDate: string) => void;
}) {
  const [month, setMonth] = useState(
    normalizeToMonth(selectedDate ? parseDateKey(selectedDate) : new Date())
  );
  const [days, setDays] = useState<AvailabilityCalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    const nextMonth = normalizeToMonth(parseDateKey(selectedDate));
    if (
      nextMonth.getFullYear() !== month.getFullYear() ||
      nextMonth.getMonth() !== month.getMonth()
    ) {
      setMonth(nextMonth);
    }
  }, [month, selectedDate]);

  useEffect(() => {
    let isActive = true;

    async function loadMonthStatuses() {
      setError(null);
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/destinations/${destinationId}/availability?serviceId=${encodeURIComponent(serviceId)}&month=${encodeURIComponent(formatMonthKey(month))}`,
          {
            cache: "no-store"
          }
        );

        const body = (await response.json()) as {
          error?: string;
          days?: AvailabilityCalendarDay[];
        };

        if (!response.ok) {
          throw new Error(body.error ?? "Unable to load the calendar.");
        }

        if (isActive) {
          setDays(body.days ?? []);
        }
      } catch (calendarError) {
        if (isActive) {
          setDays([]);
          setError(
            calendarError instanceof Error
              ? calendarError.message
              : "Unable to load the calendar."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadMonthStatuses();

    return () => {
      isActive = false;
    };
  }, [destinationId, month, serviceId]);

  const dayStatusMap = useMemo(
    () => new Map(days.map((entry) => [entry.date, entry.status])),
    [days]
  );

  const closedDates = useMemo(
    () =>
      days
        .filter((entry) => entry.status === "closed")
        .map((entry) => parseDateKey(entry.date)),
    [days]
  );

  const fullDates = useMemo(
    () =>
      days
        .filter((entry) => entry.status === "full")
        .map((entry) => parseDateKey(entry.date)),
    [days]
  );

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const selected = selectedDate ? parseDateKey(selectedDate) : undefined;

  return (
    <div className="space-y-3 rounded-[1.3rem] border border-border/70 bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Availability calendar</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Pick an available day from the calendar below.
          </p>
        </div>
        {selectedDate ? (
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
            Selected {selectedDate}
          </p>
        ) : null}
      </div>

      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        selected={selected}
        onSelect={(date) => {
          if (!date) {
            return;
          }

          const nextDate = formatDateKey(date);
          const status = dayStatusMap.get(nextDate);

          if (status === "closed" || status === "full" || nextDate < formatDateKey(today)) {
            return;
          }

          onSelectDate(nextDate);
        }}
        disabled={[
          { before: today },
          ...closedDates,
          ...fullDates
        ]}
        modifiers={{
          closed: closedDates,
          full: fullDates
        }}
        modifiersClassNames={{
          closed:
            "text-muted-foreground/75 [&>button]:border-border/70 [&>button]:bg-muted [&>button]:text-muted-foreground [&>button]:line-through [&>button]:opacity-90",
          full:
            "text-amber-800 [&>button]:border-amber-200 [&>button]:bg-amber-50 [&>button]:text-amber-800 [&>button]:opacity-100"
        }}
      />

      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-2.5 py-1">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
          Available
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-2.5 py-1">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/55" />
          Closed
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-2.5 py-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Fully booked
        </span>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading calendar...</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
