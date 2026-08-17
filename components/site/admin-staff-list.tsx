"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, MapPin, Search, UserRound } from "lucide-react";

import { AdminDeleteStaffForm } from "@/components/forms/admin-delete-staff-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressiveList } from "@/components/ui/progressive-list";
import type { Destination, UserWithStaffProfile } from "@/lib/types";

export function AdminStaffList({
  staff,
  listings,
  emptyMessage,
  limit,
  showViewAllLink = false
}: {
  staff: UserWithStaffProfile[];
  listings: Destination[];
  emptyMessage: string;
  limit?: number;
  showViewAllLink?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filteredStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return staff;
    }

    return staff.filter((staffMember) => {
      const assignedDestination = listings.find((listing) => listing.staff_id === staffMember.id);
      return [
        staffMember.full_name,
        staffMember.email,
        assignedDestination?.title,
        assignedDestination?.location_text
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [listings, query, staff]);
  const visibleStaff = typeof limit === "number" ? filteredStaff.slice(0, limit) : filteredStaff;

  if (staff.length === 0) {
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
            placeholder="Search staff or destination"
            aria-label="Search staff accounts"
            className="pl-9"
          />
        </label>
        <p className="text-xs text-muted-foreground">{filteredStaff.length} result{filteredStaff.length === 1 ? "" : "s"}</p>
      </div>

    <ProgressiveList
      initialCount={
        typeof limit === "number"
          ? visibleStaff.length + (showViewAllLink && staff.length > visibleStaff.length ? 1 : 0)
          : 5
      }
      step={5}
      maxHeightClass="max-h-[34rem]"
      className="space-y-3"
      showMoreLabel="Show more staff"
      showLessLabel="Show fewer staff"
      emptyMessage="No staff accounts match your search."
    >
      {visibleStaff.map((staffMember) => {
        const assignedDestination =
          listings.find((listing) => listing.staff_id === staffMember.id) ?? null;

        return (
          <div
            key={staffMember.id}
            className="grid gap-3 rounded-[1rem] border border-border/70 bg-card/85 p-3.5 transition hover:border-primary/15 hover:bg-card md:grid-cols-[minmax(0,1fr),minmax(0,1fr),auto] md:items-center"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-secondary text-primary">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{staffMember.full_name ?? staffMember.email}</p>
                <p className="truncate text-xs text-muted-foreground">{staffMember.email}</p>
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
                <p className="truncate text-sm font-medium">
                  {assignedDestination?.title ?? "Destination not assigned"}
                </p>
                <div className="flex flex-wrap gap-2">
                <Badge variant={assignedDestination ? "default" : "muted"}>
                  <MapPin className="mr-1 h-3 w-3" />
                  <span className="max-w-40 truncate">{assignedDestination?.location_text ?? "Location not set"}</span>
                </Badge>
                  <Badge
                    variant={
                      assignedDestination?.status === "published" ? "success" : "muted"
                    }
                  >
                    {assignedDestination?.status ?? "unassigned"}
                  </Badge>
                  {assignedDestination ? (
                    <Badge variant="muted">
                      {assignedDestination.destination_services?.length ?? 0} service
                      {(assignedDestination.destination_services?.length ?? 0) === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:justify-end">
              <Link href={`/admin/staff/${staffMember.id}` as Route}>
                <Button variant="outline" size="sm" className="w-full md:w-auto">
                  Manage
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <AdminDeleteStaffForm
                staffId={staffMember.id}
                staffName={staffMember.full_name ?? staffMember.email}
                variant="inline"
              />
            </div>
          </div>
        );
      })}

      {showViewAllLink && staff.length > visibleStaff.length ? (
        <div className="pt-2">
          <Link href={"/admin/staff" as Route}>
            <Button variant="secondary" size="sm">
              View all staff accounts
            </Button>
          </Link>
        </div>
      ) : null}
    </ProgressiveList>
    </div>
  );
}
