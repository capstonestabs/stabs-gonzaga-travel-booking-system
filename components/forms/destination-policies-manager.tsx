"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Destination } from "@/lib/types";

export function DestinationPoliciesManager({ destination }: { destination: Destination }) {
  const router = useRouter();
  const [policies, setPolicies] = useState<string[]>(destination.policies ?? []);
  const [newPolicy, setNewPolicy] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleAddPolicy() {
    const trimmed = newPolicy.trim();
    if (!trimmed) return;
    setPolicies((prev) => [...prev, trimmed]);
    setNewPolicy("");
  }

  function handleRemovePolicy(index: number) {
    setPolicies((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdatePolicy(index: number, text: string) {
    setPolicies((prev) => prev.map((item, i) => (i === index ? text : item)));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          policies: policies.map((p) => p.trim()).filter(Boolean)
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? `Failed to update rules and policies (Status ${response.status}).`);
      }

      setSuccessMessage("Rules and policies updated successfully!");
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      if (err?.name === "TypeError" || err?.message?.includes("Failed to fetch")) {
        setErrorMessage("Network connection issue. Please check your internet connection and try again.");
      } else {
        setErrorMessage(err?.message || "Unable to save rules and policies.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold">Rules & Policies</CardTitle>
            <CardDescription className="text-xs">
              Manage the guidelines, dress codes, check-in instructions, and visitor rules displayed to tourists on the destination page and booking checkout.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newPolicy}
                onChange={(e) => setNewPolicy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPolicy();
                  }
                }}
                placeholder="e.g. Swimming attire required in pool area"
                className="h-10 text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddPolicy}
                className="shrink-0"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Rule
              </Button>
            </div>

            {policies.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No rules or policies added yet. Type a guideline above and click &quot;Add Rule&quot;.
              </div>
            ) : (
              <div className="space-y-2">
                {policies.map((policy, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border border-border/70 bg-card p-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={policy}
                      onChange={(e) => handleUpdatePolicy(index, e.target.value)}
                      className="flex-1 bg-transparent text-sm focus:outline-none text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePolicy(index)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      title="Remove rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              {isSaving ? "Saving..." : "Save policies"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
