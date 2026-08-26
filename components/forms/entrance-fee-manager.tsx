"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, DollarSign, Info, ShieldCheck, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Destination } from "@/lib/types";
import { formatPesoCurrency } from "@/lib/utils";

export function EntranceFeeManager({ destination }: { destination: Destination }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState<boolean>(destination.is_entrance_fee_active ?? false);
  const [amount, setAmount] = useState<number | string>(destination.entrance_fee_amount ?? 50);
  const [title, setTitle] = useState<string>(destination.entrance_fee_title ?? "Entrance Fee");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const numericAmount = Math.max(0, Number(amount) || 0);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/destinations/${destination.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isEntranceFeeActive: isActive,
          entranceFeeAmount: numericAmount,
          entranceFeeTitle: title.trim() || "Entrance Fee"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update entrance fee settings.");
      }

      setSuccessMessage("Entrance fee settings updated successfully!");
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to save entrance fee settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Entrance Fee Module</CardTitle>
              <CardDescription className="text-xs">
                Set a mandatory entrance or environmental fee per guest. When enabled, it is automatically multiplied by the number of guests in every booking and added to the tourist&apos;s total payment and ticket.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Active Status Toggle */}
          <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Require Entrance Fee</p>
              <p className="text-xs text-muted-foreground">
                When enabled, tourists booking any package at {destination.title} will automatically have the entrance fee included in their payment.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-75 ${
                  isActive ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${isActive ? "text-emerald-700" : "text-muted-foreground"}`}>
                {isActive ? "Active (Included in payment)" : "Disabled"}
              </span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Fee Title */}
            <div className="space-y-2">
              <label htmlFor="entranceFeeTitle" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fee Label / Title
              </label>
              <Input
                id="entranceFeeTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Entrance Fee, Environmental Fee"
                className="h-10 text-sm"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                This label will be shown in the booking breakdown, receipt, and ticket passes.
              </p>
            </div>

            {/* Fee Amount */}
            <div className="space-y-2">
              <label htmlFor="entranceFeeAmount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fee Amount per Guest (₱ PHP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">₱</span>
                <Input
                  id="entranceFeeAmount"
                  type="number"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50"
                  className="h-10 pl-7 text-sm font-medium"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Charged once per visitor in the booking party.
              </p>
            </div>
          </div>

          {/* Real-time Calculation Preview Card */}
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Sample Calculation Preview</span>
            </div>
            <div className="text-xs text-slate-700 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Guest Count:</span>
                <span className="font-semibold">2 guests</span>
              </div>
              <div className="flex justify-between">
                <span>{title || "Entrance Fee"}:</span>
                <span className="font-bold text-emerald-700">
                  {isActive
                    ? `${formatPesoCurrency(numericAmount)} × 2 = ${formatPesoCurrency(numericAmount * 2)}`
                    : "₱0.00 (Disabled)"}
                </span>
              </div>
              <div className="flex justify-between border-t border-emerald-200/60 pt-1.5 text-slate-900">
                <span>Total automatically added to booking:</span>
                <span className="font-bold">{isActive ? formatPesoCurrency(numericAmount * 2) : "₱0.00"}</span>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {successMessage}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving} className="min-w-[140px]">
              {isSaving ? "Saving..." : "Save entrance fee"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
