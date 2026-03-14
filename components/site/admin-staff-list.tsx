import type { Route } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AdminDeleteStaffForm } from "@/components/forms/admin-delete-staff-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const visibleStaff = typeof limit === "number" ? staff.slice(0, limit) : staff;

  if (visibleStaff.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ProgressiveList
      initialCount={
        typeof limit === "number"
          ? visibleStaff.length + (showViewAllLink && staff.length > visibleStaff.length ? 1 : 0)
          : 5
      }
      step={5}
      maxHeightClass="max-h-[34rem]"
      className="space-y-3.5"
      showMoreLabel="Show more staff"
      showLessLabel="Show fewer staff"
    >
      {visibleStaff.map((staffMember) => {
        const assignedDestination =
          listings.find((listing) => listing.staff_id === staffMember.id) ?? null;

        return (
          <div
            key={staffMember.id}
            className="grid gap-4 rounded-[1rem] border border-border/70 bg-card/85 p-4 xl:grid-cols-[minmax(0,1.05fr),minmax(0,0.95fr),auto]"
          >
            <div className="space-y-1">
              <p className="font-medium">{staffMember.full_name ?? staffMember.email}</p>
              <p className="text-sm text-muted-foreground">{staffMember.email}</p>
            </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {assignedDestination?.title ?? "Destination not assigned"}
                </p>
                <div className="flex flex-wrap gap-2">
                <Badge variant={assignedDestination ? "default" : "muted"}>
                  {assignedDestination?.location_text ?? "Location not set"}
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

            <div className="grid gap-2.5 pt-2 sm:flex sm:flex-wrap sm:items-start lg:justify-end">
              <Link href={`/admin/staff/${staffMember.id}` as Route}>
                <Button variant="outline" size="sm" className="min-h-11 w-full sm:w-auto">
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
  );
}
