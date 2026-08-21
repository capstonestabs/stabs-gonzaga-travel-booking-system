import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Map,
  Minus,
  Ticket,
  UserRound,
  Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardMetric } from "@/lib/types";

function getMetricVisual(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("booking")) {
    return { icon: ClipboardList, bg: "bg-emerald-50", fg: "text-emerald-600" };
  }
  if (normalized.includes("ticket")) {
    return { icon: Ticket, bg: "bg-sky-50", fg: "text-sky-600" };
  }
  if (normalized.includes("destination")) {
    return { icon: Map, bg: "bg-amber-50", fg: "text-amber-600" };
  }
  if (normalized.includes("staff")) {
    return { icon: UserRound, bg: "bg-violet-50", fg: "text-violet-600" };
  }
  if (normalized.includes("guest") || normalized.includes("tourist")) {
    return { icon: Users, bg: "bg-blue-50", fg: "text-blue-600" };
  }
  if (normalized.includes("complete")) {
    return { icon: CheckCircle2, bg: "bg-emerald-50", fg: "text-emerald-600" };
  }
  if (normalized.includes("waiting") || normalized.includes("pending")) {
    return { icon: Clock3, bg: "bg-amber-50", fg: "text-amber-600" };
  }
  if (normalized.includes("revenue") || normalized.includes("payout")) {
    return { icon: CircleDollarSign, bg: "bg-emerald-50", fg: "text-emerald-600" };
  }

  return { icon: Banknote, bg: "bg-muted", fg: "text-muted-foreground" };
}

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const { icon: Icon, bg, fg } = getMetricVisual(metric.label);
  const trend = metric.trend;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-2 p-3.5 sm:p-4">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem]", bg, fg)}>
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="font-display text-[1.25rem] font-bold tracking-tight text-foreground sm:text-[1.55rem]">
              {metric.value}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold",
                trend.direction === "up" && "text-emerald-600",
                trend.direction === "down" && "text-red-600",
                trend.direction === "neutral" && "text-muted-foreground"
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : trend.direction === "down" ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              {trend.label}
            </span>
          ) : null}
          <span className="text-muted-foreground">{metric.helper}</span>
        </div>
      </CardContent>
    </Card>
  );
}