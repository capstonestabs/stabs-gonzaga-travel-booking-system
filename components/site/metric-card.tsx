import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  MapPinned,
  Ticket,
  Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardMetric } from "@/lib/types";

function getMetricIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("booking")) return ClipboardList;
  if (normalized.includes("ticket")) return Ticket;
  if (normalized.includes("destination")) return MapPinned;
  if (normalized.includes("staff") || normalized.includes("guest") || normalized.includes("tourist"))
    return Users;
  if (normalized.includes("complete")) return CheckCircle2;
  if (normalized.includes("waiting") || normalized.includes("pending")) return Clock3;
  if (normalized.includes("revenue") || normalized.includes("payout")) return CircleDollarSign;

  return Banknote;
}

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = getMetricIcon(metric.label);

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {metric.label}
          </p>
          <span className="flex h-8 w-8 items-center justify-center rounded-[0.85rem] border border-border/70 bg-secondary/55 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="font-display text-[1.55rem] font-semibold tracking-tight sm:text-[1.9rem]">
            {metric.value}
          </p>
          <CalendarDays className="mb-1 h-4 w-4 text-primary/55" />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{metric.helper}</p>
      </CardContent>
    </Card>
  );
}
