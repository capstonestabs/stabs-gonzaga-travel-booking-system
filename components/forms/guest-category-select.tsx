"use client";

import { useState } from "react";
import { Accessibility, Baby, ChevronDown, Users } from "lucide-react";

import { formatEntranceFeeAgeRange, type EntranceFeeCategory } from "@/lib/entrance-fees";
import { formatPesoCurrency } from "@/lib/utils";

function getEntranceFeeCategoryIcon(categoryId: string) {
  return categoryId === "child" ? Baby : categoryId === "senior" ? Accessibility : Users;
}

export function GuestCategorySelect({
  categories,
  value,
  onChange,
  required
}: {
  categories: EntranceFeeCategory[];
  value: string;
  onChange: (categoryId: string) => void;
  required: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCategory = categories.find((category) => category.id === value) ?? null;
  const SelectedIcon = selectedCategory ? getEntranceFeeCategoryIcon(selectedCategory.id) : Users;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select guest category"
        className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-[0.8rem] border bg-card px-3 py-2 text-left text-sm outline-none transition focus:ring-2 focus:ring-ring ${selectedCategory ? "border-input" : "border-input/90 text-muted-foreground"}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${selectedCategory ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
            <SelectedIcon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{selectedCategory?.label ?? "Select category"}</span>
            {selectedCategory ? (
              <span className="block truncate text-[10px] text-muted-foreground">
                {formatEntranceFeeAgeRange(selectedCategory)} · {formatPesoCurrency(selectedCategory.amount)}
              </span>
            ) : null}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div role="listbox" className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-[0.8rem] border border-border bg-card shadow-[0_12px_28px_rgba(22,74,47,0.14)]">
          {categories.map((category) => {
            const CategoryIcon = getEntranceFeeCategoryIcon(category.id);
            const isSelected = category.id === value;

            return (
              <button
                key={category.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(category.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left last:border-b-0 hover:bg-primary/5 ${isSelected ? "bg-primary/5" : "bg-card"}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${category.id === "child" ? "bg-amber-100 text-amber-700" : category.id === "senior" ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
                  <CategoryIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{category.label}</span>
                  <span className="block text-xs text-muted-foreground">{formatEntranceFeeAgeRange(category)} · {formatPesoCurrency(category.amount)} per guest</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      {required && !selectedCategory ? <span className="sr-only">A category is required.</span> : null}
    </div>
  );
}
