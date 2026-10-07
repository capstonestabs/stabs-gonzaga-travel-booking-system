"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Accessibility, Baby, CheckCircle2, DollarSign, Plus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_ENTRANCE_FEE_CATEGORIES,
  formatEntranceFeeAgeRange,
  type EntranceFeeCategory
} from "@/lib/entrance-fees";
import type { Destination } from "@/lib/types";
import { formatPesoCurrency } from "@/lib/utils";

function createCategoryId() {
  return `category-${crypto.randomUUID()}`;
}

export function EntranceFeeManager({ destination }: { destination: Destination }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(destination.is_entrance_fee_active ?? false);
  const [categories, setCategories] = useState<EntranceFeeCategory[]>(
    destination.entrance_fee_categories?.length
      ? destination.entrance_fee_categories
      : DEFAULT_ENTRANCE_FEE_CATEGORIES
  );
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateCategory(id: string, changes: Partial<EntranceFeeCategory>) {
    setCategories((current) =>
      current.map((category) => (category.id === id ? { ...category, ...changes } : category))
    );
  }

  function addCategory() {
    setCategories((current) => [
      ...current,
      { id: createCategoryId(), label: "New Category", minAge: 0, maxAge: null, amount: 0 }
    ]);
  }

  function removeCategory(id: string) {
    setCategories((current) => current.filter((category) => category.id !== id));
  }

  function isCustomCategory(category: EntranceFeeCategory) {
    return category.id.startsWith("category-");
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!destination?.id) {
      setErrorMessage("Destination ID is missing. Please refresh the page.");
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/destinations/${destination.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEntranceFeeActive: isActive,
          entranceFeeCategories: categories.map((category) => ({
            ...category,
            label: category.label.trim(),
            minAge: Math.max(0, Math.floor(Number(category.minAge) || 0)),
            maxAge: category.maxAge === null
              ? null
              : Math.max(0, Math.floor(Number(category.maxAge) || 0)),
            amount: Math.max(0, Number(category.amount) || 0)
          }))
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? `Failed to update entrance fee settings (Status ${response.status}).`);
      }

      setSuccessMessage("Entrance fee categories updated successfully!");
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save entrance fee settings.");
    } finally {
      setIsSaving(false);
    }
  }

  const sampleGuestCounts = [2, 1, 1];
  const sampleTotal = categories.reduce(
    (total, category, index) => total + Number(category.amount || 0) * (sampleGuestCounts[index] ?? 1),
    0
  );

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <DollarSign className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base font-bold sm:text-lg">Entrance Fee Module</CardTitle>
            <CardDescription className="text-xs">
              Set age-based entrance fees for each guest category. These settings will be used when age-based booking fees are enabled.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Require Entrance Fee</p>
              <p className="text-xs text-muted-foreground">
                When enabled, this destination will include its entrance fee in booking totals.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((current) => !current)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isActive ? "bg-emerald-600" : "bg-slate-300"}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition ${isActive ? "translate-x-5" : "translate-x-0"}`} />
              </button>
              <span className={`text-xs font-semibold ${isActive ? "text-emerald-700" : "text-muted-foreground"}`}>
                {isActive ? "Active" : "Disabled"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide text-emerald-900">Entrance Fee Categories</h2>
              <p className="mt-1 text-xs text-muted-foreground">Edit the label and amount for the default categories, or add another category.</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border/70">
              <div className="hidden grid-cols-[minmax(9rem,1fr),minmax(10rem,1fr),minmax(10rem,1fr),2.5rem] gap-4 border-b border-border/70 bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                <span>Category</span>
                <span>Fee label/title</span>
                <span>Fee amount per guest (PHP)</span>
                <span />
              </div>
              {categories.map((category) => {
                const CategoryIcon = category.id === "child" ? Baby : category.id === "senior" ? Accessibility : Users;

                return (
                <div key={category.id} className="grid gap-3 border-b border-border/70 p-4 last:border-b-0 sm:grid-cols-[minmax(9rem,1fr),minmax(10rem,1fr),minmax(10rem,1fr),2.5rem] sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <CategoryIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{category.label}</p>
                      {isCustomCategory(category) ? (
                        <div className="mt-1 grid grid-cols-2 gap-1.5">
                          <Input
                            type="number"
                            min="0"
                            value={category.minAge}
                            onChange={(event) => updateCategory(category.id, { minAge: Number(event.target.value) || 0 })}
                            aria-label={`${category.label} minimum age`}
                            className="h-7 px-2 text-[11px]"
                            placeholder="Min age"
                            required
                          />
                          <Input
                            type="number"
                            min={category.minAge}
                            value={category.maxAge ?? ""}
                            onChange={(event) => updateCategory(category.id, { maxAge: event.target.value === "" ? null : Number(event.target.value) })}
                            aria-label={`${category.label} maximum age`}
                            className="h-7 px-2 text-[11px]"
                            placeholder="Max age"
                          />
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">{formatEntranceFeeAgeRange(category)}</p>
                      )}
                    </div>
                  </div>
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:hidden">Fee label/title</span>
                    <Input
                      value={category.label}
                      onChange={(event) => updateCategory(category.id, { label: event.target.value })}
                      aria-label={`${category.label} category label`}
                      className="h-10 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:hidden">Fee amount per guest (PHP)</span>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">₱</span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={category.amount}
                        onChange={(event) => updateCategory(category.id, { amount: event.target.value === "" ? 0 : Number(event.target.value) })}
                        aria-label={`${category.label} fee amount`}
                        className="h-10 pl-7 text-sm font-medium"
                        required
                      />
                    </div>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeCategory(category.id)}
                    disabled={categories.length <= 1}
                    aria-label={`Remove ${category.label} category`}
                    className="h-10 w-10 px-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                );
              })}
            </div>

            <Button type="button" variant="outline" onClick={addCategory}>
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>

          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Sample calculation preview</p>
            <div className="mt-4 grid grid-cols-4 gap-3 text-xs text-slate-700">
              <div className="space-y-2">
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                {categories.map((category) => <p key={category.id} className="truncate font-medium">{category.label}</p>)}
              </div>
              <div className="space-y-2 text-right">
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">Guest count</p>
                {categories.map((category, index) => <p key={category.id}>{sampleGuestCounts[index] ?? 1} guest{(sampleGuestCounts[index] ?? 1) === 1 ? "" : "s"}</p>)}
              </div>
              <div className="space-y-2 text-right">
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">Fee per guest</p>
                {categories.map((category) => <p key={category.id}>{formatPesoCurrency(Number(category.amount || 0))}</p>)}
              </div>
              <div className="space-y-2 text-right">
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">Subtotal</p>
                {categories.map((category, index) => <p key={category.id}>{formatPesoCurrency(Number(category.amount || 0) * (sampleGuestCounts[index] ?? 1))}</p>)}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-emerald-200/60 pt-4 font-semibold text-emerald-900">
              <span>Total Entrance Fee</span>
              <span>{formatPesoCurrency(sampleTotal)}</span>
            </div>
          </div>

          {errorMessage ? <div className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">{errorMessage}</div> : null}
          {successMessage ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {successMessage}
            </div>
          ) : null}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving} className="min-w-[180px]">
              {isSaving ? "Saving..." : "Save entrance fee settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
