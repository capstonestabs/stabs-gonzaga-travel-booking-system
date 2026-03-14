import { CalendarDays, History, UserRound } from "lucide-react";

import { AdminDeleteTouristForm } from "@/components/forms/admin-delete-tourist-form";
import { Badge } from "@/components/ui/badge";
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
  const visibleTourists = typeof limit === "number" ? tourists.slice(0, limit) : tourists;

  if (visibleTourists.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ProgressiveList
      initialCount={typeof limit === "number" ? visibleTourists.length : 6}
      step={6}
      maxHeightClass="max-h-[34rem]"
      className="space-y-3.5"
      showMoreLabel="Show more tourists"
      showLessLabel="Show fewer tourists"
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
            className="grid gap-4 rounded-[1rem] border border-border/70 bg-card/85 p-4 xl:grid-cols-[minmax(0,1.05fr),minmax(0,0.95fr),auto]"
          >
            <div className="space-y-1">
              <p className="font-medium">{tourist.full_name ?? tourist.email}</p>
              <p className="text-sm text-muted-foreground">{tourist.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Tourist account activity</p>
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

            <div className="grid gap-2.5 pt-2 sm:flex sm:flex-wrap sm:items-start lg:justify-end">
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
  );
}
