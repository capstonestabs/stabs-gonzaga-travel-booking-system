"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import type { AvailabilityCalendarDay } from "@/lib/types";
import { cn, formatDateKey, formatMonthKey, parseDateKey } from "@/lib/utils";

function normalizeToMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

interface AvailabilityCalendarPanelProps {
  destinationId: string;
  serviceId: string;
  compactDesktop?: boolean;
  /** "single" (default) keeps the original one-date behavior. "range" adds check-in/check-out selection. */
  mode?: "single" | "range";
  /** single mode */
  selectedDate?: string;
  onSelectDate?: (nextDate: string) => void;
  /** range mode */
  checkInDate?: string;
  checkOutDate?: string;
  onRangeChange?: (next: { checkIn: string; checkOut: string }) => void;
  /** Optional availability status message to show below the calendar. */
  availabilityMessage?: string;
  availabilityTone?: "success" | "warning" | "destructive" | "muted";
  availabilityStartDate?: string | null;
  availabilityEndDate?: string | null;
}

export function AvailabilityCalendarPanel({
  destinationId,
  serviceId,
  compactDesktop = false,
  mode = "single",
  selectedDate = "",
  onSelectDate,
  checkInDate = "",
  checkOutDate = "",
  onRangeChange,
  availabilityMessage,
  availabilityTone,
  availabilityStartDate,
  availabilityEndDate
}: AvailabilityCalendarPanelProps) {
  const anchorDate = mode === "range" ? checkInDate : selectedDate;

  const [month, setMonth] = useState(
    normalizeToMonth(anchorDate ? parseDateKey(anchorDate) : new Date())
  );
  const [days, setDays] = useState<AvailabilityCalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeNotice, setRangeNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!anchorDate) {
      return;
    }

    const nextMonth = normalizeToMonth(parseDateKey(anchorDate));
    if (
      nextMonth.getFullYear() !== month.getFullYear() ||
      nextMonth.getMonth() !== month.getMonth()
    ) {
      setMonth(nextMonth);
    }
  }, [anchorDate]);

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

  const windowMatcher = useMemo(() => {
    if (!availabilityStartDate && !availabilityEndDate) {
      return undefined;
    }

    return (date: Date) => {
      const dateKey = formatDateKey(date);
      if (availabilityStartDate && dateKey < availabilityStartDate) {
        return true;
      }
      if (availabilityEndDate && dateKey > availabilityEndDate) {
        return true;
      }
      return false;
    };
  }, [availabilityStartDate, availabilityEndDate]);

  function isDateBlocked(dateKey: string) {
    const status = dayStatusMap.get(dateKey);
    return status === "closed" || status === "full" || dateKey < formatDateKey(today);
  }

  function hasBlockedDateInRange(fromKey: string, toKey: string) {
    const cursor = parseDateKey(fromKey);

    while (formatDateKey(cursor) <= toKey) {
      if (isDateBlocked(formatDateKey(cursor))) {
        return true;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return false;
  }

  const compactClassNames = compactDesktop
    ? {
        month: "space-y-4 xl:space-y-2",
        month_grid: "w-full border-separate border-spacing-y-1.5 xl:border-spacing-y-1",
        weekday:
          "flex h-8 items-center justify-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground xl:h-6",
        day: "relative h-10 w-full p-0 text-center text-sm xl:h-8",
        day_button:
          "h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent p-0 text-sm font-medium text-foreground shadow-none hover:border-border/70 hover:bg-secondary/70 xl:h-8 xl:rounded-[0.7rem]"
      }
    : {};

  const legend = (
    <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-2.5 py-1">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            mode === "range" ? "bg-emerald-200" : "bg-primary/80"
          )}
        />
        {mode === "range" ? "Your dates" : "Available"}
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
  );

  const availabilityToneClass =
    availabilityTone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : availabilityTone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : availabilityTone === "destructive"
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : "border-border/70 bg-muted/45 text-muted-foreground";

  const availabilityStatusMessage = availabilityMessage ? (
    <p className={`rounded-[0.8rem] border px-3.5 py-2.5 text-xs font-medium ${availabilityToneClass}`}>
      {availabilityMessage}
    </p>
  ) : null;

  if (mode === "range") {
    const selectedRange: DateRange | undefined = checkInDate
      ? {
          from: parseDateKey(checkInDate),
          to: checkOutDate ? parseDateKey(checkOutDate) : undefined
        }
      : undefined;

    const helperText = !checkInDate
      ? "Pick an available check-in date to get started."
      : !checkOutDate
        ? "Check-in set. Now pick your check-out date."
        : "Tap a new date to start over.";

    return (
      <div
        className={cn(
          "space-y-3 rounded-[1.3rem] border border-border/70 bg-muted/30 p-4",
          compactDesktop && "xl:space-y-2 xl:p-3"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">Availability calendar</p>
            <p className={cn("text-xs leading-5 text-muted-foreground", compactDesktop && "xl:hidden")}>
              {helperText}
            </p>
          </div>
          {checkInDate ? (
            <p className="text-right text-xs font-medium uppercase tracking-[0.12em] text-primary">
              {checkOutDate ? `${checkInDate} \u2192 ${checkOutDate}` : `Check-in ${checkInDate}`}
            </p>
          ) : null}
        </div>

        <Calendar
          mode="range"
          month={month}
          onMonthChange={setMonth}
          selected={selectedRange}
          onSelect={(range) => {
            setRangeNotice(null);

            if (!range || !range.from) {
              onRangeChange?.({ checkIn: "", checkOut: "" });
              return;
            }

            const fromKey = formatDateKey(range.from);
            if (isDateBlocked(fromKey)) {
              return;
            }

            if (!range.to) {
              onRangeChange?.({ checkIn: fromKey, checkOut: "" });
              return;
            }

            const toKey = formatDateKey(range.to);

            if (isDateBlocked(toKey) || hasBlockedDateInRange(fromKey, toKey)) {
              setRangeNotice(
                "Some dates in that range are closed or fully booked. Pick a different check-out date."
              );
              onRangeChange?.({ checkIn: fromKey, checkOut: "" });
              return;
            }

            onRangeChange?.({ checkIn: fromKey, checkOut: toKey });
          }}
          disabled={windowMatcher ? [windowMatcher, { before: today }, ...closedDates, ...fullDates] : [{ before: today }, ...closedDates, ...fullDates]}
          modifiersClassNames={{
            range_start:
              "[&>button]:bg-emerald-200 [&>button]:text-emerald-900 [&>button]:rounded-r-none [&>button]:font-semibold",
            range_middle:
              "[&>button]:bg-emerald-100 [&>button]:text-emerald-900 [&>button]:rounded-none",
            range_end:
              "[&>button]:bg-emerald-200 [&>button]:text-emerald-900 [&>button]:rounded-l-none [&>button]:font-semibold"
          }}
          classNames={{ selected: "", ...compactClassNames }}
          className={compactDesktop ? "xl:p-2" : undefined}
        />

        {rangeNotice ? <p className="text-xs text-destructive">{rangeNotice}</p> : null}

        {legend}

        {availabilityStatusMessage}

        {isLoading ? <p className="text-xs text-muted-foreground">Loading calendar...</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  const selected = selectedDate ? parseDateKey(selectedDate) : undefined;

  return (
    <div
      className={cn(
        "space-y-3 rounded-[1.3rem] border border-border/70 bg-muted/30 p-4",
        compactDesktop && "xl:space-y-2 xl:p-3"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Availability calendar</p>
          <p className={cn("text-xs leading-5 text-muted-foreground", compactDesktop && "xl:hidden")}>
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
          if (isDateBlocked(nextDate)) {
            return;
          }

          onSelectDate?.(nextDate);
        }}
        disabled={windowMatcher ? [windowMatcher, { before: today }, ...closedDates, ...fullDates] : [{ before: today }, ...closedDates, ...fullDates]}
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
        className={compactDesktop ? "xl:p-2" : undefined}
        classNames={compactDesktop ? compactClassNames : undefined}
      />

      {legend}

      {availabilityStatusMessage}

      {isLoading ? <p className="text-xs text-muted-foreground">Loading calendar...</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}