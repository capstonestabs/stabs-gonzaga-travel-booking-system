"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, ImageOff, MapPin, Package, UserRound } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";

export type DestinationFinancialListItem = {
  destinationId: string;
  title: string;
  locationText: string;
  staffName: string | null;
  coverUrl: string | null;
  serviceCount: number;
  grossAmount: number;
  settledAmount: number;
  unsettledAmount: number;
};

type SortOption = "gross-desc" | "gross-asc" | "services-desc" | "services-asc";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "gross-desc", label: "Highest gross" },
  { value: "gross-asc", label: "Lowest gross" },
  { value: "services-desc", label: "Most services" },
  { value: "services-asc", label: "Least services" }
];

function SortDropdown({ value, onChange }: { value: SortOption; onChange: (next: SortOption) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLabel = sortOptions.find((option) => option.value === value)?.label ?? "Sort by";

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

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
          open
            ? "border-primary bg-primary/10 text-primary"
            : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/50"
        )}
      >
        <span className="text-muted-foreground">Sort by</span>
        <span className="text-foreground">{activeLabel}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open ? "rotate-180" : "")} />
      </button>

      <div
        role="listbox"
        className={cn(
          "absolute left-0 top-[calc(100%+0.4rem)] z-20 w-48 origin-top-left overflow-hidden rounded-[0.85rem] border border-border/70 bg-card shadow-[0_18px_40px_rgba(22,74,47,0.14)] transition-all duration-150 ease-out",
          open
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
            : "-translate-y-1 opacity-0 scale-95 pointer-events-none"
        )}
      >
        {sortOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={value === option.value}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-colors",
              value === option.value
                ? "bg-primary/10 font-medium text-primary"
                : "text-foreground hover:bg-muted/50"
            )}
          >
            {option.label}
            {value === option.value ? <Check className="h-3.5 w-3.5" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DestinationFinancialsList({ items }: { items: DestinationFinancialListItem[] }) {
  const [sortBy, setSortBy] = useState<SortOption>("gross-desc");

  const sortedItems = useMemo(() => {
    const copy = [...items];
    switch (sortBy) {
      case "gross-desc":
        return copy.sort((a, b) => b.grossAmount - a.grossAmount);
      case "gross-asc":
        return copy.sort((a, b) => a.grossAmount - b.grossAmount);
      case "services-desc":
        return copy.sort((a, b) => b.serviceCount - a.serviceCount);
      case "services-asc":
        return copy.sort((a, b) => a.serviceCount - b.serviceCount);
      default:
        return copy;
    }
  }, [items, sortBy]);

  return (
    <div className="space-y-3.5">
      <SortDropdown value={sortBy} onChange={setSortBy} />

      <div className="space-y-2.5">
        {sortedItems.map((item) => (
          <Link
            key={item.destinationId}
            href={`/admin/destination-financials/${item.destinationId}` as Route}
            className="flex flex-col gap-3 rounded-[0.95rem] border border-border/70 bg-card/90 p-3.5 transition-colors hover:border-primary/40 hover:bg-muted/25 sm:flex-row sm:items-center"
          >
            <div className="h-20 w-full shrink-0 overflow-hidden rounded-[0.8rem] bg-muted sm:h-16 sm:w-24">
              {item.coverUrl ? (
                <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageOff className="h-5 w-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="font-display text-[1.1rem] font-semibold tracking-tight text-foreground">
                {item.title}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.locationText}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5" />
                  {item.staffName ?? "No staff assigned"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  {item.serviceCount} service{item.serviceCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[0.85rem] border border-border/70 bg-muted/22 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Gross</p>
                  <p className="mt-1 text-sm font-medium">{formatCurrency(item.grossAmount)}</p>
                </div>
                <div className="rounded-[0.85rem] border border-border/70 bg-muted/22 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Settled</p>
                  <p className="mt-1 text-sm font-medium">{formatCurrency(item.settledAmount)}</p>
                </div>
                <div className="rounded-[0.85rem] border border-border/70 bg-muted/22 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Pending</p>
                  <p className="mt-1 text-sm font-medium">{formatCurrency(item.unsettledAmount)}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}