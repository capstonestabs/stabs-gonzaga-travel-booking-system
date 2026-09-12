"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn, formatDateKey, parseDateKey } from "@/lib/utils";

interface ServiceDateRangePickerProps {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  minStartDate?: string;
  maxEndDate?: string;
}

function normalizeToMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function ServiceDateRangePicker({
  startDate,
  endDate,
  startTime,
  endTime,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  minStartDate,
  maxEndDate
}: ServiceDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() =>
    startDate ? normalizeToMonth(parseDateKey(startDate)) : new Date()
  );
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(() => {
    const from = startDate ? parseDateKey(startDate) : undefined;
    const to = endDate ? parseDateKey(endDate) : undefined;
    return from ? { from, to } : undefined;
  });

  useEffect(() => {
    const from = startDate ? parseDateKey(startDate) : undefined;
    const to = endDate ? parseDateKey(endDate) : undefined;
    setDraftRange(from ? { from, to } : undefined);
  }, [startDate, endDate]);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const disabled = useMemo(() => {
    const matchers: Array<Date | { before: Date } | { after: Date }> = [{ before: today }];

    if (minStartDate) {
      const minDate = parseDateKey(minStartDate);
      matchers.push({ before: minDate });
    }

    if (maxEndDate) {
      const maxDate = parseDateKey(maxEndDate);
      matchers.push({ after: maxDate });
    }

    return matchers;
  }, [today, minStartDate, maxEndDate]);

  function applyRange(range: DateRange | undefined) {
    if (!range?.from) {
      onStartDateChange("");
      onEndDateChange("");
      setDraftRange(undefined);
      return;
    }

    const fromKey = formatDateKey(range.from);
    onStartDateChange(fromKey);

    if (range.to) {
      const toKey = formatDateKey(range.to);
      onEndDateChange(toKey);
    } else {
      onEndDateChange("");
    }
  }

  function handleRangeSelect(range: DateRange | undefined) {
    setDraftRange(range);
    applyRange(range);
  }

  const selectedRange: DateRange | undefined = startDate
    ? {
        from: parseDateKey(startDate),
        to: endDate ? parseDateKey(endDate) : undefined
      }
    : undefined;

  const displayLabel = useMemo(() => {
    if (startDate && endDate) {
      const timeSuffix =
        startTime || endTime
          ? ` · ${startTime || "00:00"} – ${endTime || "00:00"}`
          : "";
      return `${startDate} → ${endDate}${timeSuffix}`;
    }
    if (startDate) {
      const timeSuffix = startTime ? ` at ${startTime}` : "";
      return `Check-in ${startDate}${timeSuffix}`;
    }
    return "Select booking window";
  }, [startDate, endDate, startTime, endTime]);

  return (
    <div className={cn("space-y-3")}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-[1rem] border border-border/70 bg-card px-4 py-3 text-left",
          "transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-md",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
          open && "border-primary/50 bg-card/90 shadow-md"
        )}
      >
        <span className="flex items-center gap-3">
          <span className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors",
            open && "bg-primary/15 text-primary"
          )}>
            <CalendarIcon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Booking window
            </span>
            <span className="block truncate text-sm font-semibold text-foreground">
              {displayLabel}
            </span>
          </span>
        </span>
        <ChevronRight className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          open && "rotate-180 text-primary"
        )} />
      </button>

      {open ? (
        <div className="space-y-4 rounded-[1.2rem] border border-border/70 bg-card p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          <Calendar
            mode="range"
            month={month}
            onMonthChange={setMonth}
            selected={draftRange}
            onSelect={handleRangeSelect}
            disabled={disabled}
            numberOfMonths={1}
            classNames={{
              month: "space-y-4",
              month_caption: "flex items-center justify-between gap-2 px-1",
              caption_label: "font-display text-[1.05rem] font-semibold tracking-tight text-foreground",
              nav: "flex items-center gap-1",
              button_previous:
                "h-8 w-8 rounded-full border border-border/65 bg-background/80 p-0 text-foreground/85 hover:bg-secondary",
              button_next:
                "h-8 w-8 rounded-full border border-border/65 bg-background/80 p-0 text-foreground/85 hover:bg-secondary",
              month_grid: "w-full border-separate border-spacing-y-1.5",
              weekdays: "grid grid-cols-7 gap-1",
              weekday:
                "flex h-8 items-center justify-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
              week: "grid grid-cols-7 gap-1",
              day: "relative h-10 w-full p-0 text-center text-sm",
              day_button:
                "h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent p-0 text-sm font-medium text-foreground shadow-none hover:border-border/70 hover:bg-secondary/70",
              today:
                "rounded-[0.9rem] bg-primary/10 text-primary ring-1 ring-primary/15",
              selected:
                "rounded-[0.9rem] bg-primary text-primary-foreground ring-0 hover:bg-primary/94 hover:text-primary-foreground",
              range_start:
                "[&>button]:bg-emerald-200 [&>button]:text-emerald-900 [&>button]:rounded-r-none [&>button]:font-semibold",
              range_middle:
                "[&>button]:bg-emerald-100 [&>button]:text-emerald-900 [&>button]:rounded-none",
              range_end:
                "[&>button]:bg-emerald-200 [&>button]:text-emerald-900 [&>button]:rounded-l-none [&>button]:font-semibold",
              outside: "text-muted-foreground/35 opacity-70",
              disabled: "text-muted-foreground/35 opacity-55",
              hidden: "invisible"
            }}
            components={{
              Chevron: ({ orientation, className: iconClassName, ...componentProps }) =>
                orientation === "left" ? (
                  <ChevronLeft className={cn("h-4 w-4", iconClassName)} {...componentProps} />
                ) : (
                  <ChevronRight className={cn("h-4 w-4", iconClassName)} {...componentProps} />
                )
            }}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Check-in time
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(event) => onStartTimeChange(event.target.value)}
                className={cn(
                  "h-10 rounded-[0.85rem] border-border/70 bg-background text-sm",
                  "focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Check-out time
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(event) => onEndTimeChange(event.target.value)}
                className={cn(
                  "h-10 rounded-[0.85rem] border-border/70 bg-background text-sm",
                  "focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                )}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
