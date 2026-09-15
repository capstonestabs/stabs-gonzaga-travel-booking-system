"use client";

import { useState } from "react";

import { AdminTouristList } from "@/components/site/admin-tourist-list";
import type { AdminDashboardData, AppUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AdminTouristAccountsPanel({
  activeTourists,
  archivedTourists,
  bookingActivity
}: {
  activeTourists: AppUser[];
  archivedTourists: AppUser[];
  bookingActivity: AdminDashboardData["bookingActivity"];
}) {
  const [view, setView] = useState<"active" | "archived">("active");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-sm border border-slate-200 bg-slate-50 p-0.5">
        <button
          type="button"
          onClick={() => setView("active")}
          className={cn(
            "rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors",
            view === "active" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Active ({activeTourists.length})
        </button>
        <button
          type="button"
          onClick={() => setView("archived")}
          className={cn(
            "rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors",
            view === "archived" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Archived ({archivedTourists.length})
        </button>
      </div>

      {view === "active" ? (
        <AdminTouristList
          key="active"
          tourists={activeTourists}
          bookingActivity={bookingActivity}
          emptyMessage="No tourist accounts have been created yet."
          mode="active"
        />
      ) : (
        <AdminTouristList
          key="archived"
          tourists={archivedTourists}
          bookingActivity={bookingActivity}
          emptyMessage="No archived tourist accounts."
          mode="archived"
        />
      )}
    </div>
  );
}