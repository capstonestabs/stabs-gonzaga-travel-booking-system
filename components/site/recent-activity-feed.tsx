import { CalendarCheck2, PackagePlus, UserPlus } from "lucide-react";

import type { ActivityItem, ActivityType } from "@/lib/types";

const ICONS: Record<ActivityType, typeof CalendarCheck2> = {
  booking: CalendarCheck2,
  tourist: UserPlus,
  service: PackagePlus
};

const ICON_STYLES: Record<ActivityType, string> = {
  booking: "bg-emerald-100 text-emerald-700",
  tourist: "bg-blue-100 text-blue-700",
  service: "bg-amber-100 text-amber-700"
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  return {
    datePart: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    timePart: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  };
}

export function RecentActivityFeed({ activity }: { activity: ActivityItem[] }) {
  if (activity.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[0.9rem] border border-dashed border-border/70 text-sm text-muted-foreground">
        No recent activity yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/70">
      {activity.map((item) => {
        const Icon = ICONS[item.type];
        const { datePart, timePart } = formatTimestamp(item.timestamp);
        return (
          <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ICON_STYLES[item.type]}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.subtitle || "—"}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">{datePart}</p>
              <p className="text-xs text-muted-foreground">{timePart}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}