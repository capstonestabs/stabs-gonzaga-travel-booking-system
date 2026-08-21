"use client";

import { useMemo, useState } from "react";
import { CalendarDays, History, UserRound } from "lucide-react";
import { Search } from "lucide-react";

import { AdminDeleteTouristForm } from "@/components/forms/admin-delete-tourist-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProgressiveList } from "@/components/ui/progressive-list";
import type { AdminDashboardData, AppUser } from "@/lib/types";

export function AdminTouristList({
  tourists,
  bookingActivity,
  emptyMessage,
  limit,
  showViewAllHint = false
}: {
  tourists: AppUser[];
  bookingActivity: AdminDashboardData["bookingActivity"];
  emptyMessage: string;
  limit?: number;
  showViewAllHint?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filteredTourists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return tourists;
    }
    return tourists.filter((tourist) =>
      [tourist.full_name, tourist.email].some((value) =>
        value?.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [query, tourists]);
  const visibleTourists = typeof limit === "number" ? filteredTourists.slice(0, limit) : filteredTourists;

  if (tourists.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tourist accounts"
            aria-label="Search tourist accounts"
            className="pl-9"
          />
        </label>
        <p className="text-xs text-muted-foreground">{filteredTourists.length} result{filteredTourists.length === 1 ? "" : "s"}</p>
      </div>

    <ProgressiveList
      initialCount={typeof limit === "number" ? visibleTourists.length : 6}
      step={6}
      maxHeightClass="max-h-[34rem]"
      className="space-y-3"
      showMoreLabel="Show more tourists"
      showLessLabel="Show fewer tourists"
      emptyMessage="No tourist accounts match your search."
    >
      {visibleTourists.map((tourist) => {
        const touristBookings = bookingActivity.filter((booking) => booking.user_id === tourist.id);
        const activeBookings = touristBookings.filter(
          (booking) => booking.status === "pending_payment" || booking.status === "confirmed"
        );
        const historyBookings = touristBookings.filter(
          (booking) => booking.status === "completed" || booking.status === "cancelled"
        );

        return (
          <div
            key={tourist.id}
            className="grid gap-3 rounded-[1rem] border border-border/70 bg-card/85 p-3.5 transition hover:border-primary/15 hover:bg-card md:grid-cols-[minmax(0,1fr),minmax(0,1fr),auto] md:items-center"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-[0.85rem] bg-secondary">
                {tourist.avatar_url ? (
                  <img
                    src={tourist.avatar_url}
                    alt={tourist.full_name ?? tourist.email}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-primary">
                    <UserRound className="h-4 w-4" />
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{tourist.full_name ?? tourist.email}</p>
                <p className="truncate text-xs text-muted-foreground">{tourist.email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Account activity</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={activeBookings.length > 0 ? "warning" : "success"}>
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  {activeBookings.length} active
                </Badge>
                <Badge variant="muted">
                  <History className="mr-1.5 h-3.5 w-3.5" />
                  {historyBookings.length} history
                </Badge>
                <Badge variant="muted">
                  <UserRound className="mr-1.5 h-3.5 w-3.5" />
                  created {new Date(tourist.created_at).toLocaleDateString()}
                </Badge>
              </div>
            </div>

            <div className="md:flex md:justify-end">
              <AdminDeleteTouristForm
                touristId={tourist.id}
                touristName={tourist.full_name ?? tourist.email}
                variant="inline"
              />
            </div>
          </div>
        );
      })}

      {showViewAllHint && tourists.length > visibleTourists.length ? (
        <p className="pt-2 text-sm text-muted-foreground">
          Open the tourist accounts page to manage the full list.
        </p>
      ) : null}
    </ProgressiveList>
    </div>
  );
}
