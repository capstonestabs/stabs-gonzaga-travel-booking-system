"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { CalendarRange, ChevronDown, Loader2 } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn, formatDateKey, parseDateKey } from "@/lib/utils";

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildPresets() {
  const today = startOfToday();
  const lastMonthAnchor = addDays(startOfMonth(today), -1);

  return [
    { label: "All time", range: undefined },
    { label: "Today", range: { from: today, to: today } },
    { label: "Last 7 days", range: { from: addDays(today, -6), to: today } },
    { label: "Last 30 days", range: { from: addDays(today, -29), to: today } },
    { label: "This month", range: { from: startOfMonth(today), to: today } },
    { label: "Last month", range: { from: startOfMonth(lastMonthAnchor), to: endOfMonth(lastMonthAnchor) } }
  ];
}

export function DateRangePicker({
  defaultFrom,
  defaultTo
}: {
  defaultFrom: string;
  defaultTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>({
    from: parseDateKey(defaultFrom),
    to: parseDateKey(defaultTo)
  });

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Once the transition finishes (new data has arrived), close the panel.
  useEffect(() => {
    if (!isPending && closingRef.current) {
      closingRef.current = false;
      setOpen(false);
    }
  }, [isPending]);

  const closingRef = useRef(false);

  function applyRange(range: DateRange | undefined) {
    const params = new URLSearchParams(searchParams.toString());

    if (range?.from) {
      const from = range.from;
      const to = range.to ?? range.from;
      params.set("from", formatDateKey(from));
      params.set("to", formatDateKey(to));
    } else {
      params.delete("from");
      params.delete("to");
    }

    closingRef.current = true;
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}` as Route);
    });
  }

  const currentFrom = parseDateKey(defaultFrom);
  const currentTo = parseDateKey(defaultTo);
  const presets = buildPresets();

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-10 gap-2 rounded-[0.9rem] border-border/70 bg-card px-3.5 text-xs font-medium sm:text-sm"
        onClick={() => setOpen((current) => !current)}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <CalendarRange className="h-4 w-4 text-primary" />
        )}
        <span>
          {!searchParams.has("from") && !searchParams.has("to") ? "All time" : `${formatDisplayDate(currentFrom)} &ndash; ${formatDisplayDate(currentTo)}`}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open ? "rotate-180" : "")} />
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 flex max-h-[min(30rem,80vh)] w-[min(34rem,92vw)] overflow-hidden rounded-[1.1rem] border border-border/70 bg-card shadow-[0_22px_50px_rgba(22,74,47,0.16)]">
          <div className="w-36 shrink-0 overflow-y-auto overscroll-contain border-r border-border/70 bg-muted/30 p-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={isPending}
                onClick={() => {
                  setDraftRange(preset.range);
                  applyRange(preset.range);
                }}
                className="flex w-full items-center rounded-[0.75rem] px-2.5 py-2 text-left text-xs font-medium text-foreground/75 transition-colors hover:bg-card hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              <Calendar
                mode="range"
                numberOfMonths={2}
                defaultMonth={currentFrom}
                selected={draftRange}
                onSelect={setDraftRange}
                className="bg-transparent p-1"
              />
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 px-2 py-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-9"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="min-h-9 gap-1.5"
                onClick={() => applyRange(draftRange)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {isPending ? "Applying..." : "Apply"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}